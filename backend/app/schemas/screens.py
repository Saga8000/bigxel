from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

from app.models import ScreenStatus
from app.schemas.common import ORMModel

CATEGORIES = ["Mall", "Cafe", "Restaurant", "Gym", "Clinic", "Hospital", "Office", "Retail", "Transit", "Other"]
SCREEN_TYPES = ["Indoor LED", "Indoor LCD", "Outdoor LED", "Digital Standee", "Video Wall"]


class ScreenBase(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    placement: str = Field(min_length=2, max_length=160)
    address: str = Field(min_length=3, max_length=255)
    city: str = Field(min_length=2, max_length=80)
    state: str = Field(min_length=2, max_length=80)
    area: str | None = Field(default=None, max_length=80)
    category: str
    screen_type: str
    size_inches: int = Field(ge=10, le=1000)
    resolution: str = Field(min_length=2, max_length=20)
    daily_footfall: int = Field(ge=0, le=10_000_000)
    operating_hours: str = Field(min_length=3, max_length=40)
    price_per_month: int = Field(ge=500, le=10_000_000)
    ad_slots: int = Field(default=6, ge=1, le=60)
    description: str | None = Field(default=None, max_length=2000)
    image_url: str | None = Field(default=None, max_length=500)
    tags: list[str] = Field(default_factory=list, max_length=8)

    @field_validator("category")
    @classmethod
    def _cat(cls, v: str) -> str:
        if v not in CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(CATEGORIES)}")
        return v

    @field_validator("screen_type")
    @classmethod
    def _type(cls, v: str) -> str:
        if v not in SCREEN_TYPES:
            raise ValueError(f"Screen type must be one of: {', '.join(SCREEN_TYPES)}")
        return v

    @field_validator("image_url")
    @classmethod
    def _image(cls, v: str | None) -> str | None:
        if v and not (v.startswith("/uploads/") or v.startswith("/images/")):
            raise ValueError("Image must be an uploaded file")
        return v or None

    @field_validator("tags")
    @classmethod
    def _tags(cls, v: list[str]) -> list[str]:
        cleaned = [t.strip()[:30] for t in v if t.strip()]
        return list(dict.fromkeys(cleaned))


class ScreenCreate(ScreenBase):
    pass


class ScreenUpdate(ScreenBase):
    is_active: bool = True


class ScreenOut(ORMModel):
    id: int
    name: str
    placement: str
    address: str
    city: str
    state: str
    area: str | None
    category: str
    screen_type: str
    size_inches: int
    resolution: str
    daily_footfall: int
    operating_hours: str
    price_per_month: int
    ad_slots: int
    description: str | None
    image_url: str | None
    tags: list[str]
    is_demo: bool
    created_at: datetime


class ScreenOwnerView(ScreenOut):
    status: ScreenStatus
    review_note: str | None
    is_active: bool


class ScreenAdminView(ScreenOwnerView):
    owner_id: int
    owner_name: str
    owner_email: str


class BookedRange(BaseModel):
    start_date: date
    end_date: date


class ScreenDetail(ScreenOut):
    owner_display_name: str
    booked_ranges: list[BookedRange]


class ScreenMeta(BaseModel):
    cities: list[str]
    categories: list[str]
    screen_types: list[str]
    all_categories: list[str]
    all_screen_types: list[str]


class ScreenReview(BaseModel):
    status: ScreenStatus
    note: str | None = Field(default=None, max_length=500)
