"""API명세서 3.1·3.2절: 기기 등록 · 전체 기록 삭제."""

from fastapi import APIRouter
from sqlalchemy import func, select

from app.deps import CurrentDevice, DbSession
from app.models import Device, Issue

router = APIRouter(tags=["devices"])


@router.post("/devices", status_code=201)
def register_device(db: DbSession):
    device = Device()
    db.add(device)
    db.commit()
    db.refresh(device)
    return {
        "success": True,
        "data": {"device_id": device.device_id, "created_at": device.created_at.isoformat()},
    }


@router.delete("/devices/me")
def delete_my_device(db: DbSession, device: CurrentDevice):
    deleted_issue_count = db.execute(
        select(func.count()).select_from(Issue).where(Issue.device_id == device.device_id)
    ).scalar_one()

    db.delete(device)  # ON DELETE CASCADE로 analysis/issue/issue_track/recommendation/stamp 함께 삭제
    db.commit()

    return {"success": True, "data": {"deleted_issue_count": deleted_issue_count}}
