"""공통 FastAPI 의존성. API명세서 1.2절: X-Device-Id 헤더로 기기를 식별한다."""

from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.errors import ApiError
from app.models import Device

DbSession = Annotated[Session, Depends(get_db)]


def require_device(
    db: DbSession,
    x_device_id: Annotated[str | None, Header(alias="X-Device-Id")] = None,
) -> Device:
    if not x_device_id:
        raise ApiError("DEVICE_NOT_FOUND")
    device = db.get(Device, x_device_id)
    if not device:
        raise ApiError("DEVICE_NOT_FOUND")
    return device


CurrentDevice = Annotated[Device, Depends(require_device)]
