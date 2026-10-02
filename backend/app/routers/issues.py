"""API명세서 3.7·3.8절: 이슈 목록 · 조회 · 분야별 추천."""

from fastapi import APIRouter
from sqlalchemy import desc, select

from app.core.errors import ApiError
from app.deps import CurrentDevice, DbSession
from app.models import Issue
from app.services.serializers import (
    serialize_issue_detail,
    serialize_issue_summary,
    serialize_recommendation_summary,
)

router = APIRouter(tags=["issues"])


@router.get("/issues")
def list_issues(db: DbSession, device: CurrentDevice):
    issues = db.execute(
        select(Issue).where(Issue.device_id == device.device_id).order_by(desc(Issue.created_at))
    ).scalars().all()
    return {
        "success": True,
        "data": {"issues": [serialize_issue_summary(i) for i in issues], "total": len(issues)},
    }


@router.get("/issues/{issue_id}")
def get_issue(issue_id: str, db: DbSession, device: CurrentDevice):
    issue = db.get(Issue, issue_id)
    if not issue:
        raise ApiError("ISSUE_NOT_FOUND")
    # 기능명세서 2.7절: 공유 링크로 들어온 다른 사람에게는 읽기 전용으로 보여준다.
    is_owner = issue.device_id == device.device_id
    return {"success": True, "data": serialize_issue_detail(issue, is_owner=is_owner)}


@router.get("/issues/{issue_id}/recommendations")
def get_issue_recommendations(issue_id: str, db: DbSession, device: CurrentDevice):
    issue = db.get(Issue, issue_id)
    if not issue:
        raise ApiError("ISSUE_NOT_FOUND")
    if issue.device_id != device.device_id:
        raise ApiError("FORBIDDEN")

    by_category: dict[str, list[dict]] = {"movie": [], "book": [], "travel": [], "perfume": []}
    for rec in sorted(issue.recommendations, key=lambda r: r.rank):
        by_category[rec.category].append(serialize_recommendation_summary(rec))

    return {"success": True, "data": by_category}
