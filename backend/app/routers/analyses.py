"""API명세서 3.4~3.6절: 분석 요청 · 상태 조회 · 취소."""

from fastapi import APIRouter, BackgroundTasks
from sqlalchemy import select

from app.constants.values import TRACK_COUNT_MAX, TRACK_COUNT_MIN
from app.core.errors import ApiError
from app.deps import CurrentDevice, DbSession
from app.models import Analysis, Issue
from app.schemas.requests import AnalysisCreateRequest
from app.services.analysis_pipeline import run_analysis
from app.services.track_key import compute_track_key

router = APIRouter(tags=["analyses"])


@router.post("/analyses", status_code=202)
def create_analysis(
    body: AnalysisCreateRequest,
    background_tasks: BackgroundTasks,
    db: DbSession,
    device: CurrentDevice,
):
    if not (TRACK_COUNT_MIN <= len(body.tracks) <= TRACK_COUNT_MAX):
        raise ApiError("TRACK_COUNT_INVALID")

    track_ids = [t.track_id for t in body.tracks]
    if len(set(track_ids)) != len(track_ids):
        raise ApiError("TRACK_DUPLICATED")

    # 궁합 초대(invite_id)는 후순위 기능이라 match_invite 테이블이 없다. 들어오면 거절한다.
    if body.invite_id:
        raise ApiError("INVITE_NOT_FOUND")

    track_key = compute_track_key(track_ids)

    existing = db.execute(
        select(Issue).where(Issue.device_id == device.device_id, Issue.track_key == track_key)
    ).scalar_one_or_none()
    if existing:
        # 기능명세서 3.5절: 같은 곡 조합이면 재분석하지 않고 기존 이슈를 재사용한다.
        reused_analysis = Analysis(
            device_id=device.device_id,
            status="done",
            tracks=[t.model_dump() for t in body.tracks],
            track_key=track_key,
            issue_id=existing.issue_id,
        )
        db.add(reused_analysis)
        db.commit()
        db.refresh(reused_analysis)
        return {
            "success": True,
            "data": {
                "analysis_id": reused_analysis.analysis_id,
                "status": "done",
                "reused": True,
                "issue_id": existing.issue_id,
            },
        }

    analysis = Analysis(
        device_id=device.device_id,
        status="analyzing",
        tracks=[t.model_dump() for t in body.tracks],
        track_key=track_key,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    background_tasks.add_task(run_analysis, analysis.analysis_id)

    return {
        "success": True,
        "data": {"analysis_id": analysis.analysis_id, "status": "analyzing", "reused": False},
    }


def _get_owned_analysis(db: DbSession, device: CurrentDevice, analysis_id: str) -> Analysis:
    analysis = db.get(Analysis, analysis_id)
    if not analysis or analysis.device_id != device.device_id:
        raise ApiError("ANALYSIS_NOT_FOUND")
    return analysis


@router.get("/analyses/{analysis_id}")
def get_analysis_status(analysis_id: str, db: DbSession, device: CurrentDevice):
    analysis = _get_owned_analysis(db, device, analysis_id)
    return {
        "success": True,
        "data": {
            "analysis_id": analysis.analysis_id,
            "status": analysis.status,
            "issue_id": analysis.issue_id,
            "invite_id": analysis.invite_id,
            "error_code": analysis.error_code,
        },
    }


@router.delete("/analyses/{analysis_id}")
def cancel_analysis(analysis_id: str, db: DbSession, device: CurrentDevice):
    analysis = _get_owned_analysis(db, device, analysis_id)
    if analysis.status == "done":
        raise ApiError("ANALYSIS_ALREADY_DONE")

    analysis.status = "canceled"
    db.commit()
    return {"success": True, "data": {"canceled": True}}
