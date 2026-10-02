/**
 * 분야 4종. 기능명세서 2.8절·2.9절 / API명세서 1.4절 기준.
 */
export type CategoryValue = "movie" | "book" | "travel" | "perfume";

export interface CategoryDefinition {
  value: CategoryValue;
  tabLabel: string;
  translatedToLabel: string;
  detailLabel: string;
  mappingTargetLabel: string;
  metaHint: string;
}

export const CATEGORY_DEFINITIONS: readonly CategoryDefinition[] = [
  {
    value: "movie",
    tabLabel: "MOVIE",
    translatedToLabel: "FILM",
    detailLabel: "MOVIE",
    mappingTargetLabel: "THIS FILM",
    metaHint: "원제 · 개봉 연도",
  },
  {
    value: "book",
    tabLabel: "BOOK",
    translatedToLabel: "BOOK",
    detailLabel: "BOOK",
    mappingTargetLabel: "THIS BOOK",
    metaHint: "원제 · 출간 연도 · 저자",
  },
  {
    value: "travel",
    tabLabel: "TRAVEL",
    translatedToLabel: "TRAVEL",
    detailLabel: "TRAVEL",
    mappingTargetLabel: "THIS PLACE",
    metaHint: "지역 · 추천 계절 · 여행 성격",
  },
  {
    value: "perfume",
    tabLabel: "PERFUME",
    translatedToLabel: "PERFUME",
    detailLabel: "PERFUME",
    mappingTargetLabel: "THIS SCENT",
    metaHint: "이름 · 계열 · 주요 노트",
  },
] as const;

export const DEFAULT_CATEGORY: CategoryValue = "movie";

export const CATEGORY_RECOMMENDATION_COUNT = 3;
