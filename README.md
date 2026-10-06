<div align="center">

<img src="docs/취향번역기_logo.png" alt="취향 번역기 로고 - 음악 음표를 감싼 순환 화살표" width="160" />

# 취향 번역기 &nbsp;<sub>MyFav · Taste Translator</sub>

**좋아하는 음악이, 당신의 다음 영화와 책과 여행지가 돼요 🎧**

좋아하는 음악 3~5곡으로 **취향을 분석**하고,<br/>
그 취향을 **영화·책·여행지·향수**로 "번역"해 **"왜 나와 맞는지"** 까지 알려 주는 개인 취향 잡지형 토스 미니앱

<br/>

![Apps in Toss](https://img.shields.io/badge/Apps%20in%20Toss-3.2.0-3182F6)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.142-009688?logo=fastapi&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![AI](https://img.shields.io/badge/AI-OpenAI%20%7C%20Anthropic-412991)

[주요 기능](#주요-기능) · [화면 구성](#화면-구성) · [감각 축](#8개-감각-축과-스탬프) · [아키텍처](#시스템-아키텍처) · [로컬 실행](#로컬-실행-방법) · [문서](#참조-문서)

</div>

---

<p align="center">
  <img src="images/main_image.png" alt="CD 플레이어, CD, 비 오는 밤거리 사진, 영화 티켓, 향수병 콜라주" width="560" />
</p>

- **타깃 사용자**: 취향은 뚜렷하지만 새로운 분야에서 무엇을 고를지 모르는 20~30대 토스 사용자
- **플랫폼**: 앱인토스(토스 미니앱), 토스 앱 안의 WebView에서 동작 (기준 뷰포트 390×844, safe-area 대응)
- **한 줄 요약**: 음악 3~5곡 선택 → AI 취향 분석(8개 감각 축) → 분야별 추천 3건 → 스탬프로 반응 → 취향 카드 공유
- **로그인 없음 · 탭 바 없음**: 익명 기기 ID로만 구분하고, 재방문 홈이 허브 역할을 합니다.

## 목차

- [주요 기능](#주요-기능)
- [화면 구성](#화면-구성)
- [8개 감각 축과 스탬프](#8개-감각-축과-스탬프)
- [기술 스택](#기술-스택)
- [시스템 아키텍처](#시스템-아키텍처)
- [프로젝트 구조](#프로젝트-구조)
- [데이터 모델](#데이터-모델)
- [API 개요](#api-개요)
- [로컬 실행 방법](#로컬-실행-방법)
- [환경 변수](#환경-변수)
- [설정값 위치](#설정값-위치)
- [배포](#배포)
- [핵심 정책 요약](#핵심-정책-요약)
- [현재 상태와 확인 필요 사항](#현재-상태와-확인-필요-사항)
- [참조 문서](#참조-문서)

---

## 주요 기능

| 영역 | 설명 |
|---|---|
| **사용자 식별** | 회원가입·로그인 없음. 첫 실행 시 익명 기기 ID(UUID)를 발급받아 기기에 저장하고, 모든 요청에 `X-Device-Id` 헤더로 보냄 |
| **음악 검색·선택** | iTunes Search API(`country=KR`)로 곡 검색. 입력 지연 0.4초, **최소 3곡 · 최대 5곡**, 같은 곡 중복 불가 |
| **취향 분석** | AI가 고른 곡으로 8개 감각 축 점수(0~100), 취향 이름·해설·태그 생성. 1초 간격 상태 조회, 제한 시간 초과·실패 시 재시도 상태로 전환. 완료돼도 **자동 이동 없이** "내 취향 프로필 보기" 버튼 활성화 |
| **취향 프로필** | 이슈 번호(`ISSUE 01` …), 취향 이름, 해설, 태그, 8개 축 그래프 |
| **분야별 번역** | 영화·책·여행지·향수 4개 탭. 분야당 **최대 3건**(대표 1건 큰 카드 + "다음 추천" 2건) |
| **추천 상세** | 추천 이유, 연결 근거 3줄, 근거 문장, 태그, **취향 연결 %**(60~99%) |
| **피드백 스탬프** | 4종 중 1개 **필수 선택**(선택 전 메인 버튼 비활성화). 기록·표시용이며 추천에는 반영하지 않음 |
| **저장·공유** | 이슈를 한 장으로 요약한 취향 카드. 공유는 토스 공유 링크 사용 |
| **아카이브** | 지난 이슈 목록, "기록 관리 · 전체 삭제"(확인 팝업 필수) → 기기 ID 재발급 후 첫 방문 홈으로 |
| **서비스 정보** | 서비스 소개(TMDB 로고·고지 포함), 이용 약관, 개인정보 처리방침. 홈 하단 링크로 진입 |
| **후순위 (미구현)** | 친구 궁합, 취향 변화 비교, 토스 로그인, 관리자 페이지 — 와이어프레임의 진입 버튼도 MVP에서는 숨김 |

---

## 화면 구성

MVP 16개 화면·상태(컴포넌트 13종). **하단 탭 바와 앱 자체 헤더가 없으며**, 상단은 토스 내비게이션 바(뒤로가기 · 미니앱 이름 · ⋯ · 닫기)를 사용합니다. 라우팅 라이브러리 없이 `src/navigation/`의 화면 스택으로 이동합니다.

| 화면 ID | 화면명 | 진입 경로 | 컴포넌트 | 와이어프레임 |
|---|---|---|---|---|
| SCR-HOME | 첫 방문 홈 | 앱 실행(지난 이슈 없음) | `HomeScreen.tsx` | `01 HOME — COVER` |
| SCR-HOME-RETURN | 재방문 홈(허브) | 앱 실행(지난 이슈 있음) / "처음 화면으로" | `HomeReturnScreen.tsx` | `01-1 HOME — RETURNING` |
| SCR-INPUT | 음악 입력 | 홈·아카이브 메인 버튼 | `InputScreen.tsx` | `02 MUSIC INPUT — TRACKLIST` |
| SCR-INPUT-SEARCH | 음악 검색 (상태) | 음악 입력의 검색창 | `InputScreen.tsx` | `02-1 MUSIC INPUT — SEARCH` |
| SCR-ANALYSIS | 분석 중 | "이 음악들로 번역하기" | `AnalysisScreen.tsx` | `03 ANALYSIS — EDITING` |
| SCR-ANALYSIS-RETRY | 분석 재시도 (상태) | 분석 실패·시간 초과 | `AnalysisScreen.tsx` | `03-1 ANALYSIS — RETRY` |
| SCR-PROFILE | 취향 프로필 | 분석 완료 / 최근·아카이브 이슈 / 공유 링크 | `ProfileScreen.tsx` | `04 TASTE PROFILE — IDENTITY` |
| SCR-TRANSLATE | 분야별 번역 (탭 4종) | 프로필 "다른 세계로 번역하기" | `TranslateScreen.tsx` | `05 TASTE TRANSLATION — *` |
| SCR-DETAIL | 추천 상세 (분야 4종) | 번역 카드 | `DetailScreen.tsx` | `06 RECOMMENDATION DETAIL — *` |
| SCR-FEEDBACK | 반응 | 상세 "이 번역에 답해주기" | `FeedbackScreen.tsx` | `07 FEEDBACK — REACTION` |
| SCR-SHARE | 저장 · 공유 | 반응 메인 버튼 / 프로필 "취향 카드 공유" | `ShareScreen.tsx` | `08 SAVE SHARE — POSTER` |
| SCR-ARCHIVE | 아카이브 | 재방문 홈 "지난 이슈 전체 보기" | `ArchiveScreen.tsx` | `09 MY TASTE ARCHIVE — COLLECTION` |
| SCR-ARCHIVE-DELETE | 기록 삭제 확인 (팝업) | 아카이브 "기록 관리 · 전체 삭제" | `ArchiveScreen.tsx` + `ConfirmDialog` | `09-2 ARCHIVE — DELETE CONFIRM` |
| SCR-ABOUT | 서비스 소개 | 홈 하단 링크 | `AboutScreen.tsx` | `11-1 ABOUT — SERVICE` |
| SCR-TERMS | 이용 약관 | 홈 하단 링크 | `TermsScreen.tsx` | `11-2 TERMS — SERVICE` |
| SCR-PRIVACY | 개인정보 처리방침 | 홈 하단 링크 | `PrivacyScreen.tsx` | `11-3 PRIVACY — POLICY` |

와이어프레임 원본(26종, 후순위 화면 포함): [`docs/취향번역기_와이어프레임/`](docs/취향번역기_와이어프레임/) · 뒤로가기 목적지는 기능명세서 3.7절(홈에서 뒤로가기 시 미니앱 종료)

---

## 8개 감각 축과 스탬프

모든 분야(음악·영화·책·여행지·향수)에 공통으로 쓰는 취향 속성 축입니다. 축 이름과 순서는 고정이며 점수는 0(왼쪽)~100(오른쪽)입니다.

| No | 키 | 왼쪽 (0) | 오른쪽 (100) |
|---|---|---|---|
| 1 | `energy` | 고요한 | 에너지 있는 |
| 2 | `digital` | 아날로그 | 디지털 |
| 3 | `vivid` | 몽환적인 | 선명한 |
| 4 | `abstract` | 서정적인 | 추상적인 |
| 5 | `cold` | 따뜻한 | 차가운 |
| 6 | `novel` | 익숙한 | 새로운 |
| 7 | `social` | 혼자만의 | 함께하는 |
| 8 | `dramatic` | 잔잔한 | 극적인 |

<table>
  <tr>
    <td align="center" width="150"><b>♡</b><br/><sub><b>완전 내 취향</b><br/>THAT'S ME · <code>love</code></sub></td>
    <td align="center" width="150"><b>☺</b><br/><sub><b>조금 비슷해</b><br/>CLOSE ENOUGH · <code>near</code></sub></td>
    <td align="center" width="150"><b>?</b><br/><sub><b>잘 모르겠어</b><br/>MAYBE LATER · <code>unsure</code></sub></td>
    <td align="center" width="150"><b>✕</b><br/><sub><b>내 취향 아니야</b><br/>NOT MY MOOD · <code>no</code></sub></td>
  </tr>
</table>

**분야 4종**: `movie`(TMDB) · `book`(카카오 책 검색) · `travel`(OpenTripMap + 자체 이미지 풀) · `perfume`(자체 DB)

> 축·스탬프·분야는 상수 한 곳에서 정의하고 모든 화면이 참조합니다: [`src/constants/axes.ts`](src/constants/axes.ts) · [`stamps.ts`](src/constants/stamps.ts) · [`categories.ts`](src/constants/categories.ts)

---

## 기술 스택

| 구분 | 스택 |
|---|---|
| **플랫폼** | 앱인토스 `@apps-in-toss/web-framework` 3.2.0, `@apps-in-toss/devtools` (`ait build` / `ait deploy`) |
| **Frontend** | React 19, TypeScript, Vite 8, 순수 CSS(디자인 토큰 `src/styles/tokens.css`), Oxlint. 라우팅·상태 관리·UI 라이브러리 없음 |
| **Backend** | FastAPI 0.142, Uvicorn, SQLAlchemy 2.1, Pydantic 2 / pydantic-settings, httpx |
| **Database** | MySQL 8.0 (`utf8mb4`), PyMySQL 드라이버 |
| **비동기 처리** | FastAPI `BackgroundTasks` (별도 작업 큐·Redis 없음) |
| **AI** | OpenAI `gpt-5.4-mini` 또는 Anthropic `claude-sonnet-4-6` — `AI_PROVIDER`·`AI_MODEL` 환경 변수로 선택 |
| **외부 API** | iTunes Search(음악) · TMDB(영화) · 카카오 책 검색(책) · OpenTripMap(여행지) |
| **자체 데이터** | 향수 DB `perfume` 약 150건 · 무드/여행지 이미지 풀 `image_pool` 약 150장 |

> 스택은 [`CLAUDE.md`](CLAUDE.md)에 고정되어 있습니다. React / FastAPI / MySQL 범위 밖의 프레임워크·DB(예: Next.js, Django, PostgreSQL)는 도입하지 않습니다.

---

## 시스템 아키텍처

![시스템 구성도](docs/취향번역기_시스템구성도.png)

```
┌──────────────────────────┐      HTTPS + JSON           ┌────────────────────────────┐
│  토스 앱 (WebView)         │  ── REST /api/v1/* ───────▶ │  FastAPI (Uvicorn)          │
│  React 미니앱 (ait build)  │  ◀─ { success, data } ──    │  routers · services         │
└──────────────────────────┘     X-Device-Id 헤더          └──────┬───────────┬─────────┘
   토스 내비게이션 바 · 공유 링크                                    │ ORM        │ BackgroundTasks
                                                    ┌──────────────▼───┐   ┌───▼──────────────────────┐
                                                    │ MySQL 8          │   │ 분석 파이프라인             │
                                                    │ (MVP 8 tables)   │   │ ① AI 호출 9개 동시 실행     │
                                                    └──────────────────┘   │   취향 1 + 분야 4 × (3,2)  │
                                                                           │ ② 후보 20건 외부 조회 동시  │
   ┌──────────────┐  ┌──────────┐  ┌────────────┐  ┌─────────────┐        │ ③ 조회된 후보만 분야당 3건  │
   │ OpenAI /     │  │ TMDB     │  │ 카카오 책   │  │ OpenTripMap │ ◀──────│ ④ 취향 연결 % 계산 후 저장  │
   │ Anthropic    │  │          │  │            │  │             │        └──────────────────────────┘
   └──────────────┘  └──────────┘  └────────────┘  └─────────────┘
```

- 프론트엔드와 백엔드는 [`docs/취향번역기_API명세서.md`](docs/취향번역기_API명세서.md)의 REST 계약으로만 통신합니다.
- **추천 대상을 미리 DB로 구축하거나 임베딩하지 않습니다.** AI가 낸 후보 중 외부 API에서 실제로 조회된 대상만 저장하고 보여 줍니다(향수는 자체 DB 안에서만 선정).
- **취향 연결(%)** 은 사용자와 추천 대상의 8개 축 점수 차이를 서버에서 계산해 60~99%로 환산합니다.
- 같은 기기에서 같은 곡 조합으로 다시 분석하면 저장된 이슈를 재사용합니다(`issue.track_key`).
- 실측 소요 시간: 약 28~34초 (`claude-sonnet-4-6`, 향수·이미지 150건 실제 규모, 2026-10-03).

---

## 프로젝트 구조

```
myfav/
├── src/                          # Frontend (React + TypeScript)
│   ├── api/                      # client.ts(공통 요청 래퍼) + 도메인별 호출 모듈
│   ├── components/               # MainButton, SecondaryButton, AxesGraph, RecommendationCard,
│   │                             # TasteTag, NoticeBox, Toast, ConfirmDialog, CategoryTabs …
│   ├── constants/                # config.ts(수치·토스트), axes, stamps, categories, analysisSteps, legal
│   ├── navigation/               # 화면 스택(ScreenStack, ScreenRenderer, 화면 ID 타입)
│   ├── platform/                 # 앱인토스 연동: 기기 ID, 저장소, 공유, 뒤로가기 브리지, 딥링크
│   ├── screens/                  # 화면별 컴포넌트 (MVP 13종, 와이어프레임 1:1 대응)
│   ├── styles/                   # tokens.css(디자인 토큰), global.css
│   ├── types/                    # API 응답 타입
│   └── utils/
├── backend/                      # Backend (FastAPI)
│   ├── app/
│   │   ├── main.py               # 앱 진입점, CORS, /static/travel, /healthz
│   │   ├── core/                 # 설정(config), DB 연결, 에러 핸들러
│   │   ├── constants/            # values.py(수치 설정), axes.py
│   │   ├── models/               # SQLAlchemy 테이블
│   │   ├── routers/              # devices, music, home, analyses, issues, recommendations
│   │   ├── schemas/              # 요청·응답·AI 응답 스키마
│   │   └── services/
│   │       ├── ai/               # AI 호출 래퍼 + OpenAI / Anthropic 어댑터
│   │       ├── external/         # itunes, tmdb, kakao_book, opentripmap
│   │       ├── analysis_pipeline.py
│   │       └── match_score.py    # 취향 연결 % 계산
│   ├── db/                       # schema.sql, seed_perfume.py, seed_image_pool.py
│   ├── requirements.txt
│   └── README.md                 # Backend 실측·검증 기록
├── images/travel_image/          # 여행지 이미지 풀 원본 (Backend가 /static/travel로 서빙)
├── perfume_db_150.json           # 향수 DB 시딩 원본
├── public/                       # 정적 에셋
├── docs/                         # 기능명세서 / API명세서 / DB설계서 / 와이어프레임 / 시스템 구성도
├── apps-in-toss.config.ts        # 앱인토스 설정 (appName, 브랜드 색, webBundleDir)
├── vite.config.ts
└── CLAUDE.md                     # 구현 지침
```

---

## 데이터 모델

MySQL MVP 8개 테이블 (상세: [`docs/취향번역기_DB설계서.md`](docs/취향번역기_DB설계서.md), DDL: [`backend/db/schema.sql`](backend/db/schema.sql)).

| 테이블 | 역할 | 비고 |
|---|---|---|
| `device` | 익명 기기 | PK `device_id` CHAR(36) UUID. 삭제 시 하위 데이터 `CASCADE` |
| `issue` | 분석 1회의 결과 묶음(취향 프로필) | `(device_id, issue_no)` UNIQUE, `(device_id, track_key)` UNIQUE로 같은 곡 조합 재사용. 8개 축 컬럼, 사용한 `ai_provider`·`ai_model` 기록 |
| `issue_track` | 이슈에 사용된 곡 | `(issue_id, position)`·`(issue_id, track_id)` UNIQUE |
| `analysis` | 분석 진행 상태 | `status` ENUM `analyzing` / `fetching` / `done` / `failed` / `canceled`, 실패 시 `error_code` |
| `recommendation` | 분야별 추천 | `(issue_id, category, rank)` UNIQUE, `source` ENUM(`tmdb`·`kakao_book`·`opentripmap`·`perfume_db`), 대상 8개 축 + `match_score` |
| `stamp` | 추천에 대한 반응 | 추천당 1행(PK `rec_id`), ENUM `love`·`near`·`unsure`·`no` |
| `perfume` | 자체 향수 DB (전역) | `perfume_db_150.json`으로 시드 |
| `image_pool` | 무드·여행지 이미지 풀 (전역) | `kind` ENUM `place`·`mood`, `images/travel_image/`로 시드 |

**파생 값**

```
track_key   = SHA-256( iTunes 곡 ID 오름차순 정렬 → 쉼표로 연결 )  # 같은 기기 · 같은 조합이면 기존 이슈 재사용
match_score = 사용자 vs 추천 대상의 8개 축 점수 차이 → 60~99로 환산
```

> 저장하는 사용자 정보는 **익명 기기 ID, 고른 음악 목록, 스탬프**뿐입니다. 이름·연락처·토스 계정 정보는 수집하지 않습니다.

---

## API 개요

- **Base URL**: 로컬 `http://localhost:8000/api/v1` · 배포 `https://{서버 도메인}/api/v1` (HTTPS만 사용)
- **기기 식별**: `X-Device-Id: {익명 기기 ID}` (`POST /devices` 제외). 없거나 미등록이면 `401 DEVICE_NOT_FOUND`
- **공통 응답**: 성공 `{ "success": true, "data": {...} }` / 실패 `{ "success": false, "error": { "code", "message" } }`
- **필드 이름**: snake_case · 날짜 ISO 8601

| 그룹 | 엔드포인트 |
|---|---|
| 기기 | `POST /devices` · `DELETE /devices/me` (전체 기록 삭제) |
| 음악 | `GET /music/search?q=` (iTunes 프록시) |
| 홈 | `GET /home` |
| 분석 | `POST /analyses` (202) · `GET /analyses/{analysis_id}` (1초 폴링) · `DELETE /analyses/{analysis_id}` (취소) |
| 이슈 | `GET /issues` · `GET /issues/{issue_id}` · `GET /issues/{issue_id}/recommendations` |
| 추천 | `GET /recommendations/{rec_id}` · `PUT /recommendations/{rec_id}/stamp` |
| 기타 | `GET /healthz` · `GET /static/travel/{파일명}` |
| 후순위 (미구현) | `/matches/*` · `/issues/changes` |

분석 실패 시 `GET /analyses/{id}`의 `error_code`: `AI_RESPONSE_INVALID`(1회 재요청 후에도 형식 오류) · `AI_TIMEOUT` · `EXTERNAL_API_FAILED`(4개 분야 모두 조회 실패).
전체 요청/응답 스펙과 에러 코드는 [`docs/취향번역기_API명세서.md`](docs/취향번역기_API명세서.md) 참조.

---

## 로컬 실행 방법

### 사전 요구 사항

- **Python 3.12+**
- **Node.js 20.19+** (Vite 8 요구 사항)
- **MySQL 8.0+** — 실행 중이어야 하며 접속 계정 필요
- **API 키** — OpenAI 또는 Anthropic, TMDB(v4 Read Access Token), 카카오 REST API, OpenTripMap

### 1) 데이터베이스 준비

```sql
CREATE DATABASE myfav CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2) 백엔드 (FastAPI)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   /   macOS·Linux: source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env              # 아래 "환경 변수" 표 참고해 값 채우기

mysql -u root -p myfav < db/schema.sql
python -m db.seed_perfume         # perfume_db_150.json → perfume
python -m db.seed_image_pool      # images/travel_image/* → image_pool

uvicorn app.main:app --reload --port 8000
```

→ `http://localhost:8000/healthz` 에서 `{"status": "ok"}` 확인

### 3) 프론트엔드 (React + Vite)

```bash
npm install
cp .env.example .env.local        # VITE_API_BASE_URL=http://localhost:8000/api/v1
npm run dev
```

| 명령어 | 용도 |
|---|---|
| `npm run dev` | 개발 서버 실행 (`@apps-in-toss/devtools` 포함) |
| `npm run build` | 타입 검사 → Vite 빌드 → 앱인토스 빌드 (`tsc -b && vite build && ait build`) |
| `npm run lint` | Oxlint 검사 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run deploy` | 앱인토스 배포 (`ait deploy`) |

---

## 환경 변수

> API 키는 **`backend/.env`에만** 둡니다. Frontend 코드·저장소·로그에 넣지 않으며, `.env`·`.env.*`(예시 파일 제외)는 커밋하지 않습니다.

### `backend/.env`

| 키 | 예시값 | 설명 |
|---|---|---|
| `DATABASE_URL` | `mysql+pymysql://USER:PASSWORD@localhost:3306/myfav?charset=utf8mb4` | MySQL 접속 정보 |
| `AI_PROVIDER` | `anthropic` | `openai` 또는 `anthropic` |
| `AI_MODEL` | `claude-sonnet-4-6` | 예: `gpt-5.4-mini`, `claude-sonnet-4-6` |
| `ANTHROPIC_API_KEY` | `********` | Anthropic 사용 시 |
| `OPENAI_API_KEY` | `********` | OpenAI 사용 시 |
| `TMDB_API_KEY` | `********` | TMDB v4 Read Access Token (`Authorization: Bearer` 방식) |
| `KAKAO_REST_API_KEY` | `********` | 카카오 REST API 키 |
| `OPENTRIPMAP_API_KEY` | `********` | OpenTripMap 키 |
| `CORS_ORIGINS` | `http://localhost:5173` | 허용할 프론트 오리진(쉼표 구분) |
| `PUBLIC_BASE_URL` | `http://localhost:8000` | 이미지 URL(`{PUBLIC_BASE_URL}/static/travel/…`) 생성에 쓰는 Backend 공개 주소 |

### 프론트엔드 `.env.local` / `.env.production`

| 키 | 예시값 | 설명 |
|---|---|---|
| `VITE_API_BASE_URL` | `https://your-api.example.com/api/v1` | API 서버 주소(`/api/v1` 포함). 토스 환경에서는 HTTPS 필수. 앱인토스 빌드는 `.env.production` 사용 |

---

## 설정값 위치

조정 가능성이 높은 값은 한 곳에 모여 있습니다. "무엇을 바꾸려면 어느 파일을 고치면 되는지"는 아래 표를 보세요.

| 무엇을 바꾸려면 | 파일 |
|---|---|
| 분석 제한 시간(60초), 폴링 간격(1초), 검색 지연(0.4초), 곡 수(3~5), 분야당 추천 수(3), 취향 연결 범위(60~99%), 토스트 문구 | [`src/constants/config.ts`](src/constants/config.ts) |
| 8개 감각 축 키·라벨 | [`src/constants/axes.ts`](src/constants/axes.ts), [`backend/app/constants/axes.py`](backend/app/constants/axes.py) |
| 스탬프 4종 / 분야 4종 | [`src/constants/stamps.ts`](src/constants/stamps.ts) / [`src/constants/categories.ts`](src/constants/categories.ts) |
| 분석 단계 문구 / 약관·개인정보 처리방침 문구 | [`src/constants/analysisSteps.ts`](src/constants/analysisSteps.ts) / [`src/constants/legal.ts`](src/constants/legal.ts) |
| 색상·글자 크기·간격 (디자인 토큰) | [`src/styles/tokens.css`](src/styles/tokens.css) |
| AI 후보 수(5)·묶음 `(3, 2)`, AI 호출 시간 제한(45초), 최대 토큰, 외부 조회 동시 실행 수 | [`backend/app/constants/values.py`](backend/app/constants/values.py) |
| 앱 이름·브랜드 색 | [`apps-in-toss.config.ts`](apps-in-toss.config.ts) |

---

## 배포

- **프론트엔드(미니앱)**: `.env.production`에 HTTPS API 주소를 넣고 `npm run build` → `dist/` 번들과 앱인토스 패키지(`myfav.ait`) 생성 → `npm run deploy`(`ait deploy`)로 앱인토스 콘솔에 업로드. **배포는 명시적으로 요청할 때만 실행합니다.**
- **백엔드**: `uvicorn app.main:app`으로 서빙. 앱은 HTTP로 수신하고 **TLS 종단은 앞단(리버스 프록시·터널)이 담당**합니다. 실제 키·`DATABASE_URL`·`CORS_ORIGINS`·`PUBLIC_BASE_URL`을 환경 변수로 주입합니다.
- **현재 운영 구성**: 고정 클라우드 서버가 아니라, 운영 PC의 Backend 포트를 HTTPS 터널로 노출하고 있습니다(상세: [`docs/취향번역기_시스템구성도.png`](docs/취향번역기_시스템구성도.png)).
- **이미지 풀**: 여행지 이미지는 Backend가 `images/travel_image/`를 `/static/travel`로 직접 서빙하므로, 서버에 이 폴더가 함께 있어야 합니다.

---

## 핵심 정책 요약

[`docs/취향번역기_기능명세서.md`](docs/취향번역기_기능명세서.md) 4장에서 확정된 주요 결정 사항:

- 회원가입·로그인 없음. **익명 기기 ID**로 기록을 구분 (토스 로그인은 사업자 등록 필요로 후순위)
- 하단 탭 바·앱 자체 헤더 없음. **토스 내비게이션 바** 사용, 홈에서 뒤로가기 시 미니앱 종료
- 설정·문의 화면 없음. 문의·신고·일반 공유는 **토스 ⋯ 메뉴** 공통 기능 사용
- 분석이 끝나도 **자동 이동하지 않고** "내 취향 프로필 보기" 버튼만 활성화
- 추천 대상은 AI가 선정하되 **외부 API에서 실제로 조회된 대상만** 노출 (DB 구축·임베딩 없음)
- 스탬프 선택은 **필수**, 단 **추천에는 반영하지 않음** (기록·표시용)
- 추천 저장(북마크)·오늘의 번역은 **제거된 기능**
- 기록 삭제는 확인 팝업을 거쳐 **이슈·추천·스탬프 전체 삭제** 후 기기 ID 재발급, 복구 불가
- 취향 이름·해설·추천 이유·근거 문장은 AI 생성이며, 서비스 소개·약관에 고지 (처리방침에 OpenAI·Anthropic 전송 사실 명시)
- 글자 크기: 보조 글자 최소 11px, 본문 14px 이상 (영문 라벨만 10px 허용)

---

## 현재 상태와 확인 필요 사항

| 항목 | 내용 |
|---|---|
| **명세서와 다른 구현** | API 명세서는 iTunes 직접 호출·AI 단일 호출·30초 제한을 기술하지만, 현재 코드는 **서버 검색 프록시**(토스 iOS WebView에서 Apple 도메인 직접 요청 실패)·**AI 9개 병렬 호출**·**60초 제한**(실측 기반 조정) |
| **취향 카드 이미지 저장** | 미구현. DOM→이미지 변환 라이브러리 도입 여부 결정 필요 (`src/screens/ShareScreen.tsx`) |
| **토스 공유 링크** | 호출 코드는 있으나 실제 앱인토스 앱 식별자·라우트 규칙 검증 필요 (`src/platform/share.ts`) |
| **OpenAI `gpt-5.4-mini`** | 실제 호출 미검증. Anthropic `claude-sonnet-4-6`은 전체 흐름 검증 완료 |
| **OpenTripMap** | 주소·파라미터의 공식 문서 대조 필요 |
| **작업 큐** | 분석은 `BackgroundTasks`(단일 프로세스). 동시 요청이 많아지면 별도 작업 큐 검토 필요 |

Backend 실측·검증 기록은 [`backend/README.md`](backend/README.md)에 있습니다.

---

## 참조 문서

문서끼리 내용이 다르면 **기능명세서 → API 명세서 → DB 설계서 → 와이어프레임** 순으로 따릅니다. `docs/`의 문서는 읽기 전용입니다.

| 문서 | 내용 |
|---|---|
| [`docs/취향번역기_기능명세서.md`](docs/취향번역기_기능명세서.md) | 기능 요구사항의 단일 진실 공급원 (v1.8) — 화면별 상세 명세, 정책 결정, 유저 플로우 |
| [`docs/취향번역기_API명세서.md`](docs/취향번역기_API명세서.md) | REST API 계약 — 엔드포인트, 요청/응답, 에러 코드, 외부 API 연동, 화면↔API 매핑 |
| [`docs/취향번역기_DB설계서.md`](docs/취향번역기_DB설계서.md) | MySQL 스키마 — 테이블 DDL, 관계, 삭제 정책 |
| [`docs/취향번역기_와이어프레임/`](docs/취향번역기_와이어프레임/) | 화면별 와이어프레임 PNG 26종 (390×844) |
| [`docs/취향번역기_화면흐름명세.md`](docs/취향번역기_화면흐름명세.md) · [`프로토타입.html`](docs/취향번역기_프로토타입.html) · [`플로우차트.png`](docs/취향번역기_플로우차트.png) | 화면 연결·기능 구조 참고 자료 |
| [`docs/취향번역기_시스템구성도.png`](docs/취향번역기_시스템구성도.png) | 시스템 구성도 |
| [`CLAUDE.md`](CLAUDE.md) | 구현 시 준수 지침 (스택 고정, 앱인토스 제약, 와이어프레임 원본 유지, 편집 가능성 요구사항) |

<div align="center">
<br/>
<img src="docs/취향번역기_logo.png" width="72" alt="취향 번역기 로고" />
<br/>
<sub><b>음악으로 읽은 당신의 취향을, 다른 세계의 언어로 🎶</b></sub>
</div>
