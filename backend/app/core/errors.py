"""API명세서 1.3절(응답 포맷)·6장(에러 코드) 기준 공통 에러 처리."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

# API명세서 6장 에러 코드 ↔ HTTP 상태 ↔ 기본 메시지
ERROR_HTTP_STATUS: dict[str, int] = {
    "TRACK_COUNT_INVALID": 400,
    "TRACK_DUPLICATED": 400,
    "STAMP_INVALID": 400,
    "NICKNAME_TOO_LONG": 400,
    "INVALID_REQUEST": 400,
    "DEVICE_NOT_FOUND": 401,
    "FORBIDDEN": 403,
    "ISSUE_NOT_FOUND": 404,
    "RECOMMENDATION_NOT_FOUND": 404,
    "ANALYSIS_NOT_FOUND": 404,
    "INVITE_NOT_FOUND": 404,
    "ANALYSIS_ALREADY_DONE": 409,
    "MATCH_NOT_READY": 409,
    "NOT_ENOUGH_ISSUES": 409,
    "INVITE_EXPIRED": 410,
    "INTERNAL_ERROR": 500,
}

DEFAULT_MESSAGES: dict[str, str] = {
    "TRACK_COUNT_INVALID": "음악은 3곡 이상 5곡 이하로 선택해 주세요.",
    "TRACK_DUPLICATED": "같은 곡을 중복해서 담을 수 없어요.",
    "STAMP_INVALID": "스탬프 값이 올바르지 않아요.",
    "NICKNAME_TOO_LONG": "별명은 최대 8자까지 입력할 수 있어요.",
    "INVALID_REQUEST": "잘못된 요청이에요.",
    "DEVICE_NOT_FOUND": "기기 정보를 다시 확인해 주세요.",
    "FORBIDDEN": "접근할 수 없어요.",
    "ISSUE_NOT_FOUND": "이슈를 찾을 수 없어요.",
    "RECOMMENDATION_NOT_FOUND": "추천을 찾을 수 없어요.",
    "ANALYSIS_NOT_FOUND": "분석 정보를 찾을 수 없어요.",
    "INVITE_NOT_FOUND": "초대를 찾을 수 없어요.",
    "ANALYSIS_ALREADY_DONE": "이미 완료된 분석이에요.",
    "MATCH_NOT_READY": "친구가 아직 분석을 마치지 않았어요.",
    "NOT_ENOUGH_ISSUES": "비교할 이슈가 2개 이상 필요해요.",
    "INVITE_EXPIRED": "초대 링크가 만료됐어요.",
    "INTERNAL_ERROR": "서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
}


class ApiError(Exception):
    def __init__(self, code: str, message: str | None = None):
        self.code = code
        self.message = message or DEFAULT_MESSAGES.get(code, "문제가 발생했어요.")
        self.http_status = ERROR_HTTP_STATUS.get(code, 400)
        super().__init__(self.message)


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def handle_api_error(_: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.http_status,
            content={"success": False, "error": {"code": exc.code, "message": exc.message}},
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(_: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {"code": "INTERNAL_ERROR", "message": DEFAULT_MESSAGES["INTERNAL_ERROR"]},
            },
        )
