"""API명세서 3장 요청 바디 스키마. 필드 이름은 명세서 그대로(snake_case)."""

from pydantic import BaseModel, Field


class TrackInput(BaseModel):
    track_id: int
    title: str
    artist: str
    artwork_url: str | None = None
    genre: str | None = None


class AnalysisCreateRequest(BaseModel):
    tracks: list[TrackInput]
    invite_id: str | None = None


class StampUpdateRequest(BaseModel):
    stamp: str = Field(pattern="^(love|near|unsure|no)$")
