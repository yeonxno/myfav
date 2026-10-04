"""
AI 모델 호출을 함수 하나로 감싼다(API명세서 5.2절: `analyzeTaste(tracks, perfumes, images)`).
나머지 코드는 어느 제공사·모델을 쓰는지 모른다. 제공사는 환경 변수 AI_PROVIDER로 정한다.

속도를 위해 내부에서 AI 호출 여러 개(취향 1 + 분야 4 x 묶음 수)를 동시에 실행하고,
결과를 5.2절 형식 하나로 합친다. 분야 후보는 묶음 순서대로 이어 붙이고 겹치는 후보는 하나만 남긴다.
- 형식 오류 시 1회 재요청 규칙(기능명세서 3.11절)은 호출마다 적용한다.
- 취향 호출이 실패하면 분석 전체가 실패한다.
- 분야 호출이 실패하면 그 묶음만 빠진다. 한 분야의 묶음이 모두 실패하면 그 분야는 비운다
  (외부 조회 0건과 같은 처리). 네 분야가 모두 비면 분석 실패.
"""

from __future__ import annotations

import logging
import time
from collections.abc import Callable
from concurrent.futures import Future, ThreadPoolExecutor
from typing import Any, TypeVar

import httpx
from pydantic import TypeAdapter, ValidationError

from app.constants.values import AI_CALL_TIMEOUT_SECONDS, AI_RETRY_COUNT, RECOMMENDATION_CANDIDATE_CHUNKS
from app.core.config import Settings
from app.schemas.ai import AnalyzeRecommendations, AnalyzeResult, RecommendationCandidate, TasteResult
from app.services.ai.anthropic_provider import call_anthropic
from app.services.ai.base import CATEGORIES, AIRequest, build_category_request, build_taste_request
from app.services.ai.openai_provider import call_openai

logger = logging.getLogger("app.ai")

T = TypeVar("T")

# 재요청 대상인 일시적 HTTP 오류(요청 한도 초과, 서버 과부하)
RETRYABLE_STATUS = {429, 500, 502, 503, 504, 529}

_candidates_adapter = TypeAdapter(list[RecommendationCandidate])


class AIResponseInvalidError(Exception):
    """기능명세서 3.11절: 형식 오류로 재요청 후에도 실패하면 분석을 failed로 끝낸다."""


class AITimeoutError(Exception):
    """API명세서 6장 AI_TIMEOUT: AI 응답이 제한 시간 안에 오지 않음."""


def _call_provider(settings: Settings, request: AIRequest) -> tuple[dict, dict]:
    if settings.ai_provider == "anthropic":
        return call_anthropic(settings, request, AI_CALL_TIMEOUT_SECONDS)
    return call_openai(settings, request, AI_CALL_TIMEOUT_SECONDS)


def _run(settings: Settings, request: AIRequest, parse: Callable[[dict], T]) -> T:
    attempts = AI_RETRY_COUNT + 1
    last_error: Exception | None = None

    for attempt in range(1, attempts + 1):
        started = time.monotonic()
        retry_delay_seconds = 0
        try:
            raw, usage = _call_provider(settings, request)
            result = parse(raw)
            logger.info(
                "AI 호출 완료 [%s] %.1f초 (시도 %d, 출력 %s토큰, 캐시 읽기 %s토큰)",
                request.name,
                time.monotonic() - started,
                attempt,
                usage.get("output_tokens", usage.get("completion_tokens")),
                usage.get("cache_read_input_tokens", 0),
            )
            return result
        except httpx.TimeoutException as exc:
            logger.error("AI 호출 시간 초과 [%s] %.1f초", request.name, time.monotonic() - started)
            raise AITimeoutError(str(exc)) from exc
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code not in RETRYABLE_STATUS:
                logger.error(
                    "AI 호출 HTTP 오류 [%s] status=%s: %s",
                    request.name,
                    exc.response.status_code,
                    exc.response.text[:500],
                )
                raise AIResponseInvalidError(
                    f"[{request.name}] AI 제공사 HTTP {exc.response.status_code}"
                ) from exc
            last_error = exc
            # 동시에 여러 분야를 요청할 때의 일시적인 요청 한도·과부하 오류는 바로 재시도하면
            # 다시 같은 한도에 걸린다. 짧게 기다린 뒤 한 번만 재시도한다.
            retry_delay_seconds = attempt
        except (ValidationError, ValueError, KeyError) as exc:
            last_error = exc
        logger.warning(
            "AI 호출 실패 [%s] %.1f초 (시도 %d/%d): %s",
            request.name,
            time.monotonic() - started,
            attempt,
            attempts,
            str(last_error)[:500],
        )
        if retry_delay_seconds and attempt < attempts:
            time.sleep(retry_delay_seconds)

    raise AIResponseInvalidError(f"[{request.name}] {last_error}")


