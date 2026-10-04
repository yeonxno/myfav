"""카카오 책 검색. API명세서 5.4절."""

import httpx

from app.core.config import Settings

SEARCH_URL = "https://dapi.kakao.com/v3/search/book"


def _as_book_result(doc: dict, query_title: str) -> dict:
    authors = doc.get("authors") or []
    year_text = (doc.get("datetime") or "")[:4]
    return {
        "source_id": doc.get("isbn", "").split(" ")[0] or doc.get("isbn", ""),
        "title": doc.get("title") or query_title,
        "meta": f"{doc.get('title') or query_title} · {year_text} · {', '.join(authors)}".strip(" ·"),
        "image_url": doc.get("thumbnail") or None,
    }

def search_book(settings: Settings, title: str, author: str) -> dict | None:
    params = {"query": title, "target": "title", "size": 5}
    headers = {"Authorization": f"KakaoAK {settings.kakao_rest_api_key}"}

    with httpx.Client(timeout=15.0) as client:
        response = client.get(SEARCH_URL, params=params, headers=headers)
        response.raise_for_status()
        documents = response.json().get("documents", [])

    # 저자가 일치하는 결과를 우선한다. 번역명·공저자 표기 차이로 모두 탈락하지 않도록
    # 같은 제목의 첫 결과도 최후 후보로 채택한다.
    normalized_author = author.casefold().strip()
    for doc in documents:
        authors = doc.get("authors") or []
        if normalized_author and any(
            normalized_author in item.casefold() or item.casefold() in normalized_author for item in authors
        ):
            return _as_book_result(doc, title)

    return _as_book_result(documents[0], title) if documents else None
