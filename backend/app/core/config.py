"""환경 변수 기반 설정. API명세서 5.2절: AI 제공사·모델은 코드 재배포 없이 환경 변수로 바꾼다."""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "mysql+pymysql://user:password@localhost:3306/myfav?charset=utf8mb4"

    ai_provider: Literal["openai", "anthropic"] = "openai"
    ai_model: str = "gpt-5.4-mini"
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    tmdb_api_key: str = ""
    kakao_rest_api_key: str = ""
    opentripmap_api_key: str = ""

    cors_origins: str = "http://localhost:5173"

    # 이미지 풀(여행지/무드 겸용) 정적 파일을 서빙할 때 절대 URL을 만드는 데 쓴다.
    public_base_url: str = "http://localhost:8000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
