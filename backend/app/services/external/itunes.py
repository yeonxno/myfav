"""iTunes 음악 검색을 서버에서 대신 호출한다.

Apps in Toss iOS WebView에서는 외부 도메인 직접 호출이 불안정할 수 있어,
클라이언트가 Apple API에 직접 접근하지 않도록 이 모듈을 사용한다.
"""

from __future__ import annotations

import logging
import threading
import time
from typing import Any

import httpx

logger = logging.getLogger(__name__)

ITUNES_SEARCH_URL = "https://itunes.apple.com/search"
SEARCH_LIMIT = 10
CACHE_TTL_SECONDS = 60

_cache: dict[str, tuple[float, list[dict[str, Any]]]] = {}
_cache_lock = threading.Lock()


def search_music(term: str) -> list[dict[str, Any]]:
    """Return the small frontend-facing track DTO list for a search term."""
    normalized_term = term.strip()
    cache_key = normalized_term.casefold()
    now = time.monotonic()

    with _cache_lock:
        cached = _cache.get(cache_key)
        if cached and now - cached[0] < CACHE_TTL_SECONDS:
            return cached[1]

    try:
        response = httpx.get(
            ITUNES_SEARCH_URL,
            params={
                "term": normalized_term,
                "media": "music",
                "entity": "song",
                "limit": SEARCH_LIMIT,
            },
            timeout=8.0,
        )
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("iTunes search failed for term=%r: %s", normalized_term, exc)
        raise RuntimeError("iTunes search request failed") from exc

    results = payload.get("results", []) if isinstance(payload, dict) else []
    tracks = [_to_track(item) for item in results if isinstance(item, dict)]
    tracks = [track for track in tracks if track is not None]

    with _cache_lock:
        _cache[cache_key] = (now, tracks)

    return tracks


def _to_track(item: dict[str, Any]) -> dict[str, Any] | None:
    track_id = item.get("trackId")
    title = item.get("trackName")
    artist = item.get("artistName")
    if not isinstance(track_id, int) or not isinstance(title, str) or not isinstance(artist, str):
        return None

    artwork_url = item.get("artworkUrl100")
    genre = item.get("primaryGenreName")
    return {
        "track_id": track_id,
        "title": title,
        "artist": artist,
        "artwork_url": artwork_url if isinstance(artwork_url, str) else None,
        "genre": genre if isinstance(genre, str) else None,
    }
