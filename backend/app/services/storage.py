"""Stores uploaded files on local disk or in S3-compatible object storage (e.g. Cloudflare R2)."""

from functools import lru_cache
from typing import BinaryIO

from app.config import get_settings

CONTENT_TYPES = {"jpg": "image/jpeg", "png": "image/png", "webp": "image/webp", "mp4": "video/mp4"}


@lru_cache
def _s3_client():
    import boto3

    s = get_settings()
    return boto3.client(
        "s3",
        endpoint_url=s.s3_endpoint_url,
        region_name=s.s3_region,
        aws_access_key_id=s.s3_access_key_id,
        aws_secret_access_key=s.s3_secret_access_key,
    )


def save(fileobj: BinaryIO, name: str, ext: str) -> str:
    """Persist the file and return its public URL."""
    settings = get_settings()
    fileobj.seek(0)
    if settings.storage_backend == "s3":
        key = f"uploads/{name}"
        _s3_client().upload_fileobj(
            fileobj,
            settings.s3_bucket,
            key,
            ExtraArgs={"ContentType": CONTENT_TYPES[ext], "CacheControl": "public, max-age=31536000, immutable"},
        )
        return f"{settings.s3_public_base_url}/{key}"
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    with (settings.upload_dir / name).open("wb") as out:
        while chunk := fileobj.read(1024 * 1024):
            out.write(chunk)
    return f"/uploads/{name}"
