from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Booking, BookingStatus, Screen, ScreenStatus
from app.schemas.common import Page
from app.schemas.screens import CATEGORIES, SCREEN_TYPES, BookedRange, ScreenDetail, ScreenMeta, ScreenOut

router = APIRouter(prefix="/api/screens", tags=["screens"])

SORTS = {
    "recommended": (Screen.daily_footfall.desc(), Screen.id),
    "price_asc": (Screen.price_per_month.asc(), Screen.id),
    "price_desc": (Screen.price_per_month.desc(), Screen.id),
    "footfall_desc": (Screen.daily_footfall.desc(), Screen.id),
    "newest": (Screen.created_at.desc(), Screen.id.desc()),
}


def public_screens():
    return select(Screen).where(Screen.status == ScreenStatus.approved, Screen.is_active.is_(True))


@router.get("", response_model=Page[ScreenOut])
def list_screens(
    db: Session = Depends(get_db),
    q: str | None = Query(default=None, max_length=100),
    city: str | None = Query(default=None, max_length=80),
    category: str | None = Query(default=None, max_length=60),
    screen_type: str | None = Query(default=None, max_length=60),
    min_price: int | None = Query(default=None, ge=0),
    max_price: int | None = Query(default=None, ge=0),
    min_footfall: int | None = Query(default=None, ge=0),
    sort: str = Query(default="recommended"),
    limit: int = Query(default=12, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
) -> Page[ScreenOut]:
    stmt = public_screens()
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Screen.name.ilike(like),
                Screen.area.ilike(like),
                Screen.city.ilike(like),
                Screen.category.ilike(like),
                Screen.placement.ilike(like),
            )
        )
    if city:
        stmt = stmt.where(Screen.city == city)
    if category:
        stmt = stmt.where(Screen.category == category)
    if screen_type:
        stmt = stmt.where(Screen.screen_type == screen_type)
    if min_price is not None:
        stmt = stmt.where(Screen.price_per_month >= min_price)
    if max_price is not None:
        stmt = stmt.where(Screen.price_per_month <= max_price)
    if min_footfall is not None:
        stmt = stmt.where(Screen.daily_footfall >= min_footfall)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    order = SORTS.get(sort, SORTS["recommended"])
    items = db.scalars(stmt.order_by(*order).limit(limit).offset(offset)).all()
    return Page[ScreenOut](items=[ScreenOut.model_validate(s) for s in items], total=total)


@router.get("/meta", response_model=ScreenMeta)
def screen_meta(db: Session = Depends(get_db)) -> ScreenMeta:
    sub = public_screens().subquery()
    cities = db.scalars(select(sub.c.city).distinct().order_by(sub.c.city)).all()
    categories = db.scalars(select(sub.c.category).distinct().order_by(sub.c.category)).all()
    types = db.scalars(select(sub.c.screen_type).distinct().order_by(sub.c.screen_type)).all()
    return ScreenMeta(
        cities=list(cities),
        categories=list(categories),
        screen_types=list(types),
        all_categories=CATEGORIES,
        all_screen_types=SCREEN_TYPES,
    )


@router.get("/{screen_id}", response_model=ScreenDetail)
def get_screen(screen_id: int, db: Session = Depends(get_db)) -> ScreenDetail:
    screen = db.scalar(public_screens().where(Screen.id == screen_id).options(joinedload(Screen.owner)))
    if screen is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Screen not found")
    ranges = db.execute(
        select(Booking.start_date, Booking.end_date)
        .where(
            Booking.screen_id == screen_id,
            Booking.status.in_([BookingStatus.pending, BookingStatus.approved]),
            Booking.end_date >= date.today(),
        )
        .order_by(Booking.start_date)
    ).all()
    owner_display = screen.owner.company_name or screen.owner.full_name.split(" ")[0]
    return ScreenDetail(
        **ScreenOut.model_validate(screen).model_dump(),
        owner_display_name=owner_display,
        booked_ranges=[BookedRange(start_date=s, end_date=e) for s, e in ranges],
    )
