"""
AI 모델 호출을 함수 하나로 감싼다(API명세서 5.2절: `analyzeTaste(tracks, perfumes, images)`).
나머지 코드는 어느 제공사·모델을 쓰는지 모른다. 제공사는 환경 변수 AI_PROVIDER로 정한다.
"""

from pydantic import ValidationError

from app.constants.values import AI_RETRY_COUNT
from app.core.config import Settings
from app.schemas.ai import AnalyzeResult
from app.services.ai.anthropic_provider import call_anthropic
from app.services.ai.openai_provider import call_openai


class AIResponseInvalidError(Exception):
    """기능명세서 3.11절: 형식 오류로 재요청 후에도 실패하면 분석을 failed로 끝낸다."""


def _call_provider(settings: Settings, tracks: list[dict], perfumes: list[dict], images: list[str]) -> dict:
    if settings.ai_provider == "anthropic":
        return call_anthropic(settings, tracks, perfumes, images)
    return call_openai(settings, tracks, perfumes, images)


def analyze_taste(
    settings: Settings,
    tracks: list[dict],
    perfumes: list[dict],
    images: list[str],
) -> AnalyzeResult:
    attempts = AI_RETRY_COUNT + 1
    last_error: Exception | None = None

    for _ in range(attempts):
        try:
            raw = _call_provider(settings, tracks, perfumes, images)
            return AnalyzeResult.model_validate(raw)
        except (ValidationError, ValueError, KeyError) as exc:
            last_error = exc
            continue

    raise AIResponseInvalidError(str(last_error))
