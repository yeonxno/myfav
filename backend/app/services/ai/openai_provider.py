"""
OpenAI Chat Completions 호출. API명세서 5.2절.
json_schema strict 모드로 스키마에 맞는 응답만 받는다.

확인 필요: 테스트 계정 크레딧 부족으로 OpenAI 쪽은 실제 호출을 검증하지 못했다.
"""

import json

import httpx

from app.core.config import Settings
from app.services.ai.base import AIRequest

OPENAI_URL = "https://api.openai.com/v1/chat/completions"


def call_openai(settings: Settings, request: AIRequest, timeout: float) -> tuple[dict, dict]:
    """(응답 JSON, usage)를 반환한다."""
    payload = {
        "model": settings.ai_model,
        "max_completion_tokens": request.max_tokens,
        "response_format": {
            "type": "json_schema",
            "json_schema": {"name": f"{request.name}_result", "strict": True, "schema": request.schema},
        },
        "messages": [
            {"role": "system", "content": request.system},
            {"role": "user", "content": request.user},
        ],
    }
    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }
    with httpx.Client(timeout=timeout) as client:
        response = client.post(OPENAI_URL, json=payload, headers=headers)
        response.raise_for_status()
        body = response.json()

    choice = body["choices"][0]
    if choice.get("finish_reason") == "length":
        raise ValueError(f"OpenAI 응답이 max_completion_tokens({request.max_tokens})에서 잘렸어요.")
    return json.loads(choice["message"]["content"]), body.get("usage", {})
