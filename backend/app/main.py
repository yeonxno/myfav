"""
FastAPI 앱 진입점. API명세서 1.1절: 기본 주소 `/api/v1`, HTTPS만 사용(배포 환경에서 TLS 종단은
리버스 프록시가 담당하고, 이 앱은 HTTP로 수신한다).
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.core.errors import register_error_handlers
from app.routers import analyses, devices, home, issues, recommendations

settings = get_settings()
PROJECT_ROOT = Path(__file__).resolve().parents[2]
TRAVEL_IMAGE_DIR = PROJECT_ROOT / "images" / "travel_image"

app = FastAPI(title="취향 번역기 API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)

if TRAVEL_IMAGE_DIR.exists():
    # db/seed_image_pool.py가 image_url을 {PUBLIC_BASE_URL}/static/travel/{파일명}으로 만든다.
    app.mount("/static/travel", StaticFiles(directory=str(TRAVEL_IMAGE_DIR)), name="travel-images")

router_prefix = "/api/v1"

app.include_router(devices.router, prefix=router_prefix)
app.include_router(home.router, prefix=router_prefix)
app.include_router(analyses.router, prefix=router_prefix)
app.include_router(issues.router, prefix=router_prefix)
app.include_router(recommendations.router, prefix=router_prefix)


@app.get("/healthz")
def healthz():
    return {"status": "ok"}
