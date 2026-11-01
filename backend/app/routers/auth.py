from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.deps import get_current_user, get_current_user_optional
from app.models import PasswordResetToken, Role, User
from app.schemas.auth import (
    PHONE_RE,
    ForgotPasswordIn,
    ForgotPasswordOut,
    LoginIn,
    ResetPasswordIn,
    SignupIn,
    UserOut,
)
from app.schemas.common import Message
from app.services.security import (
    COOKIE_NAME,
    DUMMY_HASH,
    create_access_token,
    hash_password,
    hash_reset_token,
    login_limiter,
    new_reset_token,
    reset_limiter,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

RESET_TOKEN_TTL = timedelta(minutes=30)


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _set_session_cookie(response: Response, user: User, remember_me: bool) -> None:
    settings = get_settings()
    expires = (
        timedelta(days=settings.remember_me_expire_days)
        if remember_me
        else timedelta(minutes=settings.access_token_expire_minutes)
    )
    token = create_access_token(user.id, user.token_version, expires)
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=int(expires.total_seconds()) if remember_me else None,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(data: SignupIn, response: Response, db: Session = Depends(get_db)) -> User:
    email = data.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")
    if data.phone and db.scalar(select(User).where(User.phone == data.phone)):
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this phone number already exists")
    user = User(
        email=email,
        phone=data.phone,
        full_name=data.full_name,
        company_name=data.company_name or None,
        password_hash=hash_password(data.password),
        role=Role(data.role),
    )
    db.add(user)
    db.commit()
    _set_session_cookie(response, user, remember_me=False)
    return user


@router.post("/login", response_model=UserOut)
def login(data: LoginIn, request: Request, response: Response, db: Session = Depends(get_db)) -> User:
    identifier = data.identifier.strip().lower()
    key = f"{_client_ip(request)}:{identifier}"
    if login_limiter.is_limited(key):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many failed attempts. Try again in 15 minutes.")

    phone = identifier.replace(" ", "").replace("-", "")
    conditions = [User.email == identifier]
    if PHONE_RE.match(phone):
        conditions.append(User.phone == phone)
    user = db.scalar(select(User).where(or_(*conditions)))

    if user is None:
        verify_password(data.password, DUMMY_HASH)
        valid = False
    else:
        valid = verify_password(data.password, user.password_hash)
    if not valid or user is None:
        login_limiter.hit(key)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email/phone or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been deactivated. Contact support.")

    login_limiter.reset(key)
    _set_session_cookie(response, user, data.remember_me)
    return user


@router.post("/logout", response_model=Message)
def logout(response: Response) -> Message:
    response.delete_cookie(COOKIE_NAME, path="/")
    return Message(detail="Logged out")


@router.get("/session", response_model=UserOut | None)
def session(user: User | None = Depends(get_current_user_optional)) -> User | None:
    """Like /me but returns null for anonymous visitors instead of 401."""
    return user


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.post("/forgot-password", response_model=ForgotPasswordOut)
def forgot_password(data: ForgotPasswordIn, request: Request, db: Session = Depends(get_db)) -> ForgotPasswordOut:
    settings = get_settings()
    generic = "If an account exists for this email, password reset instructions have been generated."
    key = _client_ip(request)
    if reset_limiter.is_limited(key):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many requests. Try again later.")
    reset_limiter.hit(key)

    user = db.scalar(select(User).where(User.email == data.email.lower()))
    if user is None or not user.is_active:
        return ForgotPasswordOut(detail=generic)

    raw, token_hash = new_reset_token()
    db.add(PasswordResetToken(user_id=user.id, token_hash=token_hash, expires_at=datetime.now(UTC) + RESET_TOKEN_TTL))
    db.commit()

    reset_url = f"{settings.frontend_url}/reset-password?token={raw}"
    # No email provider is configured. In development the link is returned so the flow can be tested.
    if settings.is_development:
        return ForgotPasswordOut(detail=generic, dev_reset_url=reset_url)
    return ForgotPasswordOut(detail=generic)


@router.post("/reset-password", response_model=Message)
def reset_password(data: ResetPasswordIn, db: Session = Depends(get_db)) -> Message:
    record = db.scalar(select(PasswordResetToken).where(PasswordResetToken.token_hash == hash_reset_token(data.token)))
    now = datetime.now(UTC)
    if record is None or record.used_at is not None or record.expires_at < now:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This reset link is invalid or has expired")
    user = db.get(User, record.user_id)
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This reset link is invalid or has expired")
    user.password_hash = hash_password(data.password)
    user.token_version += 1
    record.used_at = now
    db.commit()
    return Message(detail="Your password has been reset. You can now log in.")
