"""기능명세서 3.5·4.1·4.2절의 수치 값. 조정이 필요하면 이 파일만 고치면 된다."""

TRACK_COUNT_MIN = 3
TRACK_COUNT_MAX = 5

# 분야당 채택 추천 수(기능명세서 2.8·4.1절)
RECOMMENDATIONS_PER_CATEGORY = 3
# AI에게 요청하는 분야당 후보 수(기능명세서 3.5절: 5건 받아 조회 성공한 3건 채택)
RECOMMENDATION_CANDIDATES_REQUESTED = 5

# 분석 시간 제한(초). 기능명세서 2.5·4.1절
ANALYSIS_TIMEOUT_SECONDS = 30

# 취향 연결(%) 표시 범위. 기능명세서 3.5·4.1절
MATCH_SCORE_MIN = 60
MATCH_SCORE_MAX = 99

# AI 응답 형식 오류 시 재요청 횟수. 기능명세서 3.11절("1회 다시 요청")
AI_RETRY_COUNT = 1
