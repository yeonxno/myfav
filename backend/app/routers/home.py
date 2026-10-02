"""API명세서 3.3절: GET /home."""

from fastapi import APIRouter
from sqlalchemy import desc, func, select

from app.deps import CurrentDevice, DbSession
from app.models import Issue
from app.services.serializers import serialize_issue_summary

router = APIRouter(tags=["home"])


@router.get("/home")
def get_home(db: DbSession, device: CurrentDevice):
    issue_count = db.execute(
        select(func.count()).select_from(Issue).where(Issue.device_id == device.device_id)
    ).scalar_one()

    latest_issue = db.execute(
        select(Issue).where(Issue.device_id == device.device_id).order_by(desc(Issue.created_at)).limit(1)
    ).scalar_one_or_none()

    return {
        "success": True,
        "data": {
            "has_issue": issue_count > 0,
            "issue_count": issue_count,
            "latest_issue": serialize_issue_summary(latest_issue) if latest_issue else None,
            # match_invite는 후순위 기능이라 MVP에서는 항상 null(API명세서 3.3절).
            "match_arrived": None,
        },
    }
