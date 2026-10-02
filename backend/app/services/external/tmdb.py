"""TMDB 영화 조회. API명세서 5.3절."""

import httpx

from app.core.config import Settings

SEARCH_URL = "https://api.themoviedb.org/3/search/movie"
POSTER_BASE = "https://image.tmdb.org/t/p/w500"


def search_movie(settings: Settings, query: str, year: int | None) -> dict | None:
    params = {"query": query, "language": "ko-KR"}
    if year:
        params["year"] = year
    # TMDB v4 Read Access Token(JWT 형식)은 api_key 쿼리 파라미터가 아니라
    # Authorization: Bearer 헤더로 보낸다.
    headers = {"Authorization": f"Bearer {settings.tmdb_api_key}"}

    with httpx.Client(timeout=15.0) as client:
        response = client.get(SEARCH_URL, params=params, headers=headers)
        response.raise_for_status()
        results = response.json().get("results", [])

    if not results:
        return None

    first = results[0]
    year_text = (first.get("release_date") or "")[:4]
    return {
        "source_id": str(first["id"]),
        "title": first.get("title") or query,
        "meta": f"{first.get('original_title', query)} · {year_text}".strip(" ·"),
        "image_url": f"{POSTER_BASE}{first['poster_path']}" if first.get("poster_path") else None,
    }


def fetch_movie(settings: Settings, original_title: str, title: str, year: int | None) -> dict | None:
    """원제로 먼저 찾고, 없으면 번역 제목으로 다시 찾는다(API명세서 5.3절)."""
    result = search_movie(settings, original_title, year)
    if result:
        return result
    return search_movie(settings, title, year)
