# 취향 번역기 시스템 구성도

작성일: 2026-10-04. 현재 로컬 코드와 문서에 근거한 구성도이며, 원격 출시 번들의 버전이나 실시간 가용성을 검증한 자료는 아니다.

- `system-architecture.png`: 2000 × 1560 PNG 이미지
- `system-architecture.svg`: 확대 가능한 벡터 이미지
- `render-system-architecture.ps1`: PNG와 SVG를 함께 생성하는 수정 가능한 원본

## 근거와 해석

| 영역 | 확인한 근거 | 구성도에 반영한 내용 |
|---|---|---|
| 프론트·배포 | `package.json`, `apps-in-toss.config.ts`, `src/navigation`, `src/platform` | React·TypeScript·Vite, ait build/deploy, 토스 WebView, 기기 저장소·공유 SDK |
| API | `src/api`, `backend/app/main.py`, `backend/app/routers` | `/api/v1`, 익명 기기 ID, 분석·이슈·추천·스탬프·삭제 |
| 음악 검색 | `src/api/music.ts`, `backend/app/routers/music.py`, `backend/app/services/external/itunes.py` | iTunes 직접 호출 대신 서버 프록시, 서버 메모리 캐시 60초 |
| 분석 | `backend/app/services/analysis_pipeline.py`, `backend/app/services/ai/__init__.py`, `backend/app/constants/values.py` | FastAPI BackgroundTasks, AI 9개 병렬 호출, 외부 후보 병렬 조회, 분야별 최대 3건 |
| 제공사 | `backend/app/core/config.py`, 로컬 설정의 제공사 항목 | 현재 Anthropic 선택, OpenAI 어댑터도 구현됨. 자동 장애 전환은 아님 |
| 상태 조회 | `src/constants/config.ts`, 분석 라우터 | 1초 폴링, 화면 제한 60초, AI 개별 요청 제한 45초 |
| 저장 | `backend/db/schema.sql`, `backend/app/models/tables.py`, DB 설계서 | MVP 8개 테이블, 익명 기기별 기록, 향수·이미지 카탈로그 |
| 이미지 | FastAPI StaticFiles 설정, seed 스크립트 | 여행 이미지 파일은 운영 PC에 존재하며 DB는 파일명·URL 저장; 외부 이미지 URL은 단말이 조회 |
| 현재 운영 | 프론트 API 설정, 대화에서 확인된 운영 구성 | Quick Tunnel이 운영 PC의 8001 포트로 전달. 고정 클라우드 서버로 이전된 구조가 아님 |

## 문서와 현재 코드의 차이

API 명세서는 iTunes 직접 호출·AI 단일 호출·30초 제한을 기술하지만 현재 코드는 서버 검색 프록시·AI 9개 병렬 호출·60초 제한이다. 기능명세서와 `backend/README.md`의 후속 설명도 함께 대조했다.

문서의 친구 궁합과 취향 변화는 후순위이며 현재 라우터에 구현되어 있지 않다. `ShareScreen.tsx`의 카드 이미지 저장 버튼은 오류 안내만 표시하는 미구현 상태다. 공유 링크·SDK 호출 코드는 존재하지만 실제 앱인토스 공유 경로 검증 TODO가 남아 있다.

여행지는 OpenTripMap 검증이 실패해도 자체 이미지 풀에 대응하는 후보를 유지할 수 있다. 책은 저자 일치 항목이 없으면 첫 검색 결과를 사용하는 폴백이 있다. 따라서 그림의 외부 조회가 모든 후보의 엄격한 검증을 의미하지는 않는다.

BackgroundTasks는 같은 서버 프로세스에서 실행되며 별도 작업 큐·워커·Redis는 없다. `X-Device-Id`는 익명 기록 식별 수단으로, 토스 계정 로그인이나 mTLS 인증을 뜻하지 않는다. 공개 HTTPS와 앱인토스 mTLS는 별개이며 현재 API 호출 코드에 mTLS 클라이언트 인증은 사용되지 않는다.

API 키, DB 자격 증명, 사용자 데이터, 변경 가능한 임시 터널 도메인은 이미지에 포함하지 않았다. 이미지 파일 생성만 수행했으며 서비스 코드·서버·배포에는 변경이 없다.

## 재생성

Windows PowerShell 5.1에서 UTF-8 한글을 올바르게 읽으려면 프로젝트 루트에서 실행한다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& ([scriptblock]::Create((Get-Content -Raw -Encoding utf8 docs/render-system-architecture.ps1)))"
```
