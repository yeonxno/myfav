"""
Anthropic Messages API 호출. API명세서 5.2절(대체 모델).
JSON 강제 출력을 위해 하나의 tool을 정의하고 tool_choice로 그 tool 호출을 강제한다.
"""

import httpx

from app.core.config import Settings
from app.services.ai.base import build_system_prompt, build_user_prompt

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"

RESULT_TOOL = {
    "name": "submit_taste_analysis",
    "description": "취향 분석 결과와 분야별 추천 후보를 제출한다.",
    "input_schema": {
        "type": "object",
        "properties": {
            "taste": {"type": "object"},
            "recommendations": {"type": "object"},
        },
        "required": ["taste", "recommendations"],
    },
}


def call_anthropic(
    settings: Settings,
    tracks: list[dict],
    perfumes: list[dict],
    images: list[str],
) -> dict:
    payload = {
        "model": settings.ai_model,
        "max_tokens": 16000,
        "system": build_system_prompt(),
        "messages": [{"role": "user", "content": build_user_prompt(tracks, perfumes, images)}],
        "tools": [RESULT_TOOL],
        "tool_choice": {"type": "tool", "name": "submit_taste_analysis"},
    }
    headers = {
        "x-api-key": settings.anthropic_api_key,
        "anthropic-version": ANTHROPIC_VERSION,
        "Content-Type": "application/json",
    }
    # 분야당 5건 x 4분야 + 취향 분석을 한 번에 요청하는 긴 구조화 응답이라 생성 시간이 꽤 걸린다.
    with httpx.Client(timeout=180.0) as client:
        response = client.post(ANTHROPIC_URL, json=payload, headers=headers)
        response.raise_for_status()
        body = response.json()

    for block in body["content"]:
        if block.get("type") == "tool_use":
            return block["input"]
    raise ValueError("Anthropic 응답에서 tool_use 블록을 찾지 못했어요.")
