import logging

from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.routers import admin, advertiser, auth, contact, owner, screens, uploads

logger = logging.getLogger("bigxel")
settings = get_settings()

app = FastAPI(title="BigXel Ads API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


@app.middleware("http")
async def csrf_guard(request: Request, call_next):
    # Browsers can't add custom headers to cross-site form posts without a CORS preflight,
    # so requiring this header blocks CSRF on cookie-authenticated endpoints.
    if (
        request.method in UNSAFE_METHODS
        and request.url.path.startswith("/api/")
        and request.headers.get("x-requested-with") != "XMLHttpRequest"
    ):
        return JSONResponse(status_code=403, content={"detail": "Missing X-Requested-With header"})
    return await call_next(request)


@app.exception_handler(RequestValidationError)
async def validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    errors = []
    for err in exc.errors():
        loc = [str(p) for p in err.get("loc", []) if p not in ("body", "query", "path")]
        msg = str(err.get("msg", "Invalid value")).removeprefix("Value error, ")
        errors.append({"field": ".".join(loc), "message": msg})
    summary = errors[0]["message"] if errors else "Invalid request"
    return JSONResponse(status_code=422, content={"detail": summary, "errors": errors})


@app.exception_handler(Exception)
async def unhandled_handler(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error", exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Something went wrong. Please try again."})


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "env": settings.app_env, "payments_mode": settings.payments_mode}


for r in (auth, screens, uploads, contact, advertiser, owner, admin):
    app.include_router(r.router)

settings.upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


# In deployments the built frontend is served by this app; locally Vite serves it instead.
if settings.frontend_dist and (settings.frontend_dist / "index.html").is_file():
    dist = settings.frontend_dist.resolve()
    index_html = dist / "index.html"

    @app.api_route("/{path:path}", methods=["GET", "HEAD"], include_in_schema=False)
    def spa(path: str) -> Response:
        if path.startswith(("api/", "uploads/")):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        candidate = (dist / path).resolve()
        if path and candidate.is_file() and candidate.is_relative_to(dist):
            return FileResponse(candidate)
        return FileResponse(index_html, headers={"Cache-Control": "no-cache"})
