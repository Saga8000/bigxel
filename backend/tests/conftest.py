import os

import pytest
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from alembic import command
from app.config import BACKEND_DIR, get_settings

settings = get_settings()
TEST_URL = settings.test_database_url or os.environ.get("TEST_DATABASE_URL")
if not TEST_URL:
    pytest.exit("Set TEST_DATABASE_URL to run the tests", returncode=2)
if TEST_URL == settings.database_url:
    pytest.exit("TEST_DATABASE_URL must differ from DATABASE_URL (tests truncate every table)", returncode=2)

engine = create_engine(TEST_URL)
TestSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@pytest.fixture(scope="session", autouse=True)
def migrated():
    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    cfg.attributes["database_url"] = TEST_URL
    command.upgrade(cfg, "head")
    yield


@pytest.fixture(autouse=True)
def clean_db():
    yield
    with engine.begin() as conn:
        tables = (
            conn.execute(
                text("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> 'alembic_version'")
            )
            .scalars()
            .all()
        )
        conn.execute(text(f"TRUNCATE {', '.join(tables)} RESTART IDENTITY CASCADE"))


@pytest.fixture
def db():
    session = TestSession()
    yield session
    session.close()


def _override_db():
    session = TestSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def make_client(tmp_path):
    from app.database import get_db
    from app.main import app
    from app.services.security import login_limiter, reset_limiter

    app.dependency_overrides[get_db] = _override_db
    settings.upload_dir = tmp_path
    login_limiter._events.clear()
    reset_limiter._events.clear()

    def factory() -> TestClient:
        c = TestClient(app)
        c.headers["X-Requested-With"] = "XMLHttpRequest"
        return c

    yield factory
    app.dependency_overrides.clear()


@pytest.fixture
def client(make_client):
    return make_client()


PASSWORD = "Passw0rd!"


def signup(c: TestClient, role: str, email: str, **extra) -> dict:
    r = c.post(
        "/api/auth/signup",
        json={"full_name": "Test User", "email": email, "password": PASSWORD, "role": role, **extra},
    )
    assert r.status_code == 201, r.text
    return r.json()


def make_admin(db, email="admin@example.com"):
    from app.models import Role, User
    from app.services.security import hash_password

    db.add(User(email=email, full_name="Admin", role=Role.admin, password_hash=hash_password(PASSWORD)))
    db.commit()


def login(c: TestClient, email: str) -> None:
    r = c.post("/api/auth/login", json={"identifier": email, "password": PASSWORD})
    assert r.status_code == 200, r.text