# strict 스키마는 배열 개수를 강제하지 못한다. 넘치는 항목은 잘라서 명세 개수에 맞추고,
# 모자라면 검증에서 걸러 재요청한다.
def _parse_taste(raw: dict) -> TasteResult:
    raw = {**raw, "summary": list(raw.get("summary", []))[:2], "tags": list(raw.get("tags", []))[:4]}
    return TasteResult.model_validate(raw)


def _parse_candidates(raw: dict) -> list[RecommendationCandidate]:
    items: list[dict[str, Any]] = [
        {**c, "mappings": list(c.get("mappings", []))[:3], "tags": list(c.get("tags", []))[:3]}
        for c in raw["candidates"]
    ]
    return _candidates_adapter.validate_python(items)


def _candidate_keys(candidate: RecommendationCandidate) -> set[str]:
    """같은 대상을 가리키는 표기(공백·대소문자만 다른 제목, 원제, 영문 지명, 향수 ID)를 모두 키로 쓴다."""
    values = (candidate.perfume_id, candidate.title, candidate.original_title, candidate.name_en)
    return {"".join(v.split()).lower() for v in values if v and v.strip()}


def _merge_chunks(chunks: list[list[RecommendationCandidate]]) -> list[RecommendationCandidate]:
    merged: list[RecommendationCandidate] = []
    seen: set[str] = set()
    for chunk in chunks:
        for candidate in chunk:
            keys = _candidate_keys(candidate)
            if keys & seen:
                continue
            seen |= keys
            merged.append(candidate)
    return merged


def analyze_taste(
    settings: Settings,
    tracks: list[dict],
    perfumes: list[dict],
    images: list[str],
) -> AnalyzeResult:
    started = time.monotonic()
    pool = ThreadPoolExecutor(max_workers=1 + len(CATEGORIES) * len(RECOMMENDATION_CANDIDATE_CHUNKS))
    try:
        taste_future = pool.submit(_run, settings, build_taste_request(tracks, images), _parse_taste)
        category_futures: dict[str, list[Future[list[RecommendationCandidate]]]] = {
            category: [
                pool.submit(
                    _run,
                    settings,
                    build_category_request(category, tracks, perfumes, images, count, index),
                    _parse_candidates,
                )
                for index, count in enumerate(RECOMMENDATION_CANDIDATE_CHUNKS)
            ]
            for category in CATEGORIES
        }

        # 취향 호출 실패는 분석 전체 실패다. 나머지 호출을 기다리지 않고 바로 끝낸다.
        taste = taste_future.result()

        recommendations: dict[str, list[RecommendationCandidate]] = {}
        errors: list[Exception] = []
        failed_categories = 0
        for category, futures in category_futures.items():
            chunks: list[list[RecommendationCandidate]] = []
            for future in futures:
                try:
                    chunks.append(future.result())
                except Exception as exc:  # noqa: BLE001 - 한 호출의 실패(형식 오류·시간 초과·HTTP 오류)는 그 묶음만 뺀다
                    logger.error("분야 추천 묶음 실패, 이 묶음은 빼고 진행합니다 [%s]: %r", category, exc)
                    errors.append(exc)
            if not chunks:
                failed_categories += 1
            recommendations[category] = _merge_chunks(chunks)

        if failed_categories == len(CATEGORIES):
            if all(isinstance(e, AITimeoutError) for e in errors):
                raise AITimeoutError("모든 분야 추천 호출이 시간 초과됐어요.")
            raise AIResponseInvalidError("모든 분야 추천 호출이 실패했어요.")
    finally:
        pool.shutdown(wait=False, cancel_futures=True)

    logger.info(
        "AI 단계 전체 %.1f초, 후보 수 %s",
        time.monotonic() - started,
        {category: len(items) for category, items in recommendations.items()},
    )
    return AnalyzeResult(taste=taste, recommendations=AnalyzeRecommendations(**recommendations))
