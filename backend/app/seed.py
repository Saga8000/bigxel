"""Load demonstration data into an empty development database.

Usage: python -m app.seed
All screens created here are flagged is_demo=True and shown with a "Demo listing" badge.
"""

import os
from datetime import date, timedelta

from sqlalchemy import select

from app.config import get_settings
from app.database import SessionLocal
from app.models import (
    Booking,
    BookingStatus,
    Campaign,
    Role,
    Screen,
    ScreenStatus,
    TransactionType,
    User,
)
from app.services import wallet
from app.services.pricing import booking_amount, owner_share
from app.services.security import hash_password

DEMO_PASSWORD = os.environ.get("DEMO_PASSWORD", "Demo@12345")

USERS = [
    ("admin@bigxel.example.com", "Demo Admin", None, Role.admin),
    ("advertiser@bigxel.example.com", "Demo Advertiser", "Demo Foods Pvt. Ltd.", Role.advertiser),
    ("owner@bigxel.example.com", "Demo Screen Owner", "Demo Venues", Role.screen_owner),
]

SCREENS = [
    dict(
        name="City Centre Mall Atrium",
        placement="Ground Floor, Main Atrium",
        area="Edappally",
        city="Kochi",
        category="Mall",
        screen_type="Digital Standee",
        size_inches=55,
        resolution="4K",
        daily_footfall=40000,
        operating_hours="10 AM - 10 PM",
        price_per_month=15000,
        image_url="/images/screen-mall.jpg",
        tags=["Mall", "Premium Location"],
    ),
    dict(
        name="Corner Cafe",
        placement="Inside Dining Area",
        area="Panampilly Nagar",
        city="Kochi",
        category="Cafe",
        screen_type="Indoor LCD",
        size_inches=43,
        resolution="Full HD",
        daily_footfall=2500,
        operating_hours="8 AM - 11 PM",
        price_per_month=6000,
        image_url="/images/screen-cafe.jpg",
        tags=["Cafe", "Restaurant"],
    ),
    dict(
        name="Fitness Hub Gym",
        placement="Workout Area",
        area="Kakkanad",
        city="Kochi",
        category="Gym",
        screen_type="Indoor LCD",
        size_inches=32,
        resolution="Full HD",
        daily_footfall=1200,
        operating_hours="5 AM - 10 PM",
        price_per_month=4500,
        image_url="/images/screen-gym.jpg",
        tags=["Gym", "Health & Fitness"],
    ),
    dict(
        name="Wellness Clinic Lobby",
        placement="Waiting Area",
        area="Kadavanthra",
        city="Kochi",
        category="Clinic",
        screen_type="Indoor LCD",
        size_inches=32,
        resolution="Full HD",
        daily_footfall=800,
        operating_hours="9 AM - 9 PM",
        price_per_month=3500,
        image_url="/images/screen-clinic.jpg",
        tags=["Healthcare", "Clinic"],
    ),
    dict(
        name="Tech Park Food Court",
        placement="Food Court Entrance",
        area="Technopark",
        city="Thiruvananthapuram",
        category="Office",
        screen_type="Video Wall",
        size_inches=110,
        resolution="4K",
        daily_footfall=12000,
        operating_hours="8 AM - 8 PM",
        price_per_month=18000,
        image_url="/images/screen-mall.jpg",
        tags=["Office", "Food Court"],
    ),
    dict(
        name="Metro Station Concourse",
        placement="Ticketing Concourse",
        area="MG Road",
        city="Bengaluru",
        category="Transit",
        screen_type="Indoor LED",
        size_inches=86,
        resolution="4K",
        daily_footfall=55000,
        operating_hours="6 AM - 11 PM",
        price_per_month=32000,
        image_url="/images/hero-home.jpg",
        tags=["Transit", "High Footfall"],
    ),
    dict(
        name="Seaside Bistro",
        placement="Billing Counter",
        area="Fort Kochi",
        city="Kochi",
        category="Restaurant",
        screen_type="Indoor LCD",
        size_inches=43,
        resolution="Full HD",
        daily_footfall=1800,
        operating_hours="11 AM - 11 PM",
        price_per_month=5000,
        image_url="/images/screen-cafe.jpg",
        tags=["Restaurant"],
    ),
    dict(
        name="Lakeside Hospital OPD",
        placement="OPD Waiting Hall",
        area="Kaloor",
        city="Kochi",
        category="Hospital",
        screen_type="Indoor LED",
        size_inches=65,
        resolution="4K",
        daily_footfall=6000,
        operating_hours="24 hours",
        price_per_month=9000,
        image_url="/images/screen-clinic.jpg",
        tags=["Healthcare"],
    ),
    dict(
        name="Fashion Street Storefront",
        placement="Shop Window",
        area="Commercial Street",
        city="Bengaluru",
        category="Retail",
        screen_type="Outdoor LED",
        size_inches=75,
        resolution="4K",
        daily_footfall=20000,
        operating_hours="10 AM - 10 PM",
        price_per_month=21000,
        image_url="/images/hero-owners.jpg",
        tags=["Retail", "High Footfall"],
    ),
]


def run() -> None:
    settings = get_settings()
    if not settings.is_development:
        raise SystemExit("Seeding is only allowed when APP_ENV=development")
    db = SessionLocal()
    try:
        if db.scalar(select(User.id).limit(1)):
            print("Database already has users; skipping seed.")
            return
        users = {}
        for email, name, company, role in USERS:
            u = User(
                email=email, full_name=name, company_name=company, role=role, password_hash=hash_password(DEMO_PASSWORD)
            )
            db.add(u)
            users[role] = u
        db.flush()
        owner = users[Role.screen_owner]
        screens = []
        for i, data in enumerate(SCREENS):
            s = Screen(
                owner_id=owner.id,
                address=f"{data['area']}, {data['city']}",
                state=("Karnataka" if data["city"] == "Bengaluru" else "Kerala"),
                status=ScreenStatus.approved,
                is_demo=True,
                description="Demonstration listing for development and design review.",
                **data,
            )
            if i == len(SCREENS) - 1:
                s.status = ScreenStatus.pending
            db.add(s)
            screens.append(s)
        db.flush()

        adv = users[Role.advertiser]
        wallet.record(
            db, adv.id, TransactionType.topup, 50000, "Simulated top-up (development mode)", is_simulated=True
        )
        start = date.today() + timedelta(days=3)
        end = start + timedelta(days=13)
        camp = Campaign(
            advertiser_id=adv.id,
            name="Demo launch campaign",
            objective="Sample campaign",
            creative_url="/images/screen-mall.jpg",
            creative_type="image",
            start_date=start,
            end_date=end,
        )
        db.add(camp)
        db.flush()
        for s, st in ((screens[0], BookingStatus.approved), (screens[1], BookingStatus.pending)):
            amount = booking_amount(s.price_per_month, start, end)
            b = Booking(
                campaign_id=camp.id,
                screen_id=s.id,
                start_date=start,
                end_date=end,
                amount=amount,
                owner_share=owner_share(amount),
                status=st,
            )
            db.add(b)
            db.flush()
            wallet.record(db, adv.id, TransactionType.booking_charge, -amount, f"Booking: {s.name} ({camp.name})", b.id)
            if st == BookingStatus.approved:
                wallet.record(
                    db, owner.id, TransactionType.earning, b.owner_share, f"Earning: {s.name} ({camp.name})", b.id
                )
        db.commit()
        print("Seeded demo data. Accounts (password from DEMO_PASSWORD or the default in app/seed.py):")
        for email, _, _, role in USERS:
            print(f"  {role.value:<13} {email}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
