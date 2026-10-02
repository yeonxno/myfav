"""API명세서 3.9·3.10절: 추천 상세 조회 · 스탬프 저장."""

import datetime

from fastapi import APIRouter

from app.core.errors import ApiError
from app.deps import CurrentDevice, DbSession
from app.models import Recommendation, Stamp
from app.schemas.requests import StampUpdateRequest
from app.services.serializers import serialize_recommendation_detail

router = APIRouter(tags=["recommendations"])


def _get_owned_recommendation(db: DbSession, device: CurrentDevice, rec_id: str) -> Recommendation:
    rec = db.get(Recommendation, rec_id)
    if not rec:
        raise ApiError("RECOMMENDATION_NOT_FOUND")
    if rec.issue.device_id != device.device_id:
        raise ApiError("FORBIDDEN")
    return rec


@router.get("/recommendations/{rec_id}")
def get_recommendation(rec_id: str, db: DbSession, device: CurrentDevice):
    rec = _get_owned_recommendation(db, device, rec_id)
    return {"success": True, "data": serialize_recommendation_detail(rec)}


@router.put("/recommendations/{rec_id}/stamp")
def put_stamp(rec_id: str, body: StampUpdateRequest, db: DbSession, device: CurrentDevice):
    rec = _get_owned_recommendation(db, device, rec_id)

    if rec.stamp:
        rec.stamp.stamp = body.stamp
        rec.stamp.updated_at = datetime.datetime.utcnow()
    else:
        rec.stamp = Stamp(rec_id=rec.rec_id, stamp=body.stamp)
        db.add(rec.stamp)

    db.commit()
    db.refresh(rec.stamp)

    return {
        "success": True,
        "data": {
            "rec_id": rec.rec_id,
            "stamp": rec.stamp.stamp,
            "updated_at": rec.stamp.updated_at.isoformat(),
        },
    }
