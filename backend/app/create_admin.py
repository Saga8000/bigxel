"""Create an admin account interactively: python -m app.create_admin"""

import getpass

from sqlalchemy import select

from app.database import SessionLocal
from app.models import Role, User
from app.schemas.auth import _check_password
from app.services.security import hash_password


def main() -> None:
    email = input("Admin email: ").strip().lower()
    name = input("Full name: ").strip()
    password = getpass.getpass("Password: ")
    _check_password(password)
    if password != getpass.getpass("Confirm password: "):
        raise SystemExit("Passwords do not match")
    db = SessionLocal()
    try:
        if db.scalar(select(User).where(User.email == email)):
            raise SystemExit("A user with this email already exists")
        db.add(User(email=email, full_name=name or "Admin", role=Role.admin, password_hash=hash_password(password)))
        db.commit()
        print(f"Admin {email} created")
    finally:
        db.close()


if __name__ == "__main__":
    main()
