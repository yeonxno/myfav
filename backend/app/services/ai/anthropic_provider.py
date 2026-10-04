"""
Anthropic Messages API 호출. API명세서 5.2절(대체 모델).
JSON 강제 출력을 위해 strict tool 하나를 정의하고 tool_choice로 그 tool 호출을 강제한다.
strict 모드라 스키마의 필수 필드가 빠진 응답은 오지 않는다.
"""

import httpx

from app.core.config import Settings
from app.services.ai.base import AIRequest

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"
RESULT_TOOL_NAME = "submit_result"


def call_anthropic(settings: Settings, request: AIRequest, timeout: float) -> tuple[dict, dict]:
    """(도구 입력, usage)를 반환한다."""
    payload = {
        "model": settings.ai_model,
        "max_tokens": request.max_tokens,
        # system은 요청마다 같으므로 캐시한다(도구 스키마 포함). 최소 길이에 못 미치면 캐시되지 않을 뿐 오류는 없다.
        "system": [{"type": "text", "text": request.system, "cache_control": {"type": "ephemeral"}}],
        "messages": [{"role": "user", "content": request.user}],
        "tools": [
            {
                "name": RESULT_TOOL_NAME,
                "description": "분석 결과를 제출한다.",
                "strict": True,
                "input_schema": request.schema,
            }
        ],
        "tool_choice": {"type": "tool", "name": RESULT_TOOL_NAME},
    }
    headers = {
        "x-api-key": settings.anthropic_api_key,
        "anthropic-version": ANTHROPIC_VERSION,
        "Content-Type": "application/json",
    }
    with httpx.Client(timeout=timeout) as client:
        response = client.post(ANTHROPIC_URL, json=payload, headers=headers)
        response.raise_for_status()
        body = response.json()

    if body.get("stop_reason") == "max_tokens":
        raise ValueError(f"Anthropic 응답이 max_tokens({request.max_tokens})에서 잘렸어요.")
    for block in body["content"]:
        if block.get("type") == "tool_use":
            return block["input"], body.get("usage", {})
    raise ValueError("Anthropic 응답에서 tool_use 블록을 찾지 못했어요.")
