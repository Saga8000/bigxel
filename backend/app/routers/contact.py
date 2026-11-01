from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ContactMessage
from app.schemas.common import Message
from app.schemas.contact import ContactIn, ScreenLeadIn

router = APIRouter(prefix="/api/contact", tags=["contact"])


@router.post("", response_model=Message, status_code=status.HTTP_201_CREATED)
def submit_contact(data: ContactIn, db: Session = Depends(get_db)) -> Message:
    db.add(
        ContactMessage(
            kind="contact",
            full_name=data.full_name,
            email=data.email.lower(),
            phone=data.phone,
            topic=data.topic,
            message=data.message,
            details={},
        )
    )
    db.commit()
    return Message(detail="Thanks! Your message has been received. Our team will get back to you.")


@router.post("/screen-lead", response_model=Message, status_code=status.HTTP_201_CREATED)
def submit_screen_lead(data: ScreenLeadIn, db: Session = Depends(get_db)) -> Message:
    db.add(
        ContactMessage(
            kind="screen_lead",
            full_name=data.full_name,
            email=data.email.lower(),
            phone=data.phone,
            topic="Listing a screen",
            message="",
            details={"business_name": data.business_name, "city": data.city, "screen_type": data.screen_type},
        )
    )
    db.commit()
    return Message(detail="Thanks! We've received your screen details and will contact you to get it listed.")
