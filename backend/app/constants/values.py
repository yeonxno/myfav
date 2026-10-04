"""기능명세서 3.5·4.1·4.2절의 수치 값. 조정이 필요하면 이 파일만 고치면 된다."""

TRACK_COUNT_MIN = 3
TRACK_COUNT_MAX = 5

# 분야당 채택 추천 수(기능명세서 2.8·4.1절)
RECOMMENDATIONS_PER_CATEGORY = 3
# AI에게 요청하는 분야당 후보 수(기능명세서 3.5절: 5건 받아 조회 성공한 3건 채택)
RECOMMENDATION_CANDIDATES_REQUESTED = 5

# 분석 시간 제한(초). 기능명세서 2.5·4.1절. 실제 제한은 프론트(src/constants/config.ts)가 건다.
# 2026-10-03 실측(27.8~33.8초) 기준으로 프론트와 같은 값으로 맞춰 둔다.
ANALYSIS_TIMEOUT_SECONDS = 60

# 취향 연결(%) 표시 범위. 기능명세서 3.5·4.1절
MATCH_SCORE_MIN = 60
MATCH_SCORE_MAX = 99

# AI 응답 형식 오류 시 재요청 횟수. 기능명세서 3.11절("1회 다시 요청")
# 분석 1건은 AI 호출 여러 개(취향 1 + 분야 4 x 묶음 수)로 나뉘어 동시에 실행되며, 이 규칙은 호출마다 적용된다.
AI_RETRY_COUNT = 1

# 분야당 후보 5건을 몇 개의 AI 호출로 나눠 동시에 받을지. 합계는 RECOMMENDATION_CANDIDATES_REQUESTED와 같아야 한다.
# 출력 길이가 곧 응답 시간이라, (3, 2)로 나누면 한 호출이 5건을 쓸 때보다 빨리 끝난다.
# 출력 길이와 응답 시간을 균형 있게 맞추기 위해 3개/2개로 나눠 병렬 요청한다.
RECOMMENDATION_CANDIDATE_CHUNKS: tuple[int, ...] = (3, 2)

# AI 호출 1건의 응답 대기 한도(초). 넘기면 AI_TIMEOUT으로 처리한다(시간 초과는 재요청하지 않음).
# 실측 호출 1건은 최대 약 26초. 프론트 제한 시간(60초)보다 짧아야 서버가 먼저 실패를 알린다.
AI_CALL_TIMEOUT_SECONDS = 45

# AI 호출별 최대 출력 토큰. 실측 출력은 취향 약 310토큰, 분야 묶음(3건) 약 1,400토큰이라 넉넉히 잡았다.
AI_MAX_TOKENS_TASTE = 2000
AI_MAX_TOKENS_CATEGORY = 8000

# 추천 후보 외부 조회 동시 실행 수(4분야 x 후보 5건)
EXTERNAL_LOOKUP_WORKERS = 20
