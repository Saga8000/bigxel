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

## Environments

`APP_ENV` can be `development`, `staging` or `production`:

| | development | staging | production |
|---|---|---|---|
| Simulated wallet top-ups (`PAYMENTS_MODE=simulated`) | yes | yes | refused at startup |
| Password-reset link shown on screen | yes | no | no |
| `python -m app.seed` demo data | yes | only with `DEMO_PASSWORD` set | refused |
| `SECRET_KEY` required | no (random per run) | yes | yes |

## Deploying staging (Render)

The `Dockerfile` at the repo root builds the frontend and runs FastAPI, which serves both the API and the website from one URL. `backend/start.sh` runs `alembic upgrade head` on every start, and also seeds demo data when `SEED_DEMO=true`.

1. Push this repository to GitHub.
2. On render.com, choose **New → Blueprint**, then pick the repository. `render.yaml` creates a free PostgreSQL database and the `bigxel-staging` web service, and generates `SECRET_KEY` and `DEMO_PASSWORD`.
3. Once it's live, open the service's **Environment** tab to see `DEMO_PASSWORD`, then log in with the demo accounts. If the URL isn't `https://bigxel-staging.onrender.com`, update `CORS_ORIGINS` and `FRONTEND_URL`.

Free-tier limits: the service sleeps when idle, so the first request takes about a minute; uploaded files are lost on restart or redeploy; the free database expires after 30 days.

To build and run the image yourself: `docker build -t bigxel .`, then `docker run -p 8000:8000 -e APP_ENV=staging -e DATABASE_URL=... -e SECRET_KEY=... bigxel`.

## Security

- Passwords are hashed with bcrypt. Sessions use a JWT stored in an HTTP-only `SameSite=Lax` cookie (`bigxel_session`). Set `COOKIE_SECURE=true` when serving over HTTPS.
- Role checks run on the server (`require_advertiser`, `require_owner`, `require_admin` in `backend/app/deps.py`). The frontend route guard only controls what the user sees.
- Every state-changing API request must send the `X-Requested-With: XMLHttpRequest` header (CSRF protection). Login and password-reset requests are rate-limited.
- Uploads (JPG/PNG/WEBP/MP4) are checked by their file signature and size.
- Wallet transactions are stored in an append-only ledger. Bookings lock database rows and check screen capacity before charging the wallet.

## Integrations

Each integration switches on only when its settings are present (see `backend/.env.example`). Without them the app falls back to the development stand-in.

| Area | How to enable | Without it |
|---|---|---|
| Payments (Razorpay) | Set `PAYMENTS_MODE=razorpay`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`. Add a webhook at `/api/payments/razorpay/webhook` (events `payment.captured` and `order.paid`) and set `RAZORPAY_WEBHOOK_SECRET`. | `simulated` (development/staging only) or `disabled` |
| Password-reset email (Resend) | Set `RESEND_API_KEY` and an `EMAIL_FROM` on a domain verified in Resend | Development shows the link on screen; elsewhere no email is sent |
| Upload storage (Cloudflare R2 / S3) | Set `STORAGE_BACKEND=s3` and the `S3_*` settings, with a public bucket URL | Files are saved to `backend/uploads/`, which is lost on most hosting platforms when the server is redeployed |

How top-ups work: the server creates a Razorpay order, and the browser opens Razorpay Checkout. The wallet is credited only after the server checks Razorpay's HMAC signature, either from the browser callback or from the webhook. Each order is credited at most once.

## Still not integrated

| Area | Current behaviour | Needed for production |
|---|---|---|
| Owner payouts | Earnings are recorded in the ledger only | Bank payouts, e.g. RazorpayX |
| Refunds to card/UPI | Cancellations and refunds go back to the BigXel wallet | Razorpay refunds API if money must go back to the original payment method |
| Google / Facebook login | Buttons are disabled | OAuth app credentials |
| Analytics | Based on bookings and spend only | A screen player/proof-of-play integration for impressions |
| Marketing stats, team, social links | Labelled as illustrative placeholders | Real content |
| Legal pages | Placeholder text | Legal review |
| Rate limiting | In-process memory | A shared store (e.g. Redis) when running multiple workers |
