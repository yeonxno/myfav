"""API명세서 1.4절 공통 값. axes 키 집합은 이 한 곳에서만 정의한다."""

from pydantic import BaseModel, Field

AXIS_KEYS = (
    "energy",
    "digital",
    "vivid",
    "abstract",
    "cold",
    "novel",
    "social",
    "dramatic",
)


class Axes(BaseModel):
    energy: int = Field(ge=0, le=100)
    digital: int = Field(ge=0, le=100)
    vivid: int = Field(ge=0, le=100)
    abstract: int = Field(ge=0, le=100)
    cold: int = Field(ge=0, le=100)
    novel: int = Field(ge=0, le=100)
    social: int = Field(ge=0, le=100)
    dramatic: int = Field(ge=0, le=100)

    def as_dict(self) -> dict[str, int]:
        return {key: getattr(self, key) for key in AXIS_KEYS}
