from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.auth import _normalize_phone
from app.schemas.common import ORMModel

TOPICS = ["General enquiry", "Advertising", "Listing a screen", "Pricing", "Technical support", "Partnership"]


class ContactIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = None
    topic: str
    message: str = Field(min_length=10, max_length=4000)

    _phone = field_validator("phone")(_normalize_phone)

    @field_validator("topic")
    @classmethod
    def _topic(cls, v: str) -> str:
        if v not in TOPICS:
            raise ValueError("Choose a topic from the list")
        return v


class ScreenLeadIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    business_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    phone: str
    city: str = Field(min_length=2, max_length=80)
    screen_type: str = Field(min_length=2, max_length=60)

    _phone = field_validator("phone")(_normalize_phone)


class ContactMessageOut(ORMModel):
    id: int
    kind: Literal["contact", "screen_lead"] | str
    full_name: str
    email: str
    phone: str | None
    topic: str
    message: str
    details: dict
    is_resolved: bool
    created_at: datetime
