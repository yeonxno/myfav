# 취향 번역기 (Taste Translator) — API 명세서

- **문서 버전**: v1.1
- **작성일**: 2026-10-02
- **작성 기준**: 기능명세서 v1.7(최종) + 플로우차트 v4 + 와이어프레임 최종안 + 프로토타입 v1.2 + 화면 흐름 명세 v1.2

> 클라이언트(토스 미니앱)가 우리 서버를 호출하는 API를 정의한다. 서버와 클라이언트가 호출하는 외부 API는 5장에 정리한다.

---

## 목차

1. [개요와 공통 규칙](#1-개요와-공통-규칙)
2. [API 목록](#2-api-목록)
3. [API 상세 (MVP)](#3-api-상세-mvp)
4. [API 상세 (후순위)](#4-api-상세-후순위)
5. [외부 API 연동](#5-외부-api-연동)
6. [에러 코드](#6-에러-코드)
7. [화면별 호출 API](#7-화면별-호출-api)

---

## 1. 개요와 공통 규칙

### 1.1 기본 정보

| 항목 | 내용 |
|---|---|
| 기본 주소 | `https://{서버 도메인}/api/v1` |
| 통신 | HTTPS만 사용 |
| 형식 | 요청·응답 모두 JSON (`Content-Type: application/json`), 문자 인코딩 UTF-8 |
| 날짜 | ISO 8601 (예: `2026-10-02T14:30:00+09:00`) |
| 필드 이름 | snake_case |

### 1.2 기기 식별

로그인이 없으므로 모든 요청에 익명 기기 ID를 헤더로 보낸다. 기기 등록(`POST /devices`)만 예외이다.

| 헤더 | 필수 | 설명 |
|---|---|---|
| `X-Device-Id` | Y | 기기 등록 때 발급받은 익명 기기 ID(UUID) |

- 헤더가 없거나 등록되지 않은 ID이면 `401 DEVICE_NOT_FOUND`를 반환한다
- 다른 기기의 이슈를 수정·삭제하려 하면 `403 FORBIDDEN`을 반환한다
- 공유 링크로 연 다른 사람의 이슈는 취향 프로필 조회만 허용한다

### 1.3 응답 형식

성공:

```json
{
  "success": true,
  "data": { }
}
```

실패:

```json
{
  "success": false,
  "error": {
    "code": "TRACK_COUNT_INVALID",
    "message": "음악은 3곡 이상 5곡 이하로 선택해 주세요."
  }
}
```

- `message`는 화면에 그대로 보여줄 수 있는 한국어 문장이다
- 에러 코드 목록은 6장 참조

### 1.4 공통 값

| 값 | 종류 |
|---|---|
| category | `movie` / `book` / `travel` / `perfume` |
| stamp | `love`(완전 내 취향) / `near`(조금 비슷해) / `unsure`(잘 모르겠어) / `no`(내 취향 아니야) |
| analysis status | `analyzing`(취향 분석 중) / `fetching`(추천 정보 조회 중) / `done` / `failed` |
| axes | 8개 축 점수 객체. 키는 `energy`, `digital`, `vivid`, `abstract`, `cold`, `novel`, `social`, `dramatic`, 값은 0~100 |

축 키와 화면 라벨의 대응:

| 키 | 0 (왼쪽) | 100 (오른쪽) |
|---|---|---|
| energy | 고요한 | 에너지 있는 |
| digital | 아날로그 | 디지털 |
| vivid | 몽환적인 | 선명한 |
| abstract | 서정적인 | 추상적인 |
| cold | 따뜻한 | 차가운 |
| novel | 익숙한 | 새로운 |
| social | 혼자만의 | 함께하는 |
| dramatic | 잔잔한 | 극적인 |

---

## 2. API 목록

| No | 기능 | 메서드 | 경로 | 구분 |
|---|---|---|---|---|
| 1 | 기기 등록 | POST | `/devices` | MVP |
| 2 | 전체 기록 삭제 | DELETE | `/devices/me` | MVP |
| 3 | 홈 정보 조회 | GET | `/home` | MVP |
| 4 | 분석 요청 | POST | `/analyses` | MVP |
| 5 | 분석 상태 조회 | GET | `/analyses/{analysis_id}` | MVP |
| 6 | 분석 취소 | DELETE | `/analyses/{analysis_id}` | MVP |
| 7 | 이슈 목록 조회 | GET | `/issues` | MVP |
| 8 | 이슈(취향 프로필) 조회 | GET | `/issues/{issue_id}` | MVP |
| 9 | 분야별 추천 조회 | GET | `/issues/{issue_id}/recommendations` | MVP |
| 10 | 추천 상세 조회 | GET | `/recommendations/{rec_id}` | MVP |
| 11 | 스탬프 저장 | PUT | `/recommendations/{rec_id}/stamp` | MVP |
| 12 | 궁합 초대 생성 | POST | `/matches` | 후순위 |
| 13 | 궁합 초대 조회 | GET | `/matches/{invite_id}` | 후순위 |
| 14 | 궁합 결과 조회 | GET | `/matches/{invite_id}/result` | 후순위 |
| 15 | 취향 변화 조회 | GET | `/issues/changes` | 후순위 |

> 음악 검색은 클라이언트가 iTunes Search API를 직접 호출하므로 서버 API가 없다(5.1절). 취향 카드 이미지 저장과 토스 공유도 클라이언트에서 처리한다(7.2절).

---

## 3. API 상세 (MVP)

### 3.1 기기 등록

`POST /devices` — 앱 첫 실행 때 익명 기기 ID를 발급받는다. `X-Device-Id` 헤더가 필요 없다.

- 요청 본문: 없음
- 응답 `201`

```json
{
  "success": true,
  "data": {
    "device_id": "6f1c2a9e-3b7d-4e8a-9c21-7d4e5f6a8b90",
    "created_at": "2026-10-02T14:30:00+09:00"
  }
}
```

- 클라이언트는 `device_id`를 기기 저장소에 보관하고, 이후 모든 요청의 헤더에 넣는다

### 3.2 전체 기록 삭제

`DELETE /devices/me` — 이 기기의 이슈, 추천, 스탬프, 궁합 초대·결과를 모두 삭제하고 기기 ID를 폐기한다. (SCR-ARCHIVE-DELETE의 "삭제하기")

- 요청 본문: 없음
- 응답 `200`

```json
{
  "success": true,
  "data": { "deleted_issue_count": 3 }
}
```

- 삭제 후 클라이언트는 저장된 `device_id`를 지우고 `POST /devices`를 다시 호출해 새 ID를 받은 뒤 첫 방문 홈으로 이동한다
- 삭제된 이슈의 공유 링크는 더 이상 열리지 않는다(`404 ISSUE_NOT_FOUND`)

### 3.3 홈 정보 조회

`GET /home` — 첫 방문 홈과 재방문 홈을 가르고, 재방문 홈에 필요한 정보를 한 번에 준다. (SCR-HOME, SCR-HOME-RETURN)

- 응답 `200`

```json
{
  "success": true,
  "data": {
    "has_issue": true,
    "issue_count": 3,
    "latest_issue": {
      "issue_id": "b2a1...",
      "issue_no": 3,
      "taste_name": "비 오는 밤의 아날로그 로맨티스트",
      "tags": ["nostalgic", "quiet", "cinematic", "warm"],
      "mood_image_url": "https://.../city_rain_night.jpg",
      "first_track": { "title": "밤편지", "artist": "아이유" },
      "track_count": 3,
      "created_at": "2026-10-01T21:10:00+09:00"
    },
    "match_arrived": null
  }
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| has_issue | boolean | false면 첫 방문 홈, true면 재방문 홈 |
| latest_issue | object / null | 가장 최근 이슈 요약. 이슈가 없으면 null |
| match_arrived | object / null | (후순위) 확인하지 않은 궁합 결과가 있으면 `{ "invite_id": "..." }`. MVP에서는 항상 null |

### 3.4 분석 요청

`POST /analyses` — 선택한 곡으로 취향 분석을 시작한다. 분석은 시간이 걸리므로 바로 결과를 주지 않고 분석 ID를 반환한다. (SCR-INPUT의 "이 음악들로 번역하기", SCR-ANALYSIS-RETRY의 "다시 번역하기")

- 요청 본문

```json
{
  "tracks": [
    {
      "track_id": 1234567890,
      "title": "밤편지",
      "artist": "아이유",
      "artwork_url": "https://is1-ssl.mzstatic.com/.../100x100bb.jpg",
      "genre": "K-Pop"
    }
  ],
  "invite_id": null
}
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| tracks | array | Y | 3~5건. iTunes 검색 결과에서 고른 곡 |
| tracks[].track_id | integer | Y | iTunes 곡 ID. 중복 불가 |
| tracks[].title / artist | string | Y | 곡명 / 아티스트 |
| tracks[].artwork_url | string | N | 앨범 아트 주소 |
| tracks[].genre | string | N | 장르 |
| invite_id | string / null | N | (후순위) 궁합 초대를 받아 분석하는 경우의 초대 ID |

- 응답 `202`

```json
{
  "success": true,
  "data": {
    "analysis_id": "a91f...",
    "status": "analyzing",
    "reused": false
  }
}
```

- 같은 기기에서 같은 곡 조합으로 분석한 이슈가 이미 있으면 새로 분석하지 않고 `status: "done"`, `reused: true`와 함께 기존 `issue_id`를 반환한다
- 에러: `400 TRACK_COUNT_INVALID`(3곡 미만 또는 5곡 초과), `400 TRACK_DUPLICATED`, `404 INVITE_NOT_FOUND`, `410 INVITE_EXPIRED`

### 3.5 분석 상태 조회

`GET /analyses/{analysis_id}` — 분석 중 화면이 1초 간격으로 호출해 진행 상태를 확인한다. (SCR-ANALYSIS)

- 응답 `200`

```json
{
  "success": true,
  "data": {
    "analysis_id": "a91f...",
    "status": "done",
    "issue_id": "b2a1...",
    "invite_id": null,
    "error_code": null
  }
}
```

| status | 의미 | 화면 처리 |
|---|---|---|
| analyzing | OpenAI로 취향 분석 중 | 진행 단계 01~03을 연출로 표시 |
| fetching | 분야별 추천 정보 조회 중 | 진행 단계 04 표시 |
| done | 완료. `issue_id` 포함 | "내 취향 프로필 보기" 버튼 활성화. `invite_id`가 있으면 궁합 결과로 이동 |
| failed | 실패. `error_code` 포함 | 분석 재시도 상태(SCR-ANALYSIS-RETRY)로 전환 |

- 클라이언트는 요청 후 30초가 지나도 `done`이 아니면 호출을 멈추고 재시도 상태로 전환한다
- `failed`의 `error_code`: `AI_RESPONSE_INVALID`(OpenAI 응답 형식 오류, 1회 재요청 후에도 실패), `AI_TIMEOUT`, `EXTERNAL_API_FAILED`(모든 분야 조회 실패)
- 일부 분야만 조회에 실패한 경우는 `done`으로 처리하고, 실패한 분야는 3.8절 응답에서 빈 목록으로 내려간다

### 3.6 분석 취소

`DELETE /analyses/{analysis_id}` — 분석 중 뒤로가기를 누르면 호출한다. 이미 완료된 분석은 취소되지 않는다.

- 응답 `200`: `{ "success": true, "data": { "canceled": true } }`
- 에러: `409 ANALYSIS_ALREADY_DONE`

### 3.7 이슈 목록 · 이슈 조회

`GET /issues` — 이 기기의 이슈를 최신순으로 반환한다. (SCR-ARCHIVE)

- 응답 `200`: `data.issues`는 3.3절 `latest_issue`와 같은 형태의 배열, `data.total`은 이슈 개수

`GET /issues/{issue_id}` — 이슈의 취향 프로필을 반환한다. (SCR-PROFILE, SCR-SHARE)

- 응답 `200`

```json
{
  "success": true,
  "data": {
    "issue_id": "b2a1...",
    "issue_no": 1,
    "is_owner": true,
    "taste_name": "비 오는 밤의 아날로그 로맨티스트",
    "summary": "느린 템포와 오래된 질감을 좋아해요.\n혼자만의 시간에 더 선명해지는 취향이에요.",
    "tags": ["nostalgic", "quiet", "cinematic", "warm"],
    "axes": {
      "energy": 23, "digital": 18, "vivid": 27, "abstract": 35,
      "cold": 31, "novel": 40, "social": 22, "dramatic": 35
    },
    "mood_image_url": "https://.../city_rain_night.jpg",
    "tracks": [
      { "track_id": 1234567890, "title": "밤편지", "artist": "아이유", "artwork_url": "https://..." }
    ],
    "created_at": "2026-10-01T21:10:00+09:00"
  }
}
```

- `is_owner`가 false이면 공유 링크로 들어온 다른 사람이다. 화면은 읽기 전용으로 보여주고 메인 버튼을 "나도 번역해보기"로 바꾼다
- 에러: `404 ISSUE_NOT_FOUND`(없거나 삭제된 이슈)

### 3.8 분야별 추천 조회

`GET /issues/{issue_id}/recommendations` — 이슈의 추천을 분야별로 묶어 반환한다. 탭 전환 때마다 다시 호출하지 않도록 4개 분야를 한 번에 준다. (SCR-TRANSLATE)

- 응답 `200`

```json
{
  "success": true,
  "data": {
    "movie": [
      {
        "rec_id": "r101...",
        "rank": 1,
        "title": "중경삼림",
        "image_url": "https://image.tmdb.org/t/p/w500/....jpg",
        "match_score": 94,
        "reason": "몽환적인 색감과 쓸쓸한 도시의 공기가 당신의 음악과 닮았어요.",
        "tags": ["cinematic", "nostalgic"],
        "stamp": null
      }
    ],
    "book": [],
    "travel": [],
    "perfume": []
  }
}
```

- 분야마다 `rank` 순으로 최대 3건. `rank` 1이 대표 추천 카드, 2~3이 "다음 추천" 목록이다
- 빈 배열인 분야는 조회에 실패한 분야이다. 해당 탭에 "이 분야의 번역을 불러오지 못했어요"를 노출한다
- `image_url`이 null이면 분야별 기본 일러스트를 쓴다
- 이슈 소유자가 아니면 `403 FORBIDDEN`(공유 링크로는 추천을 볼 수 없다)

### 3.9 추천 상세 조회

`GET /recommendations/{rec_id}` — 추천 1건의 상세 정보와 연결 근거를 반환한다. (SCR-DETAIL, SCR-FEEDBACK)

- 응답 `200`

```json
{
  "success": true,
  "data": {
    "rec_id": "r101...",
    "issue_id": "b2a1...",
    "category": "movie",
    "rank": 1,
    "title": "중경삼림",
    "meta": "Chungking Express · 1994",
    "description": "빠르게 흐르는 도시, 느리게 남는 마음.",
    "image_url": "https://image.tmdb.org/t/p/w500/....jpg",
    "match_score": 94,
    "reason": "몽환적인 색감과 쓸쓸한 도시의 공기가 당신의 음악과 닮았어요.",
    "mappings": [
      { "music": "dreamy", "target": "몽환적인 화면" },
      { "music": "slow tempo", "target": "느리게 흐르는 감정" },
      { "music": "nostalgia", "target": "아날로그의 여운" }
    ],
    "evidence": "「밤편지」에서 느낀 잔잔한 그리움이 영화 속 인물들의 쓸쓸한 온도와 맞닿아 있어요.",
    "tags": ["cinematic", "nostalgic"],
    "source": "tmdb",
    "stamp": null
  }
}
```

| 필드 | 설명 |
|---|---|
| meta | 분야별 한 줄 정보. 영화: 원제 · 개봉 연도 / 책: 원제 · 출간 연도 · 저자 / 여행지: 지역 · 추천 계절 · 여행 성격 / 향수: 이름 · 계열 · 주요 노트 |
| mappings | 연결 근거 3줄. `music`은 내 음악의 특징, `target`은 추천 대상의 특징 |
| source | 정보 출처. `tmdb` / `kakao_book` / `opentripmap` / `perfume_db` |
| stamp | 이미 남긴 스탬프. 없으면 null. 반응 화면에 다시 들어오면 이 값으로 이전 선택을 표시한다 |

- 에러: `404 RECOMMENDATION_NOT_FOUND`, `403 FORBIDDEN`

### 3.10 스탬프 저장

`PUT /recommendations/{rec_id}/stamp` — 추천에 스탬프를 남긴다. 이미 있으면 바꾼다. (SCR-FEEDBACK)

- 요청 본문: `{ "stamp": "love" }`
- 응답 `200`

```json
{
  "success": true,
  "data": {
    "rec_id": "r101...",
    "stamp": "love",
    "updated_at": "2026-10-02T14:40:00+09:00"
  }
}
```

- 스탬프는 기록·표시용이며 다음 분석과 추천에 반영하지 않는다
- 에러: `400 STAMP_INVALID`, `404 RECOMMENDATION_NOT_FOUND`, `403 FORBIDDEN`

---

## 4. API 상세 (후순위)

MVP에서는 구현하지 않는다. 화면의 진입 버튼도 MVP에서는 숨긴다.

### 4.1 궁합 초대 생성

`POST /matches` — 내 이슈를 기준으로 궁합 초대를 만든다. (SCR-MATCH-SEND의 "링크 복사", "토스로 초대")

- 요청 본문: `{ "issue_id": "b2a1...", "nickname": "지우" }`

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| issue_id | string | Y | 기준이 되는 내 이슈 |
| nickname | string | N | 친구에게 보일 별명. 최대 8자. 비우면 "친구" |

- 응답 `201`

```json
{
  "success": true,
  "data": {
    "invite_id": "m77c...",
    "expires_at": "2026-10-09T14:40:00+09:00"
  }
}
```

- 클라이언트는 `invite_id`를 넣은 토스 공유 링크를 만들어 복사하거나 공유한다. 링크는 7일간 유효하다
- 에러: `400 NICKNAME_TOO_LONG`, `404 ISSUE_NOT_FOUND`, `403 FORBIDDEN`

### 4.2 궁합 초대 조회

`GET /matches/{invite_id}` — 초대 링크를 연 사람에게 보낸 사람의 취향을 보여준다. (SCR-MATCH-INVITE)

- 응답 `200`

```json
{
  "success": true,
  "data": {
    "invite_id": "m77c...",
    "is_sender": false,
    "status": "waiting",
    "from": {
      "nickname": "지우",
      "issue_no": 1,
      "taste_name": "비 오는 밤의 아날로그 로맨티스트",
      "tags": ["nostalgic", "quiet", "cinematic"]
    },
    "expires_at": "2026-10-09T14:40:00+09:00"
  }
}
```

- `is_sender`가 true이면 본인이 자기 링크를 연 것이다. 초대 보내기 화면으로 이동시킨다
- `status`: `waiting`(친구 분석 전) / `done`(궁합 결과 있음)
- 친구는 이후 `POST /analyses`에 `invite_id`를 넣어 분석하고, 완료되면 서버가 궁합 결과를 만든다
- 에러: `404 INVITE_NOT_FOUND`, `410 INVITE_EXPIRED`

### 4.3 궁합 결과 조회

`GET /matches/{invite_id}/result` — 두 사람의 궁합 결과를 반환한다. 보낸 사람과 친구만 조회할 수 있다. (SCR-MATCH-RESULT)

- 응답 `200`

```json
{
  "success": true,
  "data": {
    "score": 82,
    "summary": "밤의 감성은 같고, 템포는 조금 달라요.",
    "me": { "nickname": "나", "issue_id": "c3d2...", "axes": { "energy": 23 } },
    "friend": { "nickname": "지우", "axes": { "energy": 58 } },
    "same_tags": ["nostalgic", "warm"],
    "diff_tags": ["calm", "energetic"],
    "together_rec": {
      "rec_id": "r900...",
      "title": "중경삼림",
      "image_url": "https://image.tmdb.org/t/p/w500/....jpg",
      "reason": "둘 다 좋아할 밤의 도시."
    }
  }
}
```

- `axes`는 8개 키를 모두 포함한다(예시는 생략)
- `me`는 조회한 사람, `friend`는 상대방이다
- 보낸 사람이 처음 조회하면 확인한 것으로 기록해, 이후 `GET /home`의 `match_arrived`가 null로 돌아간다
- 에러: `404 INVITE_NOT_FOUND`, `409 MATCH_NOT_READY`(친구 분석 전), `403 FORBIDDEN`

### 4.4 취향 변화 조회

`GET /issues/changes?from={issue_id}&to={issue_id}` — 두 이슈의 축 점수를 비교한다. (SCR-ARCHIVE-CHANGE)

- `from`, `to`를 생략하면 직전 이슈와 최신 이슈를 비교한다
- 응답 `200`

```json
{
  "success": true,
  "data": {
    "summary": "조금 더 선명하고, 함께하는 쪽으로 움직였어요.",
    "from": { "issue_id": "b2a1...", "issue_no": 1, "created_at": "2026-09-01T10:00:00+09:00", "axes": { "energy": 23 } },
    "to": { "issue_id": "c3d2...", "issue_no": 2, "created_at": "2026-10-01T21:10:00+09:00", "axes": { "energy": 41 } }
  }
}
```

- 에러: `409 NOT_ENOUGH_ISSUES`(이슈가 2개 미만)

---

## 5. 외부 API 연동

우리 서버 API가 아니라, 클라이언트와 서버가 바깥으로 호출하는 API이다. iTunes만 클라이언트가 직접 호출하고, 나머지는 키를 숨기기 위해 서버가 호출한다.

| API | 호출 주체 | 호출 시점 | 인증 |
|---|---|---|---|
| iTunes Search | 클라이언트 | 음악 검색 입력 시 | 없음 |
| OpenAI | 서버 | 분석 요청당 1회 | API 키 |
| TMDB | 서버 | 분석 중, 영화 후보마다 | API 키 |
| 카카오 책 검색 | 서버 | 분석 중, 책 후보마다 | REST API 키 |
| OpenTripMap | 서버 | 분석 중, 여행지 후보마다 | API 키 |

### 5.1 iTunes Search API (음악 검색)

`GET https://itunes.apple.com/search`

| 파라미터 | 값 | 설명 |
|---|---|---|
| term | 검색어 | 사용자가 입력한 곡명 또는 가수명(URL 인코딩) |
| country | `KR` | 한국 스토어로 고정 |
| media | `music` | |
| entity | `song` | 곡 단위 결과 |
| limit | `10` | 화면에 보여줄 개수 |

| iTunes 응답 필드 | 우리 필드 |
|---|---|
| trackId | track_id |
| trackName | title |
| artistName | artist |
| artworkUrl100 | artwork_url |
| primaryGenreName | genre |

- 입력이 멈춘 뒤 약 0.4초 후에 호출하고, 같은 검색어는 다시 호출하지 않는다(분당 약 20회 제한)
- 검색 호출은 함수 하나로 분리해 둔다. 토스 미니앱 환경에서 직접 호출이 막히면 서버에 `GET /music/search?q=`를 추가해 같은 형태로 응답한다

### 5.2 AI 모델 API (취향 분석 · 추천 선정)

분석 요청 1건당 1회 호출한다. 응답은 아래 JSON 형식으로만 받는다.

| 항목 | 내용 |
|---|---|
| 기본 모델 | OpenAI `gpt-5.4-mini` |
| 대체 모델 | Anthropic `claude-sonnet-4-6` (상황에 따라 변경) |
| 전환 방법 | 서버 환경 변수로 제공사와 모델을 지정한다(예: `AI_PROVIDER`, `AI_MODEL`). 코드를 다시 배포하지 않고 바꾼다 |

- 모델 호출은 함수 하나(예: `analyzeTaste(tracks, perfumes, images)`)로 감싸고, 그 안에서 제공사별 호출을 나눈다. 나머지 코드는 어느 모델을 쓰는지 모르게 한다
- 두 모델 모두 아래와 같은 JSON 형식으로 응답하게 하고, 형식 검사와 재요청 규칙도 똑같이 적용한다
- JSON 출력을 강제하는 방법은 제공사마다 다르므로, 제공사별 호출 코드에서 각각 처리한다
- 어느 모델로 분석했는지 이슈에 기록해 둔다(결과 품질 비교용)
- Anthropic 모델로 바꾸면 곡 정보가 Anthropic으로 전송되므로, 개인정보 처리방침의 외부 처리 항목에 두 제공사를 모두 적는다

보내는 값:

| 값 | 내용 |
|---|---|
| tracks | 선택한 곡 3~5건(곡명, 아티스트, 장르) |
| perfumes | 향수 DB 목록(ID, 이름, 계열, 노트) |
| images | 이미지 풀의 파일 이름 목록 |

받는 값:

```json
{
  "taste": {
    "axes": { "energy": 23, "digital": 18, "vivid": 27, "abstract": 35, "cold": 31, "novel": 40, "social": 22, "dramatic": 35 },
    "taste_name": "비 오는 밤의 아날로그 로맨티스트",
    "summary": ["느린 템포와 오래된 질감을 좋아해요.", "혼자만의 시간에 더 선명해지는 취향이에요."],
    "tags": ["nostalgic", "quiet", "cinematic", "warm"],
    "mood_image": "city_rain_night"
  },
  "recommendations": {
    "movie": [
      {
        "title": "중경삼림",
        "original_title": "Chungking Express",
        "year": 1994,
        "description": "빠르게 흐르는 도시, 느리게 남는 마음.",
        "reason": "몽환적인 색감과 쓸쓸한 도시의 공기가 당신의 음악과 닮았어요.",
        "mappings": [{ "music": "dreamy", "target": "몽환적인 화면" }],
        "evidence": "「밤편지」에서 느낀 잔잔한 그리움이 ...",
        "tags": ["cinematic", "nostalgic"],
        "axes": { "energy": 30, "digital": 20, "vivid": 25, "abstract": 40, "cold": 35, "novel": 45, "social": 30, "dramatic": 40 }
      }
    ],
    "book": [],
    "travel": [],
    "perfume": []
  }
}
```

분야별 후보에만 있는 필드:

| 분야 | 필드 |
|---|---|
| movie | title, original_title, year |
| book | title(국내 출간 제목), author |
| travel | title(한글 이름), name_en, country, season, travel_type, image(이미지 풀 파일 이름) |
| perfume | perfume_id(향수 DB의 ID) |

- 분야마다 후보 5건을 받는다. `mappings`는 3줄이다
- 응답이 형식에 맞지 않으면 1회 다시 요청하고, 그래도 실패하면 분석을 `failed`(`AI_RESPONSE_INVALID`)로 끝낸다
- `mood_image`와 `image`가 목록에 없는 이름이면 기본 이미지를 쓴다. `perfume_id`가 DB에 없으면 그 후보를 버린다

### 5.3 TMDB API (영화)

`GET https://api.themoviedb.org/3/search/movie`

| 파라미터 | 값 |
|---|---|
| query | OpenAI가 준 `original_title`(결과가 없으면 `title`로 다시 검색) |
| year | OpenAI가 준 `year` |
| language | `ko-KR` |

| TMDB 응답 필드 | 우리 필드 |
|---|---|
| id | source_id |
| title | title |
| original_title, release_date(연도) | meta |
| poster_path | image_url (`https://image.tmdb.org/t/p/w500` + poster_path) |

- 첫 번째 결과를 채택한다. 결과가 없으면 후보를 버린다

### 5.4 카카오 책 검색 API (책)

`GET https://dapi.kakao.com/v3/search/book` — 헤더 `Authorization: KakaoAK {REST API 키}`

| 파라미터 | 값 |
|---|---|
| query | OpenAI가 준 `title` |
| target | `title` |
| size | `5` |

| 카카오 응답 필드 | 우리 필드 |
|---|---|
| isbn | source_id |
| title | title |
| authors, datetime(연도) | meta |
| thumbnail | image_url |

- 검색 결과 중 `authors`에 OpenAI가 준 `author`가 포함된 첫 번째 결과를 채택한다. 없으면 후보를 버린다

### 5.5 OpenTripMap API (여행지)

`GET https://api.opentripmap.com/0.1/en/places/geoname`

| 파라미터 | 값 |
|---|---|
| name | OpenAI가 준 `name_en` |
| apikey | API 키 |

| OpenTripMap 응답 필드 | 우리 필드 |
|---|---|
| name, country | meta의 지역(한국어로 번역) |
| lat, lon | 저장만 함(화면에는 쓰지 않음) |

- 장소가 조회되면 실존하는 여행지로 보고 채택한다. 추천 계절과 여행 성격은 OpenAI가 준 값을, 이미지는 이미지 풀에서 고른 파일을 쓴다
- 이 절의 주소와 필드 이름은 OpenTripMap 문서를 열지 못한 상태에서 적었다. 구현 전에 공식 문서로 확인한다

---

## 6. 에러 코드

| HTTP | 코드 | 상황 | 화면 처리 |
|---|---|---|---|
| 400 | TRACK_COUNT_INVALID | 곡이 3건 미만이거나 5건 초과 | 토스트 |
| 400 | TRACK_DUPLICATED | 같은 곡이 중복됨 | 토스트 |
| 400 | STAMP_INVALID | 스탬프 값이 4종이 아님 | 토스트 |
| 400 | NICKNAME_TOO_LONG | 별명이 8자 초과 | 입력란 안내 |
| 400 | INVALID_REQUEST | 그 밖의 잘못된 요청 | 토스트 |
| 401 | DEVICE_NOT_FOUND | 기기 ID 헤더가 없거나 등록되지 않음 | 기기 등록을 다시 하고 요청을 한 번 더 시도 |
| 403 | FORBIDDEN | 다른 기기의 데이터에 접근 | 홈으로 이동 |
| 404 | ISSUE_NOT_FOUND | 이슈가 없거나 삭제됨(만료된 공유 링크 포함) | 홈으로 이동 + 토스트 |
| 404 | RECOMMENDATION_NOT_FOUND | 추천이 없음 | 이전 화면으로 이동 + 토스트 |
| 404 | ANALYSIS_NOT_FOUND | 분석 ID가 없음 | 음악 입력으로 이동 |
| 404 | INVITE_NOT_FOUND | 초대가 없음 | 홈으로 이동 + 토스트 |
| 409 | ANALYSIS_ALREADY_DONE | 완료된 분석을 취소하려 함 | 무시 |
| 409 | MATCH_NOT_READY | 친구가 아직 분석하지 않음 | 초대 보내기 화면 유지 |
| 409 | NOT_ENOUGH_ISSUES | 비교할 이슈가 2개 미만 | 아카이브로 이동 |
| 410 | INVITE_EXPIRED | 초대 링크가 7일을 넘김 | 홈으로 이동 + 토스트 |
| 500 | INTERNAL_ERROR | 서버 오류 | 재시도 안내 토스트 |

분석이 실패했을 때 `GET /analyses/{analysis_id}`의 `error_code`에 담기는 값(HTTP 에러가 아니라 정상 응답 안의 값):

| 코드 | 상황 |
|---|---|
| AI_RESPONSE_INVALID | OpenAI 응답이 형식에 맞지 않음(1회 재요청 후에도 실패) |
| AI_TIMEOUT | OpenAI 응답이 제한 시간 안에 오지 않음 |
| EXTERNAL_API_FAILED | 4개 분야 모두 조회에 실패 |

---

## 7. 화면별 호출 API

### 7.1 화면과 API 대응

| 화면 | 화면 ID | 호출 시점 | API |
|---|---|---|---|
| 앱 실행 | — | 저장된 기기 ID가 없을 때 | `POST /devices` |
| 첫 방문 홈 · 재방문 홈 | SCR-HOME, SCR-HOME-RETURN | 진입, 포그라운드 복귀 | `GET /home` |
| 음악 검색 | SCR-INPUT-SEARCH | 입력이 멈춘 뒤 | iTunes Search (직접 호출) |
| 음악 입력 | SCR-INPUT | "이 음악들로 번역하기" | `POST /analyses` |
| 분석 중 | SCR-ANALYSIS | 1초 간격 | `GET /analyses/{analysis_id}` |
| 분석 중 | SCR-ANALYSIS | 뒤로가기 | `DELETE /analyses/{analysis_id}` |
| 분석 재시도 | SCR-ANALYSIS-RETRY | "다시 번역하기" | `POST /analyses` |
| 취향 프로필 | SCR-PROFILE | 진입 | `GET /issues/{issue_id}` |
| 분야별 번역 | SCR-TRANSLATE | 진입(탭 전환 때는 호출하지 않음) | `GET /issues/{issue_id}/recommendations` |
| 추천 상세 | SCR-DETAIL | 진입 | `GET /recommendations/{rec_id}` |
| 반응 | SCR-FEEDBACK | 스탬프 선택 | `PUT /recommendations/{rec_id}/stamp` |
| 저장 · 공유 | SCR-SHARE | 진입 | `GET /issues/{issue_id}` |
| 아카이브 | SCR-ARCHIVE | 진입 | `GET /issues` |
| 기록 삭제 확인 | SCR-ARCHIVE-DELETE | "삭제하기" | `DELETE /devices/me` → `POST /devices` |
| 취향 변화 (후순위) | SCR-ARCHIVE-CHANGE | 진입, 비교 대상 변경 | `GET /issues/changes` |
| 궁합 초대 보내기 (후순위) | SCR-MATCH-SEND | "링크 복사", "토스로 초대" | `POST /matches` |
| 궁합 초대 받기 (후순위) | SCR-MATCH-INVITE | 진입 | `GET /matches/{invite_id}` |
| 궁합 결과 (후순위) | SCR-MATCH-RESULT | 진입 | `GET /matches/{invite_id}/result` |
| 서비스 소개 · 약관 · 처리방침 | SCR-ABOUT, SCR-TERMS, SCR-PRIVACY | — | 없음(앱에 포함된 고정 내용) |

### 7.2 서버 API가 없는 기능

| 기능 | 처리 방식 |
|---|---|
| 음악 검색 | 클라이언트가 iTunes Search API를 직접 호출(5.1절) |
| 선택한 곡 목록 관리 | 클라이언트 상태로 보관. 개수·중복 검사도 클라이언트에서 먼저 하고, 서버는 `POST /analyses`에서 다시 검사 |
| 취향 카드 이미지 저장 | 클라이언트에서 카드 화면을 이미지로 만들어 저장 |
| 취향 카드 · 궁합 공유 | 클라이언트에서 토스 공유 링크를 만들어 공유 창 호출. 링크에 `issue_id` 또는 `invite_id`를 담는다 |
| 분석 진행 단계 01~03 | 클라이언트가 정해진 시간 간격으로 연출 |
| 문의 · 신고 | 토스 ⋯ 메뉴의 고객센터 |

### 7.3 분석 흐름

1. 클라이언트가 `POST /analyses`로 곡 목록을 보내고 `analysis_id`를 받는다
2. 서버가 OpenAI를 호출해 축 점수, 취향 이름, 분야별 후보 5건을 받는다 (`analyzing`)
3. 서버가 TMDB, 카카오 책 검색, OpenTripMap, 향수 DB를 동시에 조회한다 (`fetching`)
4. 서버가 조회에 성공한 후보 중 분야당 3건을 채택하고, 취향 연결(%)을 계산해 이슈와 추천을 저장한다 (`done`)
5. 클라이언트는 그동안 `GET /analyses/{analysis_id}`를 1초 간격으로 호출하다가, `done`이 되면 버튼을 활성화하고 `issue_id`로 취향 프로필을 연다
