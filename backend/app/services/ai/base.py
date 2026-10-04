"""
AI 제공사 공통 요청 구성. API명세서 5.2절·3.11절 기준.

분석 1건을 여러 AI 호출로 나눠 동시에 실행한다(취향 프로필 1 + 분야별 추천 4분야 x 묶음 수).
한 번에 후보 20건을 받으면 출력이 길어 2분 넘게 걸리기 때문이다. 묶음 나누기는
constants/values.py의 RECOMMENDATION_CANDIDATE_CHUNKS에서 정한다.
각 호출은 아래 JSON 스키마를 strict 모드로 강제해 필수 필드 누락(예: axes 빠짐)을 막는다.
호출 결과는 analyze_taste()가 API명세서 5.2절의 JSON 형식 하나로 합친다.
"""

from dataclasses import dataclass
from typing import Any

from app.constants.axes import AXIS_DEFINITIONS, AXIS_KEYS
from app.constants.values import AI_MAX_TOKENS_CATEGORY, AI_MAX_TOKENS_TASTE

CATEGORIES: tuple[str, ...] = ("movie", "book", "travel", "perfume")


@dataclass(frozen=True)
class AIRequest:
    """제공사와 무관한 AI 호출 1건. system은 요청마다 바뀌지 않는 부분이라 캐시 대상이다."""

    name: str  # 로그용 이름: taste / movie / book / travel / perfume
    system: str
    user: str
    schema: dict[str, Any]
    max_tokens: int


# ---------------------------------------------------------------------------
# 프롬프트 문구
# ---------------------------------------------------------------------------

SYSTEM_HEADER = """당신은 음악 취향을 분석해 다른 분야(영화·책·여행지·향수)로 번역해 주는 '취향 번역기'의 분석 엔진입니다.
사용자가 고른 3~5곡의 정보를 바탕으로 아래 작업을 수행하고, 결과는 반드시 제공된 도구로 제출하세요.

[8개 감각 축] 각 0~100점. 왼쪽(0)에 가까울수록 왼쪽 단어, 오른쪽(100)에 가까울수록 오른쪽 단어에 가깝습니다.
{axis_lines}
"""

TASTE_TASK = """
[작업] 사용자의 취향 프로필을 만드세요.
- axes: 위 8개 축 점수
- taste_name: 짧고 인상적인 한국어 취향 이름
- summary: 해설 정확히 2줄(각 1문장)
- tags: 취향 키워드 정확히 4개(영문 소문자)
- mood_image: 이 취향에 가장 어울리는 이미지 파일 이름(아래 이미지 목록 중 하나를 그대로)
"""

CATEGORY_COMMON_RULES = """
[작업] 사용자의 음악 취향을 먼저 스스로 파악한 뒤, {label} 추천 후보를 정확히 {count}개 고르세요.
{angle}
실제로 존재하고 외부 검색으로 찾을 수 있는 대상만 고릅니다. 문장은 짧고 구체적으로 씁니다.
- description: 대상 소개 1문장
- reason: 추천 이유 1문장
- mappings: 연결 근거 정확히 3개. music은 내 음악에서 느껴지는 특징(영단어), target은 대상의 특징(한국어)
- evidence: 사용자가 고른 곡 이름을 포함한 연결 설명 1문장
- tags: 1~3개
- axes: 대상의 8개 축 점수
{fields}"""

CATEGORY_FIELDS: dict[str, tuple[str, str]] = {
    "movie": (
        "영화",
        "- title: 한국어 제목\n- original_title: 원제\n- year: 개봉 연도",
    ),
    "book": (
        "책",
        "- title: 국내 출간 제목\n- author: 저자명(카카오 책 검색 결과와 대조할 수 있어야 함)",
    ),
    "travel": (
        "여행지",
        "- title: 한글 이름\n- name_en: 영문 지명(도시·지역 이름처럼 지명 검색으로 찾을 수 있는 이름)\n"
        "- country: 국가\n- season: 추천 계절\n- travel_type: 여행 성격\n"
        "- image: 가장 어울리는 이미지 파일 이름(아래 이미지 목록 중 하나를 그대로)",
    ),
    "perfume": (
        "향수",
        "- perfume_id: 아래 향수 목록의 id 중 하나(서로 다른 향수)",
    ),
}


# 분야 후보를 여러 호출로 나눌 때 묶음마다 다른 관점을 줘서 서로 겹치는 후보를 줄인다.
# 겹친 후보는 analyze_taste()에서 하나만 남긴다.
CHUNK_ANGLES: tuple[str, ...] = (
    "이 취향에 가장 잘 맞는 대표적인 대상부터 고릅니다.",
    "가장 뻔한 대표작은 피하고, 조금 의외지만 이 취향에 잘 맞는 대상을 고릅니다.",
    "앞의 두 기준과 겹치지 않도록, 덜 알려졌지만 이 취향에 잘 맞는 대상을 고릅니다.",
)


def build_axis_lines() -> str:
    return "\n".join(f"- {a.key}: {a.left}(0) ~ {a.right}(100)" for a in AXIS_DEFINITIONS)


