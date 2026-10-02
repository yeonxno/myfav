/** 분석 중 화면의 4단계 진행 라벨. 기능명세서 2.5절 기준 고정 문구. */
export const ANALYSIS_STEPS: readonly { step: number; label: string }[] = [
  { step: 1, label: "음악의 분위기 듣기" },
  { step: 2, label: "감각 키워드 추출" },
  { step: 3, label: "나만의 취향 해석" },
  { step: 4, label: "다른 세계로 번역" },
] as const;

/**
 * 01~03단계 연출 전환 간격(ms). 기능명세서에 "정해진 시간 간격"이라고만 되어 있고
 * 구체적인 값은 없어 새로 정했다. 필요하면 이 값만 조정하면 된다.
 */
export const ANALYSIS_STEP_INTERVAL_MS = 2500;
