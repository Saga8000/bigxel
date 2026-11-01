from datetime import date

from app.config import get_settings


def booking_days(start: date, end: date) -> int:
    return (end - start).days + 1


def booking_amount(price_per_month: int, start: date, end: date) -> int:
    """Prorate the monthly price per day (30-day month), rounded to the rupee."""
    return round(price_per_month * booking_days(start, end) / 30)


def owner_share(amount: int) -> int:
    fee = get_settings().platform_fee_percent
    return amount - round(amount * fee / 100)
