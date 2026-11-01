from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import TransactionType, WalletTransaction


def balance(db: Session, user_id: int) -> int:
    total = db.scalar(
        select(func.coalesce(func.sum(WalletTransaction.amount), 0)).where(WalletTransaction.user_id == user_id)
    )
    return int(total or 0)


def record(
    db: Session,
    user_id: int,
    type_: TransactionType,
    amount: int,
    description: str,
    booking_id: int | None = None,
    is_simulated: bool = False,
) -> WalletTransaction:
    tx = WalletTransaction(
        user_id=user_id,
        type=type_,
        amount=amount,
        description=description,
        booking_id=booking_id,
        is_simulated=is_simulated,
    )
    db.add(tx)
    return tx
