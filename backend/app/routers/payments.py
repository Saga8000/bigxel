import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.services import payments, razorpay

router = APIRouter(prefix="/api/payments", tags=["payments"])
logger = logging.getLogger("bigxel.payments")


@router.post("/razorpay/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)) -> dict:
    """Razorpay calls this for payment events; it credits top-ups even if the browser never returned."""
    if get_settings().payments_mode != "razorpay":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    body = await request.body()
    if not razorpay.verify_webhook_signature(body, request.headers.get("x-razorpay-signature", "")):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid signature")
    event = json.loads(body)
    if event.get("event") in {"payment.captured", "order.paid"}:
        payment = event.get("payload", {}).get("payment", {}).get("entity", {})
        order_id, payment_id = payment.get("order_id"), payment.get("id")
        if order_id and payment_id and not payments.credit_paid_order(db, order_id, payment_id):
            logger.warning("Webhook for unknown Razorpay order %s", order_id)
    return {"status": "ok"}
