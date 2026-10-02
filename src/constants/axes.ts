/**
 * 8개 감각 축. 기능명세서 3.4절 / API명세서 1.4절 기준.
 * 키와 좌우 라벨, 순서는 고정이며 이 파일에서만 바꾼다.
 */
export interface AxisDefinition {
  key: AxisKey;
  left: string;
  right: string;
}

export type AxisKey =
  | "energy"
  | "digital"
  | "vivid"
  | "abstract"
  | "cold"
  | "novel"
  | "social"
  | "dramatic";

export const AXIS_DEFINITIONS: readonly AxisDefinition[] = [
  { key: "energy", left: "고요한", right: "에너지 있는" },
  { key: "digital", left: "아날로그", right: "디지털" },
  { key: "vivid", left: "몽환적인", right: "선명한" },
  { key: "abstract", left: "서정적인", right: "추상적인" },
  { key: "cold", left: "따뜻한", right: "차가운" },
  { key: "novel", left: "익숙한", right: "새로운" },
  { key: "social", left: "혼자만의", right: "함께하는" },
  { key: "dramatic", left: "잔잔한", right: "극적인" },
] as const;

export const AXIS_KEYS: readonly AxisKey[] = AXIS_DEFINITIONS.map((a) => a.key);

export const AXIS_SCORE_MIN = 0;
export const AXIS_SCORE_MAX = 100;
