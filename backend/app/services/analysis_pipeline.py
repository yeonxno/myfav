"""
분석 파이프라인. API명세서 7.3절 흐름(AI 호출 → 분야별 외부 조회 동시 진행 → 채택·저장)을 구현한다.
POST /analyses 응답 후 백그라운드에서 실행된다(FastAPI BackgroundTasks).
"""

from __future__ import annotations

import datetime
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Any

logger = logging.getLogger("app.analysis_pipeline")

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.constants.values import RECOMMENDATION_CANDIDATES_REQUESTED, RECOMMENDATIONS_PER_CATEGORY
from app.core.config import Settings, get_settings
from app.core.database import SessionLocal
from app.models import Analysis, ImagePool, Issue, IssueTrack, Perfume, Recommendation
from app.schemas.ai import AnalyzeResult, RecommendationCandidate
from app.services.ai import AIResponseInvalidError, analyze_taste
from app.services.external.kakao_book import search_book
from app.services.external.opentripmap import place_exists
from app.services.external.tmdb import fetch_movie
from app.services.match_score import compute_match_score

CategoryResult = tuple[str, dict[str, Any] | None]


def _fetch_movie_candidate(settings: Settings, candidate: RecommendationCandidate) -> dict | None:
    found = fetch_movie(settings, candidate.original_title or candidate.title, candidate.title, candidate.year)
    if not found:
        return None
    return {"source": "tmdb", **found}


def _fetch_book_candidate(settings: Settings, candidate: RecommendationCandidate) -> dict | None:
    found = search_book(settings, candidate.title, candidate.author or "")
    if not found:
        return None
    return {"source": "kakao_book", **found}


def _fetch_travel_candidate(
    settings: Settings, candidate: RecommendationCandidate, image_lookup: dict[str, str]
) -> dict | None:
    if not candidate.name_en or not place_exists(settings, candidate.name_en):
        return None
    meta = " · ".join(filter(None, [candidate.country, candidate.season, candidate.travel_type]))
    return {
        "source": "opentripmap",
        "source_id": candidate.name_en,
        "title": candidate.title,
        "meta": meta,
        "image_url": image_lookup.get(candidate.image or ""),
    }


def _fetch_perfume_candidate(candidate: RecommendationCandidate, perfumes: dict[str, Perfume]) -> dict | None:
    perfume = perfumes.get(candidate.perfume_id or "")
    if not perfume:
        return None
    notes_preview = " · ".join(perfume.notes[:3])
    return {
        "source": "perfume_db",
        "source_id": perfume.perfume_id,
        "title": perfume.name,
        "meta": f"{perfume.name} · {perfume.family} · {notes_preview}".strip(" ·"),
        "image_url": perfume.image_url,
    }


def _resolve_category(
    category: str,
    candidates: list[RecommendationCandidate],
    settings: Settings,
    perfumes_by_id: dict[str, Perfume],
    image_lookup: dict[str, str],
) -> list[dict]:
    resolved: list[dict] = []
    for candidate in candidates[:RECOMMENDATION_CANDIDATES_REQUESTED]:
        if len(resolved) >= RECOMMENDATIONS_PER_CATEGORY:
            break
        found: dict | None = None
        try:
            if category == "movie":
                found = _fetch_movie_candidate(settings, candidate)
            elif category == "book":
                found = _fetch_book_candidate(settings, candidate)
            elif category == "travel":
                found = _fetch_travel_candidate(settings, candidate, image_lookup)
            elif category == "perfume":
                found = _fetch_perfume_candidate(candidate, perfumes_by_id)
        except Exception:  # noqa: BLE001 - 후보 하나의 외부 API 오류가 전체 분야를 망치지 않게 한다
            logger.exception("추천 후보 조회 실패 (category=%s, title=%s)", category, candidate.title)
            found = None

        if not found:
            continue

        resolved.append(
            {
                **found,
                "description": candidate.description,
                "reason": candidate.reason,
                "mappings": [m.model_dump() for m in candidate.mappings],
                "evidence": candidate.evidence,
                "tags": candidate.tags,
                "axes": candidate.axes.as_dict(),
            }
        )
    return resolved


def _next_issue_no(db: Session, device_id: str) -> int:
    current_max = db.execute(select(func.max(Issue.issue_no)).where(Issue.device_id == device_id)).scalar()
    return (current_max or 0) + 1


