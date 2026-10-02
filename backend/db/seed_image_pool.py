"""
이미지 풀 시딩. images/travel_image/travel_destinations_150.json(루트) → image_pool 테이블.

사용자 승인 방침(2026-10-02 확인): 여행지 전용으로 만들어진 150장을 place/mood 겸용으로
재사용한다. 실제 파일이 여행지 사진뿐이라 kind는 모두 'place'로 저장하고, 무드 이미지
선택 로직(ai/__init__.py의 프롬프트 구성)도 kind로 거르지 않고 전체 목록을 사용한다.

파일 이름은 실제 파일명을 그대로 쓴다(한글 설명형, 기능명세서 예시의 영문 snake_case와
다르지만 "장소_특징_분위기" 형식 자체는 같다 — 3.9절 참고).

이미지는 프로젝트 루트의 images/travel_image를 복사하지 않고, 백엔드가 그 디렉터리를
정적 파일로 직접 서빙한다(app/main.py 참고). image_url은 PUBLIC_BASE_URL + /static/travel/파일명.

실행: python -m db.seed_image_pool  (backend/ 디렉터리에서)
"""

import json
from pathlib import Path
from urllib.parse import quote

from sqlalchemy import delete

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.models import ImagePool

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SOURCE_PATH = PROJECT_ROOT / "images" / "travel_image" / "travel_destinations_150.json"


def load_images() -> list[ImagePool]:
    settings = get_settings()
    raw = json.loads(SOURCE_PATH.read_text(encoding="utf-8"))
    images: list[ImagePool] = []
    for dest in raw["destinations"]:
        file_name = dest["filename"]
        image_url = f"{settings.public_base_url}/static/travel/{quote(file_name)}"
        images.append(ImagePool(file_name=file_name, image_url=image_url, kind="place"))
    return images


def main() -> None:
    images = load_images()
    with SessionLocal() as db:
        db.execute(delete(ImagePool))
        db.add_all(images)
        db.commit()
    print(f"이미지 풀 {len(images)}장을 저장했어요.")


if __name__ == "__main__":
    main()
