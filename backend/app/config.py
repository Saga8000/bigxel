import secrets
import warnings
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    app_env: str = "development"
    database_url: str = "postgresql+psycopg://bigxel_app:change-me@localhost:5432/bigxel"
    test_database_url: str | None = None
    secret_key: str = ""
    access_token_expire_minutes: int = 60 * 8
    remember_me_expire_days: int = 30
    cookie_secure: bool = False
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    frontend_url: str = "http://localhost:5173"

    # "simulated" lets advertisers add fake wallet credit for development.
    # "disabled" turns top-ups off until a real payment gateway is integrated.
    payments_mode: str = "simulated"
    platform_fee_percent: int = 30
    max_topup_amount: int = 100_000

    upload_dir: Path = BACKEND_DIR / "uploads"
    max_upload_mb: int = 20

    @field_validator("payments_mode")
    @classmethod
    def _check_payments_mode(cls, v: str) -> str:
        if v not in {"simulated", "disabled"}:
            raise ValueError("PAYMENTS_MODE must be 'simulated' or 'disabled'")
        return v

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if not settings.secret_key:
        if not settings.is_development:
            raise RuntimeError("SECRET_KEY must be set outside development")
        warnings.warn("SECRET_KEY not set; using a random key (sessions reset on restart)", stacklevel=2)
        settings.secret_key = secrets.token_urlsafe(48)
    if settings.payments_mode == "simulated" and not settings.is_development:
        raise RuntimeError("PAYMENTS_MODE=simulated is only allowed when APP_ENV=development")
    return settings
