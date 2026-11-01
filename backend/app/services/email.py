"""Transactional email through Resend (https://resend.com/docs/api-reference/emails/send-email)."""

import logging

import httpx

from app.config import get_settings

logger = logging.getLogger("bigxel.email")


def send_email(to: str, subject: str, html: str, text: str) -> bool:
    settings = get_settings()
    if not settings.email_enabled:
        logger.info("Email not configured; skipped %r to %s", subject, to)
        return False
    try:
        r = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={"from": settings.email_from, "to": [to], "subject": subject, "html": html, "text": text},
            timeout=15,
        )
    except httpx.HTTPError:
        logger.exception("Email send failed for %r", subject)
        return False
    if r.status_code >= 400:
        logger.error("Resend rejected email %r: %s %s", subject, r.status_code, r.text[:300])
        return False
    return True


def send_password_reset(to: str, name: str, reset_url: str) -> bool:
    text = (
        f"Hi {name},\n\nUse this link to reset your BigXel Ads password (valid for 30 minutes):\n{reset_url}\n\n"
        "If you didn't ask for this, you can ignore this email."
    )
    html = (
        f"<p>Hi {name},</p><p>Use the button below to reset your BigXel Ads password. "
        "The link is valid for 30 minutes.</p>"
        f'<p><a href="{reset_url}" style="background:#6d28d9;color:#fff;padding:10px 18px;border-radius:8px;'
        'text-decoration:none;display:inline-block">Reset password</a></p>'
        "<p>If you didn't ask for this, you can ignore this email.</p>"
    )
    return send_email(to, "Reset your BigXel Ads password", html, text)
