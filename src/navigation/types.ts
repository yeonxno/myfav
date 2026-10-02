/**
 * 화면 ID와 화면별 파라미터. 기능명세서 1.5절 화면 목록(MVP) 기준.
 * 후순위 화면(SCR-MATCH-*, SCR-ARCHIVE-CHANGE)은 포함하지 않는다.
 */
import type { CategoryValue } from "../constants/categories";
import type { TrackInput } from "../types/api";
import type { MusicSearchTrack } from "../api/music";

export const ScreenId = {
  Home: "SCR-HOME",
  HomeReturn: "SCR-HOME-RETURN",
  Input: "SCR-INPUT",
  Analysis: "SCR-ANALYSIS",
  Profile: "SCR-PROFILE",
  Translate: "SCR-TRANSLATE",
  Detail: "SCR-DETAIL",
  Feedback: "SCR-FEEDBACK",
  Share: "SCR-SHARE",
  Archive: "SCR-ARCHIVE",
  About: "SCR-ABOUT",
  Terms: "SCR-TERMS",
  Privacy: "SCR-PRIVACY",
} as const;

export type ScreenIdValue = (typeof ScreenId)[keyof typeof ScreenId];

export interface ScreenParamsMap {
  [ScreenId.Home]: undefined;
  [ScreenId.HomeReturn]: undefined;
  [ScreenId.Input]: { invite_id?: string; tracks?: MusicSearchTrack[] } | undefined;
  [ScreenId.Analysis]: { analysis_id: string; tracks: TrackInput[]; invite_id?: string | null };
  [ScreenId.Profile]: { issue_id: string };
  [ScreenId.Translate]: { issue_id: string; category?: CategoryValue };
  [ScreenId.Detail]: { rec_id: string; issue_id: string; category: CategoryValue };
  [ScreenId.Feedback]: { rec_id: string; issue_id: string; category: CategoryValue };
  [ScreenId.Share]: { issue_id: string };
  [ScreenId.Archive]: undefined;
  [ScreenId.About]: undefined;
  [ScreenId.Terms]: undefined;
  [ScreenId.Privacy]: undefined;
}

export interface StackEntry<K extends ScreenIdValue = ScreenIdValue> {
  screen: K;
  params: ScreenParamsMap[K];
  key: string;
}
