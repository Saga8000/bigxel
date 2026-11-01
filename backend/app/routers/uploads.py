import tempfile
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

from app.config import get_settings
from app.deps import get_current_user
from app.models import User
from app.services import storage

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

CHUNK = 1024 * 1024


class UploadOut(BaseModel):
    url: str
    kind: str


def _detect(header: bytes) -> tuple[str, str] | None:
    if header.startswith(b"\xff\xd8\xff"):
        return "jpg", "image"
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png", "image"
    if header[:4] == b"RIFF" and header[8:12] == b"WEBP":
        return "webp", "image"
    if header[4:8] == b"ftyp":
        return "mp4", "video"
    return None


@router.post("", response_model=UploadOut, status_code=status.HTTP_201_CREATED)
async def upload_file(file: UploadFile, user: User = Depends(get_current_user)) -> UploadOut:
    settings = get_settings()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    header = await file.read(16)
    detected = _detect(header)
    if detected is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only JPG, PNG, WEBP images or MP4 videos are allowed")
    ext, kind = detected

    name = f"{uuid.uuid4().hex}.{ext}"
    size = len(header)
    with tempfile.SpooledTemporaryFile(max_size=CHUNK * 8) as buf:
        buf.write(header)
        while chunk := await file.read(CHUNK):
            size += len(chunk)
            if size > max_bytes:
                raise HTTPException(
                    status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    f"File is larger than {settings.max_upload_mb} MB",
                )
            buf.write(chunk)
        url = await run_in_threadpool(storage.save, buf, name, ext)
    return UploadOut(url=url, kind=kind)
