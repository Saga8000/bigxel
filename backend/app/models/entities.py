import enum
from datetime import date, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _enum(cls: type[enum.Enum], name: str) -> Enum:
    return Enum(cls, name=name, values_callable=lambda e: [m.value for m in e])


class Role(enum.StrEnum):
    advertiser = "advertiser"
    screen_owner = "screen_owner"
    admin = "admin"


class ScreenStatus(enum.StrEnum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class BookingStatus(enum.StrEnum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    cancelled = "cancelled"


class TransactionType(enum.StrEnum):
    topup = "topup"
    booking_charge = "booking_charge"
    refund = "refund"
    earning = "earning"
    earning_reversal = "earning_reversal"


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True)
    full_name: Mapped[str] = mapped_column(String(120))
    company_name: Mapped[str | None] = mapped_column(String(160))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(_enum(Role, "user_role"), index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    token_version: Mapped[int] = mapped_column(Integer, default=0)

    screens: Mapped[list["Screen"]] = relationship(back_populates="owner")
    campaigns: Mapped[list["Campaign"]] = relationship(back_populates="advertiser")


class Screen(TimestampMixin, Base):
    __tablename__ = "screens"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(160))
    placement: Mapped[str] = mapped_column(String(160))
    address: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(80), index=True)
    state: Mapped[str] = mapped_column(String(80))
    area: Mapped[str | None] = mapped_column(String(80))
    category: Mapped[str] = mapped_column(String(60), index=True)
    screen_type: Mapped[str] = mapped_column(String(60))
    size_inches: Mapped[int] = mapped_column(Integer)
    resolution: Mapped[str] = mapped_column(String(20))
    daily_footfall: Mapped[int] = mapped_column(Integer)
    operating_hours: Mapped[str] = mapped_column(String(40))
    price_per_month: Mapped[int] = mapped_column(Integer, index=True)
    ad_slots: Mapped[int] = mapped_column(Integer, default=6)
    description: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(500))
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    status: Mapped[ScreenStatus] = mapped_column(
        _enum(ScreenStatus, "screen_status"), default=ScreenStatus.pending, index=True
    )
    review_note: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)

    owner: Mapped[User] = relationship(back_populates="screens")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="screen")


class Campaign(TimestampMixin, Base):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(primary_key=True)
    advertiser_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(160))
    objective: Mapped[str | None] = mapped_column(String(255))
    creative_url: Mapped[str] = mapped_column(String(500))
    creative_type: Mapped[str] = mapped_column(String(10))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    is_cancelled: Mapped[bool] = mapped_column(Boolean, default=False)

    advertiser: Mapped[User] = relationship(back_populates="campaigns")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="campaign", order_by="Booking.id")

    def effective_status(self, today: date) -> str:
        if self.is_cancelled:
            return "cancelled"
        statuses = {b.status for b in self.bookings}
        if BookingStatus.approved in statuses:
            if today > self.end_date:
                return "completed"
            if today >= self.start_date:
                return "active"
            return "scheduled"
        if BookingStatus.pending in statuses:
            return "pending_approval"
        return "rejected"


class Booking(TimestampMixin, Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), index=True)
    screen_id: Mapped[int] = mapped_column(ForeignKey("screens.id", ondelete="CASCADE"), index=True)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    amount: Mapped[int] = mapped_column(Integer)
    owner_share: Mapped[int] = mapped_column(Integer)
    status: Mapped[BookingStatus] = mapped_column(
        _enum(BookingStatus, "booking_status"), default=BookingStatus.pending, index=True
    )
    decision_note: Mapped[str | None] = mapped_column(String(500))
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    campaign: Mapped[Campaign] = relationship(back_populates="bookings")
    screen: Mapped[Screen] = relationship(back_populates="bookings")


class WalletTransaction(TimestampMixin, Base):
    """Append-only ledger. Positive amounts credit the user, negative debit."""

    __tablename__ = "wallet_transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    type: Mapped[TransactionType] = mapped_column(_enum(TransactionType, "transaction_type"), index=True)
    amount: Mapped[int] = mapped_column(Integer)
    description: Mapped[str] = mapped_column(String(255))
    booking_id: Mapped[int | None] = mapped_column(ForeignKey("bookings.id", ondelete="SET NULL"))
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped[User] = relationship()


class ContactMessage(TimestampMixin, Base):
    __tablename__ = "contact_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    kind: Mapped[str] = mapped_column(String(30), default="contact")
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(20))
    topic: Mapped[str] = mapped_column(String(60))
    message: Mapped[str] = mapped_column(Text, default="")
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False)


class PasswordResetToken(TimestampMixin, Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
