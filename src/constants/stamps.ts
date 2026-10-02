/**
 * 피드백 스탬프 4종. 기능명세서 2.10절 / API명세서 1.4절 기준.
 */
export type StampValue = "love" | "near" | "unsure" | "no";

export interface StampDefinition {
  value: StampValue;
  labelKo: string;
  labelEn: string;
  icon: string;
}

export const STAMP_DEFINITIONS: readonly StampDefinition[] = [
  { value: "love", labelKo: "완전 내 취향", labelEn: "THAT'S ME", icon: "♡" },
  { value: "near", labelKo: "조금 비슷해", labelEn: "CLOSE ENOUGH", icon: "☺" },
  { value: "unsure", labelKo: "잘 모르겠어", labelEn: "MAYBE LATER", icon: "?" },
  { value: "no", labelKo: "내 취향 아니야", labelEn: "NOT MY MOOD", icon: "✕" },
] as const;
