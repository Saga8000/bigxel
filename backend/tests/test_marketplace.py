from datetime import date, timedelta

from tests.conftest import login, make_admin, signup

SCREEN = {
    "name": "Test Mall Screen",
    "placement": "Atrium",
    "address": "1 Test Road",
    "city": "Kochi",
    "state": "Kerala",
    "area": "Edappally",
    "category": "Mall",
    "screen_type": "Digital Standee",
    "size_inches": 55,
    "resolution": "4K",
    "daily_footfall": 10000,
    "operating_hours": "10 AM - 10 PM",
    "price_per_month": 3000,
    "ad_slots": 1,
    "tags": ["Mall"],
}

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


def setup_market(make_client, db):
    owner = make_client()
    signup(owner, "screen_owner", "owner@example.com")
    screen = owner.post("/api/owner/screens", json=SCREEN).json()
    assert screen["status"] == "pending"

    anon = make_client()
    assert anon.get("/api/screens").json()["total"] == 0
    assert anon.get(f"/api/screens/{screen['id']}").status_code == 404

    make_admin(db)
    admin = make_client()
    login(admin, "admin@example.com")
    r = admin.post(f"/api/admin/screens/{screen['id']}/review", json={"status": "approved"})
    assert r.status_code == 200

    adv = make_client()
    signup(adv, "advertiser", "adv@example.com")
    return owner, admin, adv, screen


def upload(c) -> str:
    r = c.post("/api/uploads", files={"file": ("ad.png", PNG, "image/png")})
    assert r.status_code == 201, r.text
    return r.json()["url"]


def campaign_payload(screen_id, creative, days=29):
    start = date.today() + timedelta(days=2)
    return {
        "name": "Launch",
        "creative_url": creative,
        "start_date": start.isoformat(),
        "end_date": (start + timedelta(days=days)).isoformat(),
        "screen_ids": [screen_id],
    }


def test_public_listing_filters(make_client, db):
    _, _, _, screen = setup_market(make_client, db)
    c = make_client()
    assert c.get("/api/screens?city=Kochi").json()["total"] == 1
    assert c.get("/api/screens?city=Delhi").json()["total"] == 0
    assert c.get("/api/screens?max_price=1000").json()["total"] == 0
    assert c.get("/api/screens?q=edappally").json()["total"] == 1
    assert c.get("/api/screens/meta").json()["cities"] == ["Kochi"]
    assert c.get(f"/api/screens/{screen['id']}").json()["booked_ranges"] == []


def test_upload_rejects_non_media(client):
    signup(client, "advertiser", "u@example.com")
    r = client.post("/api/uploads", files={"file": ("x.png", b"<script>alert(1)</script>", "image/png")})
    assert r.status_code == 400


def test_owner_cannot_edit_other_owners_screen(make_client, db):
    owner, _, _, screen = setup_market(make_client, db)
    other = make_client()
    signup(other, "screen_owner", "other@example.com")
    assert other.put(f"/api/owner/screens/{screen['id']}", json=SCREEN).status_code == 404


def test_campaign_requires_balance_then_books_and_approves(make_client, db):
    owner, admin, adv, screen = setup_market(make_client, db)
    creative = upload(adv)
    r = adv.post("/api/advertiser/campaigns", json=campaign_payload(screen["id"], creative))
    assert r.status_code == 402

    assert adv.post("/api/advertiser/wallet/topup", json={"amount": 5000}).status_code == 200
    r = adv.post("/api/advertiser/campaigns", json=campaign_payload(screen["id"], creative))
    assert r.status_code == 201, r.text
    camp = r.json()
    assert camp["status"] == "pending_approval"
    assert camp["total_amount"] == 3000
    assert adv.get("/api/advertiser/wallet").json()["balance"] == 2000

    # slot capacity is 1, so a second overlapping booking is refused
    assert adv.post("/api/advertiser/campaigns", json=campaign_payload(screen["id"], creative)).status_code == 409

    booking = owner.get("/api/owner/bookings").json()[0]
    assert adv.post(f"/api/owner/bookings/{booking['id']}/approve", json={}).status_code == 403
    r = owner.post(f"/api/owner/bookings/{booking['id']}/approve", json={})
    assert r.json()["status"] == "approved"
    assert owner.get("/api/owner/summary").json()["total_earnings"] == 2100  # 70% after 30% fee
    assert adv.get(f"/api/advertiser/campaigns/{camp['id']}").json()["status"] == "scheduled"

    # cancelling before start refunds the advertiser and reverses the owner's earning
    r = adv.post(f"/api/advertiser/campaigns/{camp['id']}/cancel")
    assert r.json()["status"] == "cancelled"
    assert adv.get("/api/advertiser/wallet").json()["balance"] == 5000
    assert owner.get("/api/owner/summary").json()["total_earnings"] == 0
    assert admin.get("/api/admin/summary").json()["bookings_by_status"] == {"cancelled": 1}


def test_rejected_booking_refunds(make_client, db):
    owner, _, adv, screen = setup_market(make_client, db)
    adv.post("/api/advertiser/wallet/topup", json={"amount": 5000})
    adv.post("/api/advertiser/campaigns", json=campaign_payload(screen["id"], upload(adv)))
    booking = owner.get("/api/owner/bookings").json()[0]
    owner.post(f"/api/owner/bookings/{booking['id']}/reject", json={"note": "Not suitable"})
    assert adv.get("/api/advertiser/wallet").json()["balance"] == 5000
    assert adv.get("/api/advertiser/campaigns").json()[0]["status"] == "rejected"


def test_advertiser_cannot_see_others_campaigns(make_client, db):
    _, _, adv, screen = setup_market(make_client, db)
    adv.post("/api/advertiser/wallet/topup", json={"amount": 5000})
    camp = adv.post("/api/advertiser/campaigns", json=campaign_payload(screen["id"], upload(adv))).json()
    other = make_client()
    signup(other, "advertiser", "other-adv@example.com")
    assert other.get(f"/api/advertiser/campaigns/{camp['id']}").status_code == 404


def test_campaign_must_start_in_future(make_client, db):
    _, _, adv, screen = setup_market(make_client, db)
    payload = campaign_payload(screen["id"], upload(adv))
    payload["start_date"] = date.today().isoformat()
    assert adv.post("/api/advertiser/campaigns", json=payload).status_code == 400


def test_contact_and_lead_forms(make_client, db):
    c = make_client()
    r = c.post(
        "/api/contact",
        json={"full_name": "Asha", "email": "asha@example.com", "topic": "Pricing", "message": "Tell me more please"},
    )
    assert r.status_code == 201
    r = c.post(
        "/api/contact/screen-lead",
        json={
            "full_name": "Asha",
            "business_name": "Cafe",
            "email": "asha@example.com",
            "phone": "9876543210",
            "city": "Kochi",
            "screen_type": "Indoor LCD",
        },
    )
    assert r.status_code == 201
    make_admin(db)
    admin = make_client()
    login(admin, "admin@example.com")
    assert len(admin.get("/api/admin/messages").json()) == 2
