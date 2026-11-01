from collections import defaultdict
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.config import get_settings
from app.database import get_db
from app.deps import require_advertiser
from app.models import Booking, BookingStatus, Campaign, PaymentOrder, Screen, ScreenStatus, TransactionType, User
from app.routers.serializers import campaign_out
from app.schemas.campaigns import (
    CampaignCreate,
    CampaignOut,
    PaymentOrderOut,
    PaymentVerifyIn,
    TopupIn,
    TransactionOut,
    WalletOut,
)
from app.services import payments, razorpay, wallet
from app.services.pricing import booking_amount, owner_share

router = APIRouter(prefix="/api/advertiser", tags=["advertiser"])


def _load_campaign(db: Session, user: User, campaign_id: int) -> Campaign:
    c = db.scalar(
        select(Campaign)
        .where(Campaign.id == campaign_id, Campaign.advertiser_id == user.id)
        .options(selectinload(Campaign.bookings).selectinload(Booking.screen))
    )
    if c is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Campaign not found")
    return c


@router.get("/campaigns", response_model=list[CampaignOut])
def list_campaigns(user: User = Depends(require_advertiser), db: Session = Depends(get_db)) -> list[CampaignOut]:
    campaigns = db.scalars(
        select(Campaign)
        .where(Campaign.advertiser_id == user.id)
        .options(selectinload(Campaign.bookings).selectinload(Booking.screen))
        .order_by(Campaign.created_at.desc())
    ).all()
    return [campaign_out(c) for c in campaigns]


@router.get("/campaigns/{campaign_id}", response_model=CampaignOut)
def get_campaign(
    campaign_id: int, user: User = Depends(require_advertiser), db: Session = Depends(get_db)
) -> CampaignOut:
    return campaign_out(_load_campaign(db, user, campaign_id))


@router.post("/campaigns", response_model=CampaignOut, status_code=status.HTTP_201_CREATED)
def create_campaign(
    data: CampaignCreate, user: User = Depends(require_advertiser), db: Session = Depends(get_db)
) -> CampaignOut:
    if data.start_date <= date.today():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Campaigns must start from tomorrow onwards")

    # Lock the advertiser row so concurrent bookings can't overspend the wallet.
    db.execute(select(User.id).where(User.id == user.id).with_for_update())

    screens = db.scalars(
        select(Screen)
        .where(Screen.id.in_(data.screen_ids), Screen.status == ScreenStatus.approved, Screen.is_active.is_(True))
        .with_for_update()
    ).all()
    if len(screens) != len(data.screen_ids):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "One or more selected screens are not available")

    for s in screens:
        overlapping = db.scalar(
            select(func.count(Booking.id)).where(
                Booking.screen_id == s.id,
                Booking.status.in_([BookingStatus.pending, BookingStatus.approved]),
                Booking.start_date <= data.end_date,
                Booking.end_date >= data.start_date,
            )
        )
        if (overlapping or 0) >= s.ad_slots:
            raise HTTPException(status.HTTP_409_CONFLICT, f"'{s.name}' is fully booked for the selected dates")

    amounts = {s.id: booking_amount(s.price_per_month, data.start_date, data.end_date) for s in screens}
    total = sum(amounts.values())
    available = wallet.balance(db, user.id)
    if available < total:
        raise HTTPException(
            status.HTTP_402_PAYMENT_REQUIRED,
            f"Insufficient wallet balance. Required ₹{total:,}, available ₹{available:,}.",
        )

    ext = data.creative_url.rsplit(".", 1)[-1].lower()
    campaign = Campaign(
        advertiser_id=user.id,
        name=data.name.strip(),
        objective=data.objective,
        creative_url=data.creative_url,
        creative_type="video" if ext == "mp4" else "image",
        start_date=data.start_date,
        end_date=data.end_date,
    )
    db.add(campaign)
    db.flush()
    for s in screens:
        amount = amounts[s.id]
        booking = Booking(
            campaign_id=campaign.id,
            screen_id=s.id,
            start_date=data.start_date,
            end_date=data.end_date,
            amount=amount,
            owner_share=owner_share(amount),
        )
        db.add(booking)
        db.flush()
        wallet.record(
            db, user.id, TransactionType.booking_charge, -amount, f"Booking: {s.name} ({campaign.name})", booking.id
        )
    db.commit()
    return campaign_out(_load_campaign(db, user, campaign.id))


@router.post("/campaigns/{campaign_id}/cancel", response_model=CampaignOut)
def cancel_campaign(
    campaign_id: int, user: User = Depends(require_advertiser), db: Session = Depends(get_db)
) -> CampaignOut:
    c = _load_campaign(db, user, campaign_id)
    if c.is_cancelled:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Campaign is already cancelled")
    if c.start_date <= date.today():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Campaigns can only be cancelled before they start")
    for b in c.bookings:
        if b.status in (BookingStatus.pending, BookingStatus.approved):
            if b.status == BookingStatus.approved:
                wallet.record(
                    db,
                    b.screen.owner_id,
                    TransactionType.earning_reversal,
                    -b.owner_share,
                    f"Advertiser cancelled: {b.screen.name}",
                    b.id,
                )
            wallet.record(db, user.id, TransactionType.refund, b.amount, f"Refund: {b.screen.name} (cancelled)", b.id)
            b.status = BookingStatus.cancelled
    c.is_cancelled = True
    db.commit()
    return campaign_out(_load_campaign(db, user, c.id))


