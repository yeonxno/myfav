"""
AI 모델 응답 검증 스키마. API명세서 5.2절 JSON 형식 기준.
형식이 안 맞으면(ValidationError) 분석 파이프라인이 1회 재요청하고, 그래도 실패하면
AI_RESPONSE_INVALID로 분석을 끝낸다(기능명세서 3.11절).
"""

from pydantic import BaseModel, Field

from app.schemas.common import Axes


class Mapping(BaseModel):
    music: str
    target: str


class TasteResult(BaseModel):
    axes: Axes
    taste_name: str
    summary: list[str] = Field(min_length=1, max_length=2)
    tags: list[str] = Field(min_length=4, max_length=4)
    mood_image: str


class RecommendationCandidate(BaseModel):
    # 공통 필드
    description: str
    reason: str
    mappings: list[Mapping] = Field(min_length=3, max_length=3)
    evidence: str
    tags: list[str] = Field(min_length=1, max_length=3)
    axes: Axes

    # 영화/책/여행지 공통(제목). perfume은 API명세서 5.2절상 perfume_id만 받으므로 비어 있을 수 있다.
    title: str | None = None

    # 영화
    original_title: str | None = None
    year: int | None = None

    # 책 (title을 국내 출간 제목으로 재사용)
    author: str | None = None

    # 여행지
    name_en: str | None = None
    country: str | None = None
    season: str | None = None
    travel_type: str | None = None
    image: str | None = None

    # 향수
    perfume_id: str | None = None


class AnalyzeRecommendations(BaseModel):
    movie: list[RecommendationCandidate] = []
    book: list[RecommendationCandidate] = []
    travel: list[RecommendationCandidate] = []
    perfume: list[RecommendationCandidate] = []


class AnalyzeResult(BaseModel):
    taste: TasteResult
    recommendations: AnalyzeRecommendations
