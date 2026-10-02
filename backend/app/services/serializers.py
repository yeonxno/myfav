"""여러 라우터에서 같은 모양으로 쓰는 응답 직렬화 함수들."""

from app.models import Issue


def serialize_issue_summary(issue: Issue) -> dict:
    """API명세서 3.3·3.7절의 latest_issue / issues[] 항목 모양."""
    first_track = issue.tracks[0] if issue.tracks else None
    return {
        "issue_id": issue.issue_id,
        "issue_no": issue.issue_no,
        "taste_name": issue.taste_name,
        "tags": issue.tags,
        "mood_image_url": issue.mood_image.image_url if issue.mood_image else None,
        "first_track": (
            {"title": first_track.title, "artist": first_track.artist} if first_track else None
        ),
        "track_count": len(issue.tracks),
        "created_at": issue.created_at.isoformat(),
    }


def serialize_issue_detail(issue: Issue, *, is_owner: bool) -> dict:
    """API명세서 3.7절 GET /issues/{issue_id} 응답 모양."""
    return {
        "issue_id": issue.issue_id,
        "issue_no": issue.issue_no,
        "is_owner": is_owner,
        "taste_name": issue.taste_name,
        "summary": issue.summary,
        "tags": issue.tags,
        "axes": issue.axes_dict(),
        "mood_image_url": issue.mood_image.image_url if issue.mood_image else None,
        "tracks": [
            {
                "track_id": t.track_id,
                "title": t.title,
                "artist": t.artist,
                "artwork_url": t.artwork_url,
            }
            for t in issue.tracks
        ],
        "created_at": issue.created_at.isoformat(),
    }


def serialize_recommendation_summary(rec) -> dict:
    """API명세서 3.8절 GET /issues/{issue_id}/recommendations 항목 모양."""
    return {
        "rec_id": rec.rec_id,
        "rank": rec.rank,
        "title": rec.title,
        "image_url": rec.image_url,
        "match_score": rec.match_score,
        "reason": rec.reason,
        "tags": rec.tags,
        "stamp": rec.stamp.stamp if rec.stamp else None,
    }


def serialize_recommendation_detail(rec) -> dict:
    """API명세서 3.9절 GET /recommendations/{rec_id} 응답 모양."""
    return {
        "rec_id": rec.rec_id,
        "issue_id": rec.issue_id,
        "category": rec.category,
        "rank": rec.rank,
        "title": rec.title,
        "meta": rec.meta,
        "description": rec.description,
        "image_url": rec.image_url,
        "match_score": rec.match_score,
        "reason": rec.reason,
        "mappings": rec.mappings,
        "evidence": rec.evidence,
        "tags": rec.tags,
        "source": rec.source,
        "stamp": rec.stamp.stamp if rec.stamp else None,
    }
