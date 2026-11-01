from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator, model_validator

from app.config import get_settings
from app.models import BookingStatus, TransactionType
from app.schemas.common import ORMModel


class CampaignCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    objective: str | None = Field(default=None, max_length=255)
    creative_url: str = Field(max_length=500)
    start_date: date
    end_date: date
    screen_ids: list[int] = Field(min_length=1, max_length=20)

    @field_validator("creative_url")
    @classmethod
    def _creative(cls, v: str) -> str:
        if not get_settings().is_uploaded_url(v):
            raise ValueError("Upload your ad creative first")
        return v

    @model_validator(mode="after")
    def _dates(self) -> "CampaignCreate":
        if self.end_date < self.start_date:
            raise ValueError("End date must be on or after the start date")
        if (self.end_date - self.start_date).days > 365:
            raise ValueError("Campaigns can run for at most one year")
        self.screen_ids = list(dict.fromkeys(self.screen_ids))
        return self


class BookingScreen(ORMModel):
    id: int
    name: str
    city: str
    image_url: str | None


class BookingCampaign(ORMModel):
    id: int
    name: str
    creative_url: str
    creative_type: str


class BookingOut(ORMModel):
    id: int
    campaign_id: int
    screen_id: int
    start_date: date
    end_date: date
    amount: int
    owner_share: int
    status: BookingStatus
    decision_note: str | None
    decided_at: datetime | None
    created_at: datetime
    screen: BookingScreen


class OwnerBookingOut(BookingOut):
    campaign: BookingCampaign
    advertiser_name: str


class AdminBookingOut(OwnerBookingOut):
    owner_name: str


class CampaignOut(BaseModel):
    id: int
    name: str
    objective: str | None
    creative_url: str
    creative_type: str
    start_date: date
    end_date: date
    status: str
    total_amount: int
    created_at: datetime
    bookings: list[BookingOut]


class AdminCampaignOut(CampaignOut):
    advertiser_id: int
    advertiser_name: str


class BookingDecision(BaseModel):
    note: str | None = Field(default=None, max_length=500)


class TransactionOut(ORMModel):
    id: int
    type: TransactionType
    amount: int
    description: str
    booking_id: int | None
    is_simulated: bool
    created_at: datetime


class AdminTransactionOut(TransactionOut):
    user_id: int
    user_name: str
    user_role: str


class WalletOut(BaseModel):
    balance: int
    payments_mode: str
    max_topup_amount: int
    transactions: list[TransactionOut]


class TopupIn(BaseModel):
    amount: int = Field(ge=100)


class PaymentOrderOut(BaseModel):
    order_id: str
    key_id: str
    amount: int
    amount_paise: int
    currency: str
    prefill_name: str
    prefill_email: str
    prefill_contact: str | None


class PaymentVerifyIn(BaseModel):
    razorpay_order_id: str = Field(max_length=64)
    razorpay_payment_id: str = Field(max_length=64)
    razorpay_signature: str = Field(max_length=128)
