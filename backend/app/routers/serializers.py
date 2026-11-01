from datetime import date

from app.models import Booking, BookingStatus, Campaign
from app.schemas.campaigns import AdminBookingOut, BookingOut, CampaignOut, OwnerBookingOut


def campaign_out(c: Campaign, today: date | None = None) -> CampaignOut:
    today = today or date.today()
    total = sum(b.amount for b in c.bookings if b.status in (BookingStatus.pending, BookingStatus.approved))
    return CampaignOut(
        id=c.id,
        name=c.name,
        objective=c.objective,
        creative_url=c.creative_url,
        creative_type=c.creative_type,
        start_date=c.start_date,
        end_date=c.end_date,
        status=c.effective_status(today),
        total_amount=total,
        created_at=c.created_at,
        bookings=[BookingOut.model_validate(b) for b in c.bookings],
    )


def owner_booking_out(b: Booking) -> OwnerBookingOut:
    return OwnerBookingOut(
        **BookingOut.model_validate(b).model_dump(),
        campaign=b.campaign,
        advertiser_name=b.campaign.advertiser.company_name or b.campaign.advertiser.full_name,
    )


def admin_booking_out(b: Booking) -> AdminBookingOut:
    return AdminBookingOut(**owner_booking_out(b).model_dump(), owner_name=b.screen.owner.full_name)
