from tests.conftest import PASSWORD, login, make_admin, signup


def test_signup_sets_cookie_and_me(client):
    user = signup(client, "advertiser", "a@example.com", phone="+91 98765 43210")
    assert user["role"] == "advertiser"
    assert "password_hash" not in user
    me = client.get("/api/auth/me").json()
    assert me["email"] == "a@example.com"
    assert me["phone"] == "+919876543210"


def test_signup_cannot_create_admin(client):
    r = client.post(
        "/api/auth/signup",
        json={"full_name": "X Y", "email": "x@example.com", "password": PASSWORD, "role": "admin"},
    )
    assert r.status_code == 422


def test_signup_validation_and_duplicates(client, make_client):
    r = client.post(
        "/api/auth/signup", json={"full_name": "X Y", "email": "bad", "password": "short", "role": "advertiser"}
    )
    assert r.status_code == 422
    assert r.json()["errors"]
    signup(client, "advertiser", "dup@example.com")
    r = make_client().post(
        "/api/auth/signup",
        json={"full_name": "X Y", "email": "DUP@example.com", "password": PASSWORD, "role": "advertiser"},
    )
    assert r.status_code == 409


def test_password_is_hashed(client, db):
    from app.models import User

    signup(client, "advertiser", "h@example.com")
    u = db.query(User).filter_by(email="h@example.com").one()
    assert u.password_hash != PASSWORD and u.password_hash.startswith("$2")


def test_login_logout_and_phone_login(make_client):
    signup(make_client(), "screen_owner", "o@example.com", phone="9876543210")
    c = make_client()
    assert c.post("/api/auth/login", json={"identifier": "o@example.com", "password": "wrong1234"}).status_code == 401
    assert c.post("/api/auth/login", json={"identifier": "9876543210", "password": PASSWORD}).status_code == 200
    assert c.get("/api/auth/me").status_code == 200
    c.post("/api/auth/logout")
    assert c.get("/api/auth/me").status_code == 401


def test_login_rate_limited(make_client):
    c = make_client()
    signup(c, "advertiser", "rl@example.com")
    for _ in range(5):
        c.post("/api/auth/login", json={"identifier": "rl@example.com", "password": "wrong1234"})
    r = c.post("/api/auth/login", json={"identifier": "rl@example.com", "password": PASSWORD})
    assert r.status_code == 429


def test_csrf_header_required(make_client):
    c = make_client()
    del c.headers["X-Requested-With"]
    r = c.post("/api/auth/login", json={"identifier": "x@example.com", "password": "x"})
    assert r.status_code == 403


def test_password_reset_flow_invalidates_sessions(make_client):
    old = make_client()
    signup(old, "advertiser", "r@example.com")
    c = make_client()
    r = c.post("/api/auth/forgot-password", json={"email": "r@example.com"})
    url = r.json()["dev_reset_url"]
    token = url.split("token=")[1]
    assert c.post("/api/auth/reset-password", json={"token": token, "password": "NewPassw0rd"}).status_code == 200
    # token is single-use
    assert c.post("/api/auth/reset-password", json={"token": token, "password": "NewPassw0rd"}).status_code == 400
    assert old.get("/api/auth/me").status_code == 401
    assert c.post("/api/auth/login", json={"identifier": "r@example.com", "password": "NewPassw0rd"}).status_code == 200


def test_forgot_password_unknown_email_is_generic(client):
    r = client.post("/api/auth/forgot-password", json={"email": "nobody@example.com"})
    assert r.status_code == 200
    assert r.json()["dev_reset_url"] is None


def test_role_protection(make_client, db):
    adv = make_client()
    signup(adv, "advertiser", "adv@example.com")
    assert adv.get("/api/owner/screens").status_code == 403
    assert adv.get("/api/admin/users").status_code == 403
    assert make_client().get("/api/advertiser/campaigns").status_code == 401
    make_admin(db)
    admin = make_client()
    login(admin, "admin@example.com")
    assert admin.get("/api/admin/users").status_code == 200


def test_deactivated_user_loses_access(make_client, db):
    adv = make_client()
    user = signup(adv, "advertiser", "d@example.com")
    make_admin(db)
    admin = make_client()
    login(admin, "admin@example.com")
    assert admin.patch(f"/api/admin/users/{user['id']}", json={"is_active": False}).status_code == 200
    assert adv.get("/api/auth/me").status_code == 401
    r = make_client().post("/api/auth/login", json={"identifier": "d@example.com", "password": PASSWORD})
    assert r.status_code == 403


def test_session_endpoint_anonymous_returns_null(client):
    r = client.get("/api/auth/session")
    assert r.status_code == 200
    assert r.json() is None
