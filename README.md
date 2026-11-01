# BigXel Ads

Marketplace that connects advertisers with digital screens at venues such as malls, cafes, gyms and clinics.

- `frontend/` — React 19, TypeScript, Vite, Tailwind CSS, React Router
- `backend/` — FastAPI, SQLAlchemy 2, Alembic, Pydantic 2, PostgreSQL (psycopg 3)
- `scripts/crop_reference_images.py` — makes the photo crops in `frontend/public/images/` from the mockups in `images/`. It only reads the originals and never changes them.

## Prerequisites

- Python 3.11+
- Node 20+ / npm 10+
- PostgreSQL 13+

## 1. Database

Run these as the `postgres` superuser (`psql -U postgres`):

```sql
CREATE ROLE bigxel_app LOGIN PASSWORD 'choose-a-password';
CREATE DATABASE bigxel OWNER bigxel_app;
CREATE DATABASE bigxel_test OWNER bigxel_app;   -- only needed for running tests
```

## 2. Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env        # Windows: copy .env.example .env
# Edit .env: set DATABASE_URL / TEST_DATABASE_URL passwords and SECRET_KEY
alembic upgrade head
python -m app.seed          # optional demo data (development only)
uvicorn app.main:app --reload --port 8000
```

Checks: `ruff check .` and `pytest -q`. Tests use `TEST_DATABASE_URL` and clear its tables between tests.

To create a real admin account, run `python -m app.create_admin`.

## 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api and /uploads to :8000)
```

Checks: `npm run build` and `npm run lint`.

## Demo accounts (created by `app.seed`)

| Role | Email | Password |
|---|---|---|
| Advertiser | advertiser@bigxel.example.com | Demo@12345 |
| Screen owner | owner@bigxel.example.com | Demo@12345 |
| Admin | admin@bigxel.example.com | Demo@12345 |

Seeded screens are flagged `is_demo` and display a "Demo listing" badge.

## Security

- Passwords are hashed with bcrypt. Sessions use a JWT stored in an HTTP-only `SameSite=Lax` cookie (`bigxel_session`). Set `COOKIE_SECURE=true` when serving over HTTPS.
- Role checks run on the server (`require_advertiser`, `require_owner`, `require_admin` in `backend/app/deps.py`). The frontend route guard only controls what the user sees.
- Every state-changing API request must send the `X-Requested-With: XMLHttpRequest` header (CSRF protection). Login and password-reset requests are rate-limited.
- Uploads (JPG/PNG/WEBP/MP4) are checked by their file signature and size.
- Wallet transactions are stored in an append-only ledger. Bookings lock database rows and check screen capacity before charging the wallet.

## Not yet integrated (development stand-ins)

| Area | Current behaviour | Needed for production |
|---|---|---|
| Payments | `PAYMENTS_MODE=simulated` adds fake wallet top-ups, labelled "Simulated". This only works when `APP_ENV=development`. | A payment gateway such as Razorpay or Stripe, with webhook-confirmed top-ups |
| Owner payouts | Earnings are recorded in the ledger only | Bank payout integration |
| Password reset email | No email is sent. In development the API returns the reset link and the page shows it. | An email provider (SMTP, SES, etc.) |
| Google / Facebook login | Buttons are disabled | OAuth app credentials |
| Analytics | Based on bookings and spend only | A screen player/proof-of-play integration for impressions |
| Marketing stats, team, social links | Labelled as illustrative placeholders | Real content |
| Legal pages | Placeholder text | Legal review |
| Rate limiting | In-process memory | A shared store (e.g. Redis) when running multiple workers |
| Uploads | Stored on local disk in `backend/uploads/` | Object storage / CDN |
