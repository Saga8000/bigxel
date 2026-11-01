"""Minimal Razorpay client: create orders and verify signatures (https://razorpay.com/docs/api/)."""

import hashlib
import hmac

import httpx

from app.config import get_settings

API_BASE = "https://api.razorpay.com/v1"


class RazorpayError(Exception):
    pass


def create_order(amount_rupees: int, receipt: str, notes: dict[str, str]) -> dict:
    settings = get_settings()
    try:
        r = httpx.post(
            f"{API_BASE}/orders",
            auth=(settings.razorpay_key_id, settings.razorpay_key_secret),
            json={"amount": amount_rupees * 100, "currency": "INR", "receipt": receipt, "notes": notes},
            timeout=15,
        )
    except httpx.HTTPError as e:
        raise RazorpayError("Could not reach Razorpay") from e
    if r.status_code >= 400:
        raise RazorpayError(f"Razorpay rejected the order ({r.status_code})")
    return r.json()


def _hmac_hex(secret: str, message: bytes) -> str:
    return hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()


def verify_payment_signature(order_id: str, payment_id: str, signature: str) -> bool:
    expected = _hmac_hex(get_settings().razorpay_key_secret, f"{order_id}|{payment_id}".encode())
    return hmac.compare_digest(expected, signature)


def verify_webhook_signature(body: bytes, signature: str) -> bool:
    secret = get_settings().razorpay_webhook_secret
    return bool(secret) and hmac.compare_digest(_hmac_hex(secret, body), signature)
