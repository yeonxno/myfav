"""GET /music/search - iTunes search proxy for Apps in Toss clients."""

from fastapi import APIRouter, Query

from app.core.errors import ApiError
from app.services.external.itunes import search_music

router = APIRouter(tags=["music"])


@router.get("/music/search")
def get_music_search(q: str = Query(min_length=1, max_length=100)):
    try:
        tracks = search_music(q)
    except RuntimeError as exc:
        raise ApiError("INTERNAL_ERROR") from exc

    return {"success": True, "data": tracks}
