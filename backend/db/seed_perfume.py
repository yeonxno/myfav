"""
향수 데이터 시딩. perfume_db_150.json(루트) → perfume 테이블.

사용자 승인 매핑 규칙(2026-10-02 확인):
- perfume_id = "P" + 3자리 숫자(id)
- name = name_ko, brand = brand_ko, family = family
- notes = main_notes를 쉼표로 잘라 배열로 변환
- image_url = NULL (원본 데이터에 이미지가 없어 항상 기본 일러스트 사용)
- citrus_vanilla 등 8개 숫자 특성 컬럼은 DB설계서에 없는 값이라 저장하지 않고 버린다

실행: python -m db.seed_perfume  (backend/ 디렉터리에서)
"""

import json
from pathlib import Path

from sqlalchemy import delete

from app.core.database import SessionLocal
from app.models import Perfume

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SOURCE_PATH = PROJECT_ROOT / "perfume_db_150.json"


def load_perfumes() -> list[Perfume]:
    raw = json.loads(SOURCE_PATH.read_text(encoding="utf-8"))
    perfumes: list[Perfume] = []
    for item in raw:
        notes = [note.strip() for note in item["main_notes"].split(",") if note.strip()]
        perfumes.append(
            Perfume(
                perfume_id=f"P{item['id']:03d}",
                name=item["name_ko"],
                brand=item["brand_ko"],
                family=item["family"],
                notes=notes,
                image_url=None,
            )
        )
    return perfumes


def main() -> None:
    perfumes = load_perfumes()
    with SessionLocal() as db:
        db.execute(delete(Perfume))
        db.add_all(perfumes)
        db.commit()
    print(f"향수 {len(perfumes)}건을 저장했어요.")


if __name__ == "__main__":
    main()
