# 취향 번역기 — Backend

FastAPI + MySQL. `docs/취향번역기_API명세서.md` · `docs/취향번역기_DB설계서.md` 기준으로 구현했다.

## 준비

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate   # Windows
pip install -r requirements.txt
cp .env.example .env       # 값 채우기 (DB 접속정보, API 키들)
```

## DB 준비

```bash
# MySQL에 빈 데이터베이스를 먼저 만든 다음
mysql -u root -p myfav < db/schema.sql

# 향수·이미지 풀 시딩 (perfume_db_150.json, images/travel_image/*)
python -m db.seed_perfume
python -m db.seed_image_pool
```

## 실행

```bash
uvicorn app.main:app --reload --port 8000
```

- API 기본 주소: `http://localhost:8000/api/v1`
- 헬스체크: `GET /healthz`
- 여행지 이미지 정적 서빙: `GET /static/travel/{파일명}` (프로젝트 루트 `images/travel_image`를 그대로 서빙)

## 2026-10-02 실기 검증 결과

MySQL 8 + 실제 OpenAI/Anthropic/TMDB/카카오/OpenTripMap 키로 `POST /devices` → `POST /analyses`
→ `GET /issues/{id}` → `GET /issues/{id}/recommendations` → `PUT /recommendations/{id}/stamp`
전체 흐름을 끝까지 실행해 확인했다. 그 과정에서 찾은 문제와 고친 내용:

- **TMDB 인증 방식 버그**: 발급받은 키가 v4 Read Access Token(JWT)인데 코드는 v3 `api_key`
  쿼리 파라미터 방식이었다. `Authorization: Bearer` 헤더 방식으로 고쳤다
  (`app/services/external/tmdb.py`). 발급받은 TMDB 키 종류에 따라 다시 확인이 필요할 수 있다.
- **향수 추천 검증 버그**: API명세서 5.2절대로 AI는 향수 후보에 `title` 없이 `perfume_id`만
  주는데, 검증 스키마(`app/schemas/ai.py`)가 `title`을 모든 분야 필수로 요구하고 있었다.
  `title`을 선택 필드로 고쳤다.
- **`claude-sonnet-4-6` 모델 확인됨**: 기능명세서가 지정한 모델명이 실제로 존재하고 정상
  호출된다(2026-10-02 기준). `gpt-5.4-mini`는 테스트에 쓴 OpenAI 계정에 크레딧이 없어
  아직 실제 호출 성공 여부를 확인하지 못했다.
- **`max_tokens` 부족으로 응답이 중간에 잘림**: 향수 150개 + 이미지 150개 전체 목록을
  프롬프트에 넣는 실제 운영 규모에서, Anthropic 응답이 `max_tokens=8192`에 정확히 걸려
  `recommendations` 필드가 통째로 잘렸다(`stop_reason: max_tokens` 확인). `max_tokens=16000`
  으로 올려 해결했다(`app/services/ai/anthropic_provider.py`). OpenAI 쪽도 같은 문제가
  생길 수 있어 미리 넉넉한 값을 쓰는 게 안전하다.
- **분석 소요 시간 실측**: 향수·이미지 150개씩 포함한 실제 규모 요청 기준, AI 분석에 약
  130~140초, 이어지는 TMDB·카카오·OpenTripMap 조회에 약 5초, 총 **135~145초** 걸렸다.
  기능명세서 4.2절이 "실제 응답 시간을 재서 조정하라"고 한 값인데, 현재 프론트엔드의
  `ANALYSIS_TIMEOUT_SECONDS = 30`(`src/constants/config.ts`)은 **실측값보다 훨씬 짧아 거의
  매번 재시도 화면으로 빠진다.** 운영 전 90~180초 정도로 올리는 걸 권장한다 — 임의로
  바꾸지 않고 사용자 확인을 받아야 할 값이라 보고만 해둔다.
- **에러 로깅 누락**: AI 응답 검증 실패·파이프라인 예외가 로그 없이 조용히 `failed` 처리되고
  있던 버그를 고쳐, 이제 `logger.exception`/`logger.error`로 서버 로그에 원인이 남는다.
- **후보 1건 실패가 전체 분야를 막던 버그**: 추천 후보 하나를 외부 API에서 조회하다 예외가
  나면 해당 분야 전체가 죽던 문제를 고쳐, 이제 그 후보만 건너뛰고 나머지를 계속 시도한다.

실제 추천 품질도 확인했다 — 아이유 곡 3곡으로 "비포 선라이즈"(영화), "어린 왕자"(책), 교토
여행지, 향수까지 맥락에 맞는 추천과 연결 근거가 나왔다. 여행지는 후보 5건 중 2건만 OpenTripMap
검증을 통과했는데, 이는 버그가 아니라 명세서 3.5절이 정한 정상 동작이다(찾은 만큼만 채택).

## 아직 검증하지 못한 것 (확인 필요)

- `gpt-5.4-mini`(OpenAI 기본값)는 테스트 계정 크레딧 부족으로 실제 호출을 확인하지 못했다.
  결제 설정 후 다시 확인이 필요하다.
- OpenTripMap은 API명세서 5.5절이 "공식 문서로 확인 전" 상태라고 명시한 주소·파라미터를
  그대로 썼다. 이번 테스트에서는 호출 자체는 됐지만(장소 2건 채택), 공식 문서 대조는
  별도로 필요하다.
- 분석 파이프라인은 FastAPI `BackgroundTasks`(단일 프로세스 내 비동기 실행)로 구현했다. 분석
  1건에 2분 이상 걸리고 동시 요청이 많아지는 운영 환경에서는 별도 작업 큐(Celery 등) 도입이
  필요할 수 있다 — 이는 새 스택 추가이므로 임의로 넣지 않았다.
