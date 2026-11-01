import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models import Role
from app.schemas.common import ORMModel

PHONE_RE = re.compile(r"^\+?[0-9]{10,15}$")


def _normalize_phone(v: str | None) -> str | None:
    if v is None:
        return None
    cleaned = re.sub(r"[\s\-()]", "", v)
    if not cleaned:
        return None
    if not PHONE_RE.match(cleaned):
        raise ValueError("Enter a valid phone number (10-15 digits)")
    return cleaned


def _check_password(v: str) -> str:
    if len(v) < 8:
        raise ValueError("Password must be at least 8 characters")
    if not re.search(r"[A-Za-z]", v) or not re.search(r"[0-9]", v):
        raise ValueError("Password must contain letters and numbers")
    return v


class SignupIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = None
    company_name: str | None = Field(default=None, max_length=160)
    password: str = Field(max_length=128)
    role: Literal["advertiser", "screen_owner"]

    _phone = field_validator("phone")(_normalize_phone)
    _password = field_validator("password")(_check_password)

    @field_validator("full_name", "company_name")
    @classmethod
    def _strip(cls, v: str | None) -> str | None:
        return v.strip() if v else v


class LoginIn(BaseModel):
    identifier: str = Field(min_length=3, max_length=255, description="Email or phone number")
    password: str = Field(min_length=1, max_length=128)
    remember_me: bool = False


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str = Field(min_length=10, max_length=200)
    password: str = Field(max_length=128)

    _password = field_validator("password")(_check_password)


class UserOut(ORMModel):
    id: int
    email: str
    phone: str | None
    full_name: str
    company_name: str | None
    role: Role
    is_active: bool
    created_at: datetime


class ForgotPasswordOut(BaseModel):
    detail: str
    dev_reset_url: str | None = None