def run_analysis(analysis_id: str) -> None:
    settings = get_settings()
    db = SessionLocal()
    try:
        analysis = db.get(Analysis, analysis_id)
        if not analysis or analysis.status == "canceled":
            return

        tracks = analysis.tracks  # POST /analyses 요청 바디를 그대로 저장해 둔 값
        perfumes = db.execute(select(Perfume)).scalars().all()
        images = db.execute(select(ImagePool)).scalars().all()
        perfume_dicts = [
            {"perfume_id": p.perfume_id, "name": p.name, "brand": p.brand, "family": p.family, "notes": p.notes}
            for p in perfumes
        ]
        perfumes_by_id = {p.perfume_id: p for p in perfumes}
        image_lookup = {img.file_name: img.image_url for img in images}
        image_names = list(image_lookup.keys())

        try:
            result: AnalyzeResult = analyze_taste(settings, tracks, perfume_dicts, image_names)
        except AIResponseInvalidError as exc:
            logger.error("AI 응답 검증 실패 (analysis_id=%s): %s", analysis_id, exc)
            analysis.status = "failed"
            analysis.error_code = "AI_RESPONSE_INVALID"
            db.commit()
            return

        analysis.status = "fetching"
        db.commit()

        with ThreadPoolExecutor(max_workers=4) as pool:
            futures = {
                category: pool.submit(
                    _resolve_category, category, candidates, settings, perfumes_by_id, image_lookup
                )
                for category, candidates in (
                    ("movie", result.recommendations.movie),
                    ("book", result.recommendations.book),
                    ("travel", result.recommendations.travel),
                    ("perfume", result.recommendations.perfume),
                )
            }
            resolved_by_category = {category: future.result() for category, future in futures.items()}

        if all(len(items) == 0 for items in resolved_by_category.values()):
            analysis.status = "failed"
            analysis.error_code = "EXTERNAL_API_FAILED"
            db.commit()
            return

        mood_image = image_lookup.get(result.taste.mood_image)
        mood_image_row = (
            db.execute(select(ImagePool).where(ImagePool.file_name == result.taste.mood_image)).scalar_one_or_none()
            if mood_image
            else None
        )

        issue = Issue(
            device_id=analysis.device_id,
            issue_no=_next_issue_no(db, analysis.device_id),
            track_key=analysis.track_key,
            taste_name=result.taste.taste_name,
            summary="\n".join(result.taste.summary),
            tags=result.taste.tags,
            mood_image_id=mood_image_row.image_id if mood_image_row else None,
            ai_provider=settings.ai_provider,
            ai_model=settings.ai_model,
            created_at=datetime.datetime.utcnow(),
            **_axis_kwargs(result.taste.axes.as_dict()),
        )
        for position, track in enumerate(tracks, start=1):
            issue.tracks.append(
                IssueTrack(
                    position=position,
                    track_id=track["track_id"],
                    title=track["title"],
                    artist=track["artist"],
                    artwork_url=track.get("artwork_url"),
                    genre=track.get("genre"),
                )
            )

        user_axes = result.taste.axes.as_dict()
        for category, items in resolved_by_category.items():
            for rank, item in enumerate(items, start=1):
                issue.recommendations.append(
                    Recommendation(
                        category=category,
                        rank=rank,
                        source=item["source"],
                        source_id=item["source_id"],
                        title=item["title"],
                        meta=item["meta"],
                        description=item.get("description"),
                        image_url=item.get("image_url"),
                        match_score=compute_match_score(user_axes, item["axes"]),
                        reason=item["reason"],
                        mappings=item["mappings"],
                        evidence=item["evidence"],
                        tags=item["tags"],
                        created_at=datetime.datetime.utcnow(),
                        **_axis_kwargs(item["axes"]),
                    )
                )

        db.add(issue)
        db.flush()

        analysis.status = "done"
        analysis.issue_id = issue.issue_id
        db.commit()
    except Exception:  # noqa: BLE001 - 파이프라인 전체를 보호하는 최종 안전망
        logger.exception("분석 파이프라인 실패 (analysis_id=%s)", analysis_id)
        db.rollback()
        analysis = db.get(Analysis, analysis_id)
        if analysis:
            analysis.status = "failed"
            analysis.error_code = "EXTERNAL_API_FAILED"
            db.commit()
    finally:
        db.close()


def _axis_kwargs(axes: dict[str, int]) -> dict[str, int]:
    return {f"axis_{key}": value for key, value in axes.items()}
