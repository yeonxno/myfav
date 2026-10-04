/**
 * 화면 전반에서 쓰는 조정 가능성이 높은 설정값.
 * 기능명세서 3.6절(토스트), 3.5절(지표), 4.1·4.2절(수치) 기준.
 * 값을 바꿀 때는 이 파일만 수정하면 된다.
 */

/**
 * 분석 제한 시간(초). 기능명세서 2.5절은 30초를 출발값으로 제시하며,
 * 4.2절은 "실제 응답 시간을 재서 조정한다"고 명시한다.
 * 2026-10-03 실측(claude-sonnet-4-6, AI 호출 분리·동시 실행 적용 후): 3회 27.8 / 33.8 / 29.7초.
 * 최대값 x 1.5(약 51초)에 AI 재요청 1회 여유를 더해 60초로 정했다(사용자 승인, 2026-10-03).
 * 백엔드 AI 호출 1건의 대기 한도(backend/app/constants/values.py AI_CALL_TIMEOUT_SECONDS)는
 * 이 값보다 짧아야 한다. 그래야 화면이 포기하기 전에 서버가 먼저 실패를 알려 준다.
 * (이전 값: 분리 전 140~330초 소요로 300초였다.)
 */
export const ANALYSIS_TIMEOUT_SECONDS = 60;

/** 분석 상태 조회 간격(ms). API명세서 3.5절 */
export const ANALYSIS_POLL_INTERVAL_MS = 1000;

/** 음악 검색 입력 디바운스(ms). API명세서 5.1절 */
export const MUSIC_SEARCH_DEBOUNCE_MS = 400;

/** 선택 곡 수 제한. 기능명세서 2.3절 */
export const TRACK_COUNT_MIN = 3;
export const TRACK_COUNT_MAX = 5;

/** 분야당 추천 수. 기능명세서 2.8절 */
export const RECOMMENDATIONS_PER_CATEGORY = 3;

/** 취향 연결(%) 표시 범위. 기능명세서 3.5절 */
export const MATCH_SCORE_MIN = 60;
export const MATCH_SCORE_MAX = 99;

/** 별명 최대 길이(후순위: 궁합 초대). 기능명세서 2.15절 */
export const MATCH_NICKNAME_MAX_LENGTH = 8;

/** 토스트 노출 시간(ms) */
export const TOAST_DURATION_MS = 2500;

/** 토스트 문구. 기능명세서 3.6절 */
export const TOAST_MESSAGES = {
  trackAdded: "음악을 추가했어요.",
  trackRemoved: "곡을 다시 추가하려면 검색창에 입력해주세요.",
  trackLimitExceeded: "최대 5곡까지 선택할 수 있어요.",
  trackNotEnough: "좋아하는 음악을 3곡 이상 선택해주세요.",
  stampSaved: "당신의 감각을 기억할게요.",
  imageSaved: "취향 카드를 저장했어요.",
  networkRetry: "잠시 후 다시 시도해 주세요.",
  genericError: "문제가 발생했어요. 다시 시도해 주세요.",
  linkCopied: "링크를 복사했어요.",
} as const;
