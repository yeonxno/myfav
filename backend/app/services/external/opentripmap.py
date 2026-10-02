"""
OpenTripMap 여행지 조회. API명세서 5.5절.

주의(확인 필요): API명세서 5.5절 자체가 "이 절의 주소와 필드 이름은 OpenTripMap 문서를
열지 못한 상태에서 적었다. 구현 전에 공식 문서로 확인한다"고 명시한다. 아래 구현은
명세서에 적힌 주소·파라미터를 그대로 따랐을 뿐, 공식 문서로 검증하지 않았다.

용도는 "실존하는 여행지인지 확인"뿐이다(5.5절: 장소가 조회되면 채택, 지역/계절/여행 성격/
이미지는 모두 AI와 이미지 풀에서 가져온 값을 쓴다 — OpenTripMap 응답 내용 자체는 meta에
쓰지 않는다).
"""

import httpx

from app.core.config import Settings

GEONAME_URL = "https://api.opentripmap.com/0.1/en/places/geoname"


def place_exists(settings: Settings, name_en: str) -> bool:
    params = {"name": name_en, "apikey": settings.opentripmap_api_key}
    with httpx.Client(timeout=15.0) as client:
        response = client.get(GEONAME_URL, params=params)
        if response.status_code != 200:
            return False
        body = response.json()

    # geoname 엔드포인트는 찾지 못하면 보통 status/error 필드를 함께 내려준다.
    return bool(body.get("name")) and "error" not in body
