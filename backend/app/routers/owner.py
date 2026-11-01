from collections import defaultdict
from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.database import get_db
from app.deps import require_owner
from app.models import Booking, BookingStatus, Campaign, Screen, ScreenStatus, TransactionType, User, WalletTransaction
from app.routers.serializers import owner_booking_out
from app.schemas.campaigns import BookingDecision, OwnerBookingOut, TransactionOut
from app.schemas.common import Message
from app.schemas.screens import ScreenCreate, ScreenOwnerView, ScreenUpdate
from app.services import wallet

router = APIRouter(prefix="/api/owner", tags=["screen owner"])


def _own_screen(db: Session, user: User, screen_id: int) -> Screen:
    screen = db.scalar(select(Screen).where(Screen.id == screen_id, Screen.owner_id == user.id))
    if screen is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Screen not found")
    return screen


@router.get("/screens", response_model=list[ScreenOwnerView])
def list_my_screens(user: User = Depends(require_owner), db: Session = Depends(get_db)) -> list[Screen]:
    return list(db.scalars(select(Screen).where(Screen.owner_id == user.id).order_by(Screen.created_at.desc())))


@router.get("/screens/{screen_id}", response_model=ScreenOwnerView)
def get_my_screen(screen_id: int, user: User = Depends(require_owner), db: Session = Depends(get_db)) -> Screen:
    return _own_screen(db, user, screen_id)


@router.post("/screens", response_model=ScreenOwnerView, status_code=status.HTTP_201_CREATED)
def create_screen(data: ScreenCreate, user: User = Depends(require_owner), db: Session = Depends(get_db)) -> Screen:
    screen = Screen(**data.model_dump(), owner_id=user.id, status=ScreenStatus.pending)
    db.add(screen)
    db.commit()
    return screen


@router.put("/screens/{screen_id}", response_model=ScreenOwnerView)
def update_screen(
    screen_id: int, data: ScreenUpdate, user: User = Depends(require_owner), db: Session = Depends(get_db)
) -> Screen:
    screen = _own_screen(db, user, screen_id)
    for key, value in data.model_dump().items():
        setattr(screen, key, value)
    if screen.status == ScreenStatus.rejected:
        screen.status = ScreenStatus.pending
        screen.review_note = None
    db.commit()
    return screen


@router.delete("/screens/{screen_id}", response_model=Message)
def delete_screen(screen_id: int, user: User = Depends(require_owner), db: Session = Depends(get_db)) -> Message:
    screen = _own_screen(db, user, screen_id)
    has_bookings = db.scalar(select(Booking.id).where(Booking.screen_id == screen.id).limit(1))
    if has_bookings:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "This screen has booking history. Deactivate it instead of deleting."
        )
    db.delete(screen)
    db.commit()
    return Message(detail="Screen deleted")


def _bookings_query(user: User):
    return (
        select(Booking)
        .join(Screen)
        .where(Screen.owner_id == user.id)
        .options(
            joinedload(Booking.screen),
            joinedload(Booking.campaign).joinedload(Campaign.advertiser),
        )
    )


@router.get("/bookings", response_model=list[OwnerBookingOut])
def list_bookings(
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
    status_filter: BookingStatus | None = Query(default=None, alias="status"),
) -> list[OwnerBookingOut]:
    stmt = _bookings_query(user).order_by(Booking.created_at.desc())
    if status_filter:
        stmt = stmt.where(Booking.status == status_filter)
    return [owner_booking_out(b) for b in db.scalars(stmt).unique()]


def _decide(db: Session, user: User, booking_id: int, approve: bool, note: str | None) -> OwnerBookingOut:
    booking = db.scalar(_bookings_query(user).where(Booking.id == booking_id).with_for_update(of=Booking))
    if booking is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    if booking.status != BookingStatus.pending:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only pending bookings can be approved or rejected")
    booking.decision_note = note
    booking.decided_at = datetime.now(UTC)
    if approve:
        booking.status = BookingStatus.approved
        wallet.record(
            db,
            user.id,
            TransactionType.earning,
            booking.owner_share,
            f"Earning: {booking.screen.name} ({booking.campaign.name})",
            booking.id,
        )
    else:
        booking.status = BookingStatus.rejected
        wallet.record(
            db,
            booking.campaign.advertiser_id,
            TransactionType.refund,
            booking.amount,
            f"Refund: {booking.screen.name} (declined by owner)",
            booking.id,
        )
    db.commit()
    return owner_booking_out(booking)


@router.post("/bookings/{booking_id}/approve", response_model=OwnerBookingOut)
def approve_booking(
    booking_id: int, data: BookingDecision, user: User = Depends(require_owner), db: Session = Depends(get_db)
) -> OwnerBookingOut:
    return _decide(db, user, booking_id, True, data.note)


@router.post("/bookings/{booking_id}/reject", response_model=OwnerBookingOut)
def reject_booking(
    booking_id: int, data: BookingDecision, user: User = Depends(require_owner), db: Session = Depends(get_db)
) -> OwnerBookingOut:
    return _decide(db, user, booking_id, False, data.note)


class MonthPoint(BaseModel):
    month: str
    amount: int


class ScreenEarning(BaseModel):
    screen_id: int
    screen_name: str
    bookings: int
    amount: int


class OwnerSummary(BaseModel):
    screens_total: int
    screens_by_status: dict[str, int]
    pending_bookings: int
    active_bookings: int
    total_earnings: int
    earnings_by_month: list[MonthPoint]
    earnings_by_screen: list[ScreenEarning]
    transactions: list[TransactionOut]


@router.get("/summary", response_model=OwnerSummary)
def summary(user: User = Depends(require_owner), db: Session = Depends(get_db)) -> OwnerSummary:
    screens = db.scalars(select(Screen).where(Screen.owner_id == user.id).options(selectinload(Screen.bookings))).all()
    today = date.today()
    by_status: dict[str, int] = defaultdict(int)
    pending = active = 0
    month: dict[str, int] = defaultdict(int)
    per_screen: list[ScreenEarning] = []
    for s in screens:
        by_status[s.status.value if s.is_active else "inactive"] += 1
        row = ScreenEarning(screen_id=s.id, screen_name=s.name, bookings=0, amount=0)
        for b in s.bookings:
            if b.status == BookingStatus.pending:
                pending += 1
            elif b.status == BookingStatus.approved:
                if b.start_date <= today <= b.end_date:
                    active += 1
                row.bookings += 1
                row.amount += b.owner_share
                month[b.start_date.strftime("%Y-%m")] += b.owner_share
        per_screen.append(row)
    txs = db.scalars(
        select(WalletTransaction)
        .where(WalletTransaction.user_id == user.id)
        .order_by(WalletTransaction.created_at.desc(), WalletTransaction.id.desc())
        .limit(100)
    ).all()
    return OwnerSummary(
        screens_total=len(screens),
        screens_by_status=dict(by_status),
        pending_bookings=pending,
        active_bookings=active,
        total_earnings=wallet.balance(db, user.id),
        earnings_by_month=[MonthPoint(month=m, amount=a) for m, a in sorted(month.items())],
        earnings_by_screen=sorted(per_screen, key=lambda r: r.amount, reverse=True),
        transactions=[TransactionOut.model_validate(t) for t in txs],
    )
