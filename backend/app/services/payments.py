from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import PaymentOrder, PaymentStatus, TransactionType
from app.services import wallet


def credit_paid_order(db: Session, provider_order_id: str, payment_id: str, user_id: int | None = None) -> bool:
    """Mark a Razorpay order paid and credit the wallet exactly once. Returns False if the order is unknown.

    Called from both the browser callback and the webhook, so it locks the order row and is idempotent.
    """
    query = select(PaymentOrder).where(PaymentOrder.provider_order_id == provider_order_id).with_for_update()
    if user_id is not None:
        query = query.where(PaymentOrder.user_id == user_id)
    order = db.scalar(query)
    if order is None:
        return False
    if order.status == PaymentStatus.paid:
        return True
    tx = wallet.record(db, order.user_id, TransactionType.topup, order.amount, f"Razorpay top-up ({payment_id})")
    db.flush()
    order.status = PaymentStatus.paid
    order.provider_payment_id = payment_id
    order.paid_at = datetime.now(UTC)
    order.wallet_transaction_id = tx.id
    db.commit()
    return True