def _system_header() -> str:
    return SYSTEM_HEADER.format(axis_lines=build_axis_lines())


def build_user_prompt(tracks: list[dict]) -> str:
    track_lines = "\n".join(
        f"- {t['title']} / {t['artist']} / 장르: {t.get('genre') or '알 수 없음'}" for t in tracks
    )
    return f"[선택한 음악]\n{track_lines}\n"


def build_image_lines(images: list[str]) -> str:
    return ", ".join(images)


def build_perfume_lines(perfumes: list[dict]) -> str:
    return "\n".join(
        f"- id={p['perfume_id']} | {p['name']} ({p['brand']}) | {p['family']} | 노트: {', '.join(p['notes'])}"
        for p in perfumes
    )


# ---------------------------------------------------------------------------
# JSON 스키마 (strict 모드: 모든 객체에 additionalProperties false, 모든 필드 required)
# strict 모드의 배열 개수 제약은 minItems 0 또는 1만 지원한다. 빈 배열만 minItems 1로 막고,
# 정확한 개수(3개 등)는 app/schemas/ai.py에서 검사한다.
# 이미지 파일 이름 150개를 enum으로 넣으면 "Schema is too complex for compilation"(400)이 나서
# 이미지는 일반 문자열로 받고 프롬프트에 목록을 준다. 목록에 없는 이름이면 이미지 없이 저장된다.
# ---------------------------------------------------------------------------


def _object(properties: dict[str, Any]) -> dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "required": list(properties.keys()),
        "properties": properties,
    }


def _string_array(description: str) -> dict[str, Any]:
    return {"type": "array", "description": description, "minItems": 1, "items": {"type": "string"}}


def _axes_schema() -> dict[str, Any]:
    return _object({key: {"type": "integer", "description": "0~100"} for key in AXIS_KEYS})


def _taste_schema() -> dict[str, Any]:
    return _object(
        {
            "axes": _axes_schema(),
            "taste_name": {"type": "string"},
            "summary": _string_array("정확히 2개(각 1문장)"),
            "tags": _string_array("정확히 4개(영문 소문자)"),
            "mood_image": {"type": "string"},
        }
    )


def _category_schema(category: str, perfume_ids: list[str], count: int) -> dict[str, Any]:
    specific: dict[str, dict[str, Any]] = {
        "movie": {
            "title": {"type": "string"},
            "original_title": {"type": "string"},
            "year": {"type": "integer"},
        },
        "book": {
            "title": {"type": "string"},
            "author": {"type": "string"},
        },
        "travel": {
            "title": {"type": "string"},
            "name_en": {"type": "string"},
            "country": {"type": "string"},
            "season": {"type": "string"},
            "travel_type": {"type": "string"},
            "image": {"type": "string"},
        },
        "perfume": {
            "perfume_id": {"type": "string", "enum": perfume_ids},
        },
    }[category]

    candidate = _object(
        {
            **specific,
            "description": {"type": "string"},
            "reason": {"type": "string"},
            "mappings": {
                "type": "array",
                "description": "정확히 3개. 실제 내용으로 채운다",
                "minItems": 1,
                "items": _object({"music": {"type": "string"}, "target": {"type": "string"}}),
            },
            "evidence": {"type": "string"},
            "tags": _string_array("1~3개"),
            "axes": _axes_schema(),
        }
    )
    return _object(
        {
            "candidates": {
                "type": "array",
                "description": f"정확히 {count}개",
                "minItems": 1,
                "items": candidate,
            }
        }
    )


# ---------------------------------------------------------------------------
# 요청 조립
# ---------------------------------------------------------------------------


def build_taste_request(tracks: list[dict], images: list[str]) -> AIRequest:
    return AIRequest(
        name="taste",
        system=_system_header() + TASTE_TASK + f"\n[이미지 목록]\n{build_image_lines(images)}\n",
        user=build_user_prompt(tracks),
        schema=_taste_schema(),
        max_tokens=AI_MAX_TOKENS_TASTE,
    )


def build_category_request(
    category: str,
    tracks: list[dict],
    perfumes: list[dict],
    images: list[str],
    count: int,
    chunk_index: int = 0,
) -> AIRequest:
    label, fields = CATEGORY_FIELDS[category]
    angle = CHUNK_ANGLES[min(chunk_index, len(CHUNK_ANGLES) - 1)]
    system = _system_header() + CATEGORY_COMMON_RULES.format(label=label, count=count, angle=angle, fields=fields)
    if category == "travel":
        system += f"\n\n[이미지 목록]\n{build_image_lines(images)}\n"
    if category == "perfume":
        system += f"\n\n[향수 목록 — 이 안에서만 고르세요]\n{build_perfume_lines(perfumes)}\n"

    perfume_ids = [p["perfume_id"] for p in perfumes]
    return AIRequest(
        name=f"{category}#{chunk_index + 1}",
        system=system,
        user=build_user_prompt(tracks),
        schema=_category_schema(category, perfume_ids, count),
        max_tokens=AI_MAX_TOKENS_CATEGORY,
    )
