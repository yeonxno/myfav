"""
AI 제공사 공통 프롬프트 구성. API명세서 5.2절·3.11절 기준.

주의(확인 필요): OpenAI `gpt-5.4-mini`, Anthropic `claude-sonnet-4-6`는 기능명세서가 지정한
모델명을 그대로 쓴다. 실제 호출은 네트워크·키가 없어 이번 구현에서 검증하지 못했다.
"""

from app.constants.axes import AXIS_DEFINITIONS

SYSTEM_PROMPT = """당신은 음악 취향을 분석해 다른 분야(영화·책·여행지·향수)로 번역해 주는 '취향 번역기'의 분석 엔진입니다.
사용자가 고른 3~5곡의 정보를 바탕으로 아래 작업을 모두 수행하고, 반드시 지정된 JSON 형식으로만 응답하세요.
다른 설명이나 마크다운 코드블록 없이 JSON 객체 하나만 출력합니다.

[8개 감각 축] 각 0~100점. 왼쪽(0)에 가까울수록 왼쪽 단어, 오른쪽(100)에 가까울수록 오른쪽 단어에 가깝습니다.
{axis_lines}

[작업]
1. taste: 위 8개 축 점수, 취향 이름(짧고 인상적인 한국어 문구), 해설 두 줄(summary 배열, 각 1문장),
   취향 키워드 4개(영문 소문자 태그, tags 배열), 그리고 images 목록 중 이 취향에 가장 어울리는 파일 이름 하나(mood_image).
2. recommendations: movie/book/travel/perfume 네 분야 각각 후보 5개.
   - 공통: description(소개 1~2문장), reason(추천 이유 1~2문장), mappings(연결 근거 정확히 3개,
     각 {{"music": 내 음악에서 느껴지는 영단어 특징, "target": 대상의 한국어 특징}}),
     evidence(사용자가 고른 곡 이름이 포함된 연결 설명 1~2문장), tags(1~3개), axes(대상의 8개 축 점수)
   - movie: title(한국어 제목), original_title(원제), year(개봉 연도)
   - book: title(국내 출간 제목), author(저자명, 카카오 책 검색 결과와 대조할 수 있어야 함)
   - travel: title(한글 이름), name_en(영문 이름), country(국가), season(추천 계절), travel_type(여행 성격),
     image(아래 이미지 파일 목록 중 가장 어울리는 파일 이름)
   - perfume: perfume_id(아래 향수 목록의 id 중 하나)

[출력 JSON 형식]
{{
  "taste": {{"axes": {{...8개 키...}}, "taste_name": "...", "summary": ["...", "..."], "tags": ["...","...","...","..."], "mood_image": "..."}},
  "recommendations": {{"movie": [...5개...], "book": [...5개...], "travel": [...5개...], "perfume": [...5개...]}}
}}
"""


def build_axis_lines() -> str:
    return "\n".join(f"- {a.key}: {a.left}(0) ~ {a.right}(100)" for a in AXIS_DEFINITIONS)


def build_system_prompt() -> str:
    return SYSTEM_PROMPT.format(axis_lines=build_axis_lines())


def build_user_prompt(
    tracks: list[dict],
    perfumes: list[dict],
    images: list[str],
) -> str:
    track_lines = "\n".join(
        f"- {t['title']} / {t['artist']} / 장르: {t.get('genre') or '알 수 없음'}" for t in tracks
    )
    perfume_lines = "\n".join(
        f"- id={p['perfume_id']} | {p['name']} ({p['brand']}) | {p['family']} | 노트: {', '.join(p['notes'])}"
        for p in perfumes
    )
    image_lines = ", ".join(images)

    return f"""[선택한 음악]
{track_lines}

[향수 후보 목록 — perfume 추천은 이 안에서만 고르세요]
{perfume_lines}

[이미지 파일 이름 목록 — mood_image, travel의 image는 이 안에서만 고르세요]
{image_lines}
"""
