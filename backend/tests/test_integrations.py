import hashlib
import hmac
import json

import pytest

from app.config import get_settings
from tests.conftest import signup
from tests.test_marketplace import PNG, campaign_payload, setup_market

KEY_SECRET = "rzp_test_secret"
WEBHOOK_SECRET = "whsec_test"


@pytest.fixture
def razorpay_on(monkeypatch):
    s = get_settings()
    monkeypatch.setattr(s, "payments_mode", "razorpay")
    monkeypatch.setattr(s, "razorpay_key_id", "rzp_test_key")
    monkeypatch.setattr(s, "razorpay_key_secret", KEY_SECRET)
    monkeypatch.setattr(s, "razorpay_webhook_secret", WEBHOOK_SECRET)
    created = []

    def fake_create_order(amount_rupees, receipt, notes):
        oid = f"order_{len(created) + 1}"
        created.append({"id": oid, "amount": amount_rupees * 100, "receipt": receipt, "notes": notes})
        return {"id": oid, "amount": amount_rupees * 100, "currency": "INR"}

    monkeypatch.setattr("app.services.razorpay.create_order", fake_create_order)
    return created


def sign(order_id, payment_id):
    return hmac.new(KEY_SECRET.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()


def webhook_body(order_id, payment_id, event="payment.captured"):
    return json.dumps(
        {"event": event, "payload": {"payment": {"entity": {"id": payment_id, "order_id": order_id}}}}
    ).encode()


def test_razorpay_topup_verified_once(make_client, razorpay_on):
    adv = make_client()
    signup(adv, "advertiser", "pay@example.com")
    r = adv.post("/api/advertiser/wallet/orders", json={"amount": 2500})
    assert r.status_code == 201, r.text
    order = r.json()
    assert order["key_id"] == "rzp_test_key" and order["amount_paise"] == 250000
    assert razorpay_on[0]["amount"] == 250000

    verify = {"razorpay_order_id": order["order_id"], "razorpay_payment_id": "pay_1", "razorpay_signature": "bad"}
    assert adv.post("/api/advertiser/wallet/orders/verify", json=verify).status_code == 400
    assert adv.get("/api/advertiser/wallet").json()["balance"] == 0

    verify["razorpay_signature"] = sign(order["order_id"], "pay_1")
    r = adv.post("/api/advertiser/wallet/orders/verify", json=verify)
    assert r.status_code == 200, r.text
    assert r.json()["balance"] == 2500
    # Replaying the callback must not credit twice.
    assert adv.post("/api/advertiser/wallet/orders/verify", json=verify).json()["balance"] == 2500
    tx = adv.get("/api/advertiser/wallet").json()["transactions"]
    assert len(tx) == 1 and not tx[0]["is_simulated"]
    # Simulated top-ups are off while Razorpay is the payment mode.
    assert adv.post("/api/advertiser/wallet/topup", json={"amount": 1000}).status_code == 503


def test_cannot_claim_another_users_order(make_client, razorpay_on):
    a = make_client()
    signup(a, "advertiser", "a1@example.com")
    order = a.post("/api/advertiser/wallet/orders", json={"amount": 1000}).json()
    b = make_client()
    signup(b, "advertiser", "b1@example.com")
    oid = order["order_id"]
    verify = {"razorpay_order_id": oid, "razorpay_payment_id": "pay_x", "razorpay_signature": sign(oid, "pay_x")}
    assert b.post("/api/advertiser/wallet/orders/verify", json=verify).status_code == 404
    assert b.get("/api/advertiser/wallet").json()["balance"] == 0


def test_topup_limits_and_role(make_client, razorpay_on):
    adv = make_client()
    signup(adv, "advertiser", "lim@example.com")
    assert adv.post("/api/advertiser/wallet/orders", json={"amount": 50}).status_code == 422
    too_much = get_settings().max_topup_amount + 1
    assert adv.post("/api/advertiser/wallet/orders", json={"amount": too_much}).status_code == 400
    owner = make_client()
    signup(owner, "screen_owner", "own@example.com")
    assert owner.post("/api/advertiser/wallet/orders", json={"amount": 1000}).status_code == 403


def test_webhook_credits_idempotently(make_client, razorpay_on):
    adv = make_client()
    signup(adv, "advertiser", "wh@example.com")
    oid = adv.post("/api/advertiser/wallet/orders", json={"amount": 3000}).json()["order_id"]
    body = webhook_body(oid, "pay_wh")
    good = hmac.new(WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()

    raw = make_client()
    raw.headers.pop("X-Requested-With")  # Razorpay doesn't send it; the path is CSRF-exempt.
    assert (
        raw.post("/api/payments/razorpay/webhook", content=body, headers={"X-Razorpay-Signature": "x"}).status_code
        == 400
    )
    for _ in range(2):
        r = raw.post("/api/payments/razorpay/webhook", content=body, headers={"X-Razorpay-Signature": good})
        assert r.status_code == 200, r.text
    assert adv.get("/api/advertiser/wallet").json()["balance"] == 3000
    # Browser callback arriving after the webhook must not double-credit either.
    verify = {"razorpay_order_id": oid, "razorpay_payment_id": "pay_wh", "razorpay_signature": sign(oid, "pay_wh")}
    assert adv.post("/api/advertiser/wallet/orders/verify", json=verify).json()["balance"] == 3000


def test_webhook_disabled_without_razorpay(make_client):
    raw = make_client()
    r = raw.post("/api/payments/razorpay/webhook", content=b"{}", headers={"X-Razorpay-Signature": "x"})
    assert r.status_code == 404


def test_reset_email_sent_via_resend(client, monkeypatch):
    s = get_settings()
    monkeypatch.setattr(s, "resend_api_key", "re_test")
    sent = []
    monkeypatch.setattr("app.services.email.send_password_reset", lambda to, name, url: sent.append((to, url)))
    signup(client, "advertiser", "mail@example.com")
    r = client.post("/api/auth/forgot-password", json={"email": "mail@example.com"})
    assert r.status_code == 200
    assert r.json().get("dev_reset_url") is None
    assert len(sent) == 1 and sent[0][0] == "mail@example.com" and "/reset-password?token=" in sent[0][1]
    # Unknown emails get the same response and no email.
    r = client.post("/api/auth/forgot-password", json={"email": "nobody@example.com"})
    assert r.status_code == 200 and len(sent) == 1


def test_resend_api_request(monkeypatch):
    from app.services import email

    monkeypatch.setattr(get_settings(), "resend_api_key", "re_test")
    calls = []

    class Resp:
        status_code = 200
        text = ""

    def fake_post(url, headers, json, timeout):
        calls.append((url, headers, json))
        return Resp()

    monkeypatch.setattr(email.httpx, "post", fake_post)
    assert email.send_password_reset("x@example.com", "X", "https://site/reset-password?token=t") is True
    url, headers, body = calls[0]
    assert url == "https://api.resend.com/emails" and headers["Authorization"] == "Bearer re_test"
    assert body["to"] == ["x@example.com"] and "token=t" in body["html"] and "token=t" in body["text"]


def test_uploads_go_to_object_storage(make_client, db, monkeypatch):
    from app.services import storage

    s = get_settings()
    monkeypatch.setattr(s, "storage_backend", "s3")
    monkeypatch.setattr(s, "s3_bucket", "bigxel-uploads")
    monkeypatch.setattr(s, "s3_public_base_url", "https://pub-test.r2.dev")
    stored = {}

    class FakeS3:
        def upload_fileobj(self, f, bucket, key, ExtraArgs):
            stored[key] = (bucket, f.read(), ExtraArgs["ContentType"])

    monkeypatch.setattr(storage, "_s3_client", lambda: FakeS3())
    _, _, adv, screen = setup_market(make_client, db)
    r = adv.post("/api/uploads", files={"file": ("ad.png", PNG, "image/png")})
    assert r.status_code == 201, r.text
    url = r.json()["url"]
    assert url.startswith("https://pub-test.r2.dev/uploads/") and url.endswith(".png")
    key = url.removeprefix("https://pub-test.r2.dev/")
    assert stored[key] == ("bigxel-uploads", PNG, "image/png")
    # The stored URL is accepted as a campaign creative; arbitrary external URLs are not.
    bad = campaign_payload(screen["id"], "https://evil.example.com/ad.png")
    assert adv.post("/api/advertiser/campaigns", json=bad).status_code == 422
    adv.post("/api/advertiser/wallet/topup", json={"amount": 10000})
    r = adv.post("/api/advertiser/campaigns", json=campaign_payload(screen["id"], url))
    assert r.status_code == 201, r.text


def test_config_requires_provider_keys():
    from app.config import Settings, validate_settings

    with pytest.raises(RuntimeError, match="RAZORPAY_KEY_ID"):
        validate_settings(Settings(_env_file=None, secret_key="k", payments_mode="razorpay"))
    with pytest.raises(RuntimeError, match="S3_BUCKET"):
        validate_settings(Settings(_env_file=None, secret_key="k", storage_backend="s3"))
    with pytest.raises(RuntimeError, match="production"):
        validate_settings(Settings(_env_file=None, secret_key="k", app_env="production", payments_mode="simulated"))
    ok = validate_settings(Settings(_env_file=None, secret_key="k", app_env="production", payments_mode="disabled"))
    assert ok.storage_backend == "local"