@router.get("/wallet", response_model=WalletOut)
def get_wallet(user: User = Depends(require_advertiser), db: Session = Depends(get_db)) -> WalletOut:
    settings = get_settings()
    txs = db.scalars(
        select(wallet.WalletTransaction)
        .where(wallet.WalletTransaction.user_id == user.id)
        .order_by(wallet.WalletTransaction.created_at.desc(), wallet.WalletTransaction.id.desc())
        .limit(200)
    ).all()
    return WalletOut(
        balance=wallet.balance(db, user.id),
        payments_mode=settings.payments_mode,
        max_topup_amount=settings.max_topup_amount,
        transactions=[TransactionOut.model_validate(t) for t in txs],
    )


@router.post("/wallet/topup", response_model=WalletOut)
def topup(data: TopupIn, user: User = Depends(require_advertiser), db: Session = Depends(get_db)) -> WalletOut:
    settings = get_settings()
    if settings.payments_mode != "simulated":
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Online payments are not configured yet. Please contact support to add funds.",
        )
    if data.amount > settings.max_topup_amount:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Maximum top-up is ₹{settings.max_topup_amount:,}")
    wallet.record(db, user.id, TransactionType.topup, data.amount, "Simulated top-up (demo)", is_simulated=True)
    db.commit()
    return get_wallet(user, db)


def _require_razorpay() -> None:
    if get_settings().payments_mode != "razorpay":
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Online payments are not enabled.")


@router.post("/wallet/orders", response_model=PaymentOrderOut, status_code=status.HTTP_201_CREATED)
def create_payment_order(
    data: TopupIn, user: User = Depends(require_advertiser), db: Session = Depends(get_db)
) -> PaymentOrderOut:
    _require_razorpay()
    settings = get_settings()
    if data.amount > settings.max_topup_amount:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Maximum top-up is ₹{settings.max_topup_amount:,}")
    try:
        rp = razorpay.create_order(data.amount, receipt=f"wallet-{user.id}", notes={"user_id": str(user.id)})
    except razorpay.RazorpayError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Payment provider is unavailable. Please try again.") from e
    db.add(PaymentOrder(user_id=user.id, provider_order_id=rp["id"], amount=data.amount))
    db.commit()
    return PaymentOrderOut(
        order_id=rp["id"],
        key_id=settings.razorpay_key_id,
        amount=data.amount,
        amount_paise=data.amount * 100,
        currency="INR",
        prefill_name=user.full_name,
        prefill_email=user.email,
        prefill_contact=user.phone,
    )


@router.post("/wallet/orders/verify", response_model=WalletOut)
def verify_payment(
    data: PaymentVerifyIn, user: User = Depends(require_advertiser), db: Session = Depends(get_db)
) -> WalletOut:
    _require_razorpay()
    if not razorpay.verify_payment_signature(data.razorpay_order_id, data.razorpay_payment_id, data.razorpay_signature):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Payment could not be verified")
    if not payments.credit_paid_order(db, data.razorpay_order_id, data.razorpay_payment_id, user_id=user.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payment order not found")
    return get_wallet(user, db)


class MonthPoint(BaseModel):
    month: str
    amount: int


class ScreenSpend(BaseModel):
    screen_id: int
    screen_name: str
    city: str
    bookings: int
    amount: int


class AdvertiserSummary(BaseModel):
    wallet_balance: int
    total_spend: int
    campaigns_total: int
    campaigns_by_status: dict[str, int]
    bookings_by_status: dict[str, int]
    spend_by_month: list[MonthPoint]
    spend_by_screen: list[ScreenSpend]
    recent_campaigns: list[CampaignOut]


@router.get("/summary", response_model=AdvertiserSummary)
def summary(user: User = Depends(require_advertiser), db: Session = Depends(get_db)) -> AdvertiserSummary:
    campaigns = db.scalars(
        select(Campaign)
        .where(Campaign.advertiser_id == user.id)
        .options(selectinload(Campaign.bookings).selectinload(Booking.screen))
        .order_by(Campaign.created_at.desc())
    ).all()
    today = date.today()
    by_status: dict[str, int] = defaultdict(int)
    booking_status: dict[str, int] = defaultdict(int)
    month: dict[str, int] = defaultdict(int)
    per_screen: dict[int, ScreenSpend] = {}
    total = 0
    for c in campaigns:
        by_status[c.effective_status(today)] += 1
        for b in c.bookings:
            booking_status[b.status.value] += 1
            if b.status in (BookingStatus.pending, BookingStatus.approved):
                total += b.amount
                month[b.start_date.strftime("%Y-%m")] += b.amount
                row = per_screen.setdefault(
                    b.screen_id,
                    ScreenSpend(
                        screen_id=b.screen_id, screen_name=b.screen.name, city=b.screen.city, bookings=0, amount=0
                    ),
                )
                row.bookings += 1
                row.amount += b.amount
    return AdvertiserSummary(
        wallet_balance=wallet.balance(db, user.id),
        total_spend=total,
        campaigns_total=len(campaigns),
        campaigns_by_status=dict(by_status),
        bookings_by_status=dict(booking_status),
        spend_by_month=[MonthPoint(month=m, amount=a) for m, a in sorted(month.items())],
        spend_by_screen=sorted(per_screen.values(), key=lambda r: r.amount, reverse=True),
        recent_campaigns=[campaign_out(c, today) for c in campaigns[:5]],
    )
