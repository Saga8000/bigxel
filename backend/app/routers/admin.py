from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.database import get_db
from app.deps import require_admin
from app.models import (
    Booking,
    BookingStatus,
    Campaign,
    ContactMessage,
    Role,
    Screen,
    ScreenStatus,
    User,
    WalletTransaction,
)
from app.routers.serializers import admin_booking_out, campaign_out
from app.schemas.auth import UserOut
from app.schemas.campaigns import AdminBookingOut, AdminCampaignOut, AdminTransactionOut, TransactionOut
from app.schemas.contact import ContactMessageOut
from app.schemas.screens import ScreenAdminView, ScreenOwnerView, ScreenReview

router = APIRouter(prefix="/api/admin", tags=["admin"])


class AdminSummary(BaseModel):
    users_by_role: dict[str, int]
    screens_by_status: dict[str, int]
    bookings_by_status: dict[str, int]
    campaigns_total: int
    booking_volume: int
    platform_fees: int
    unresolved_messages: int


@router.get("/summary", response_model=AdminSummary)
def summary(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> AdminSummary:
    users = dict(db.execute(select(User.role, func.count()).group_by(User.role)).all())
    screens = dict(db.execute(select(Screen.status, func.count()).group_by(Screen.status)).all())
    bookings = dict(db.execute(select(Booking.status, func.count()).group_by(Booking.status)).all())
    approved = db.execute(
        select(func.coalesce(func.sum(Booking.amount), 0), func.coalesce(func.sum(Booking.owner_share), 0)).where(
            Booking.status == BookingStatus.approved
        )
    ).one()
    return AdminSummary(
        users_by_role={k.value: v for k, v in users.items()},
        screens_by_status={k.value: v for k, v in screens.items()},
        bookings_by_status={k.value: v for k, v in bookings.items()},
        campaigns_total=db.scalar(select(func.count(Campaign.id))) or 0,
        booking_volume=int(approved[0]),
        platform_fees=int(approved[0]) - int(approved[1]),
        unresolved_messages=db.scalar(
            select(func.count(ContactMessage.id)).where(ContactMessage.is_resolved.is_(False))
        )
        or 0,
    )


@router.get("/users", response_model=list[UserOut])
def list_users(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
    role: Role | None = None,
    q: str | None = Query(default=None, max_length=100),
) -> list[User]:
    stmt = select(User).order_by(User.created_at.desc())
    if role:
        stmt = stmt.where(User.role == role)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(User.full_name.ilike(like), User.email.ilike(like), User.company_name.ilike(like)))
    return list(db.scalars(stmt.limit(500)))


class UserStatusIn(BaseModel):
    is_active: bool


@router.patch("/users/{user_id}", response_model=UserOut)
def set_user_status(
    user_id: int, data: UserStatusIn, admin: User = Depends(require_admin), db: Session = Depends(get_db)
) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if user.id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot deactivate your own account")
    user.is_active = data.is_active
    if not data.is_active:
        user.token_version += 1
    db.commit()
    return user


def _admin_screen(s: Screen) -> ScreenAdminView:
    return ScreenAdminView(
        **ScreenOwnerView.model_validate(s).model_dump(),
        owner_id=s.owner_id,
        owner_name=s.owner.full_name,
        owner_email=s.owner.email,
    )


@router.get("/screens", response_model=list[ScreenAdminView])
def list_screens(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
    status_filter: ScreenStatus | None = Query(default=None, alias="status"),
) -> list[ScreenAdminView]:
    stmt = select(Screen).options(joinedload(Screen.owner)).order_by(Screen.created_at.desc())
    if status_filter:
        stmt = stmt.where(Screen.status == status_filter)
    return [_admin_screen(s) for s in db.scalars(stmt)]


@router.post("/screens/{screen_id}/review", response_model=ScreenAdminView)
def review_screen(
    screen_id: int, data: ScreenReview, _: User = Depends(require_admin), db: Session = Depends(get_db)
) -> ScreenAdminView:
    screen = db.scalar(select(Screen).where(Screen.id == screen_id).options(joinedload(Screen.owner)))
    if screen is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Screen not found")
    if data.status == ScreenStatus.rejected and not data.note:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Add a note explaining why the screen was rejected")
    screen.status = data.status
    screen.review_note = data.note
    db.commit()
    return _admin_screen(screen)


@router.get("/campaigns", response_model=list[AdminCampaignOut])
def list_campaigns(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> list[AdminCampaignOut]:
    campaigns = db.scalars(
        select(Campaign)
        .options(selectinload(Campaign.bookings).selectinload(Booking.screen), joinedload(Campaign.advertiser))
        .order_by(Campaign.created_at.desc())
        .limit(500)
    ).all()
    return [
        AdminCampaignOut(
            **campaign_out(c).model_dump(),
            advertiser_id=c.advertiser_id,
            advertiser_name=c.advertiser.company_name or c.advertiser.full_name,
        )
        for c in campaigns
    ]


@router.get("/bookings", response_model=list[AdminBookingOut])
def list_bookings(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
    status_filter: BookingStatus | None = Query(default=None, alias="status"),
) -> list[AdminBookingOut]:
    stmt = (
        select(Booking)
        .options(
            joinedload(Booking.screen).joinedload(Screen.owner),
            joinedload(Booking.campaign).joinedload(Campaign.advertiser),
        )
        .order_by(Booking.created_at.desc())
        .limit(500)
    )
    if status_filter:
        stmt = stmt.where(Booking.status == status_filter)
    return [admin_booking_out(b) for b in db.scalars(stmt).unique()]


@router.get("/payments", response_model=list[AdminTransactionOut])
def list_payments(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> list[AdminTransactionOut]:
    txs = db.scalars(
        select(WalletTransaction)
        .options(joinedload(WalletTransaction.user))
        .order_by(WalletTransaction.created_at.desc(), WalletTransaction.id.desc())
        .limit(500)
    ).all()
    return [
        AdminTransactionOut(
            **TransactionOut.model_validate(t).model_dump(),
            user_id=t.user_id,
            user_name=t.user.full_name,
            user_role=t.user.role.value,
        )
        for t in txs
    ]


@router.get("/messages", response_model=list[ContactMessageOut])
def list_messages(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> list[ContactMessage]:
    return list(db.scalars(select(ContactMessage).order_by(ContactMessage.created_at.desc()).limit(500)))


class ResolveIn(BaseModel):
    is_resolved: bool


@router.patch("/messages/{message_id}", response_model=ContactMessageOut)
def resolve_message(
    message_id: int, data: ResolveIn, _: User = Depends(require_admin), db: Session = Depends(get_db)
) -> ContactMessage:
    msg = db.get(ContactMessage, message_id)
    if msg is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Message not found")
    msg.is_resolved = data.is_resolved
    db.commit()
    return msg
