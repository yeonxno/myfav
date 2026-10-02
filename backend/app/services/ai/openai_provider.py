"""OpenAI Chat Completions 호출. API명세서 5.2절."""

import json

import httpx

from app.core.config import Settings
from app.services.ai.base import build_system_prompt, build_user_prompt

OPENAI_URL = "https://api.openai.com/v1/chat/completions"


def call_openai(
    settings: Settings,
    tracks: list[dict],
    perfumes: list[dict],
    images: list[str],
) -> dict:
    payload = {
        "model": settings.ai_model,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": build_system_prompt()},
            {"role": "user", "content": build_user_prompt(tracks, perfumes, images)},
        ],
    }
    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }
    with httpx.Client(timeout=180.0) as client:
        response = client.post(OPENAI_URL, json=payload, headers=headers)
        response.raise_for_status()
        body = response.json()

    content = body["choices"][0]["message"]["content"]
    return json.loads(content)
