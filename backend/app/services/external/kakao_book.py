"""카카오 책 검색. API명세서 5.4절."""

import httpx

from app.core.config import Settings

SEARCH_URL = "https://dapi.kakao.com/v3/search/book"


def search_book(settings: Settings, title: str, author: str) -> dict | None:
    params = {"query": title, "target": "title", "size": 5}
    headers = {"Authorization": f"KakaoAK {settings.kakao_rest_api_key}"}

    with httpx.Client(timeout=15.0) as client:
        response = client.get(SEARCH_URL, params=params, headers=headers)
        response.raise_for_status()
        documents = response.json().get("documents", [])

    # 기능명세서 3.9절: 저자가 일치하는 첫 번째 결과만 채택한다.
    for doc in documents:
        authors = doc.get("authors") or []
        if any(author.strip() in a or a in author.strip() for a in authors):
            year_text = (doc.get("datetime") or "")[:4]
            return {
                "source_id": doc.get("isbn", "").split(" ")[0] or doc.get("isbn", ""),
                "title": doc.get("title") or title,
                "meta": f"{title} · {year_text} · {', '.join(authors)}".strip(" ·"),
                "image_url": doc.get("thumbnail") or None,
            }
    return None
