/**
 * API명세서 v1.1 기준 요청/응답 타입. 필드 이름·타입은 명세서를 그대로 따른다(임의 변경 금지).
 */
import type { AxisKey } from "../constants/axes";
import type { CategoryValue } from "../constants/categories";
import type { StampValue } from "../constants/stamps";

export type Axes = Record<AxisKey, number>;

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** POST /devices */
export interface DeviceRegisterResponse {
  device_id: string;
  created_at: string;
}

/** DELETE /devices/me */
export interface DeviceDeleteResponse {
  deleted_issue_count: number;
}

/** GET /home 의 latest_issue */
export interface LatestIssueSummary {
  issue_id: string;
  issue_no: number;
  taste_name: string;
  tags: string[];
  mood_image_url: string | null;
  first_track: { title: string; artist: string };
  track_count: number;
  created_at: string;
}

/** GET /home */
export interface HomeResponse {
  has_issue: boolean;
  issue_count: number;
  latest_issue: LatestIssueSummary | null;
  match_arrived: { invite_id: string } | null;
}

/** POST /analyses 요청 바디의 곡 정보 */
export interface TrackInput {
  track_id: number;
  title: string;
  artist: string;
  artwork_url?: string;
  genre?: string;
}

export interface AnalysisCreateRequest {
  tracks: TrackInput[];
  invite_id: string | null;
}

export type AnalysisStatus = "analyzing" | "fetching" | "done" | "failed";

export interface AnalysisCreateResponse {
  analysis_id: string;
  status: AnalysisStatus;
  reused: boolean;
  issue_id?: string;
}

export interface AnalysisStatusResponse {
  analysis_id: string;
  status: AnalysisStatus;
  issue_id: string | null;
  invite_id: string | null;
  error_code: "AI_RESPONSE_INVALID" | "AI_TIMEOUT" | "EXTERNAL_API_FAILED" | null;
}

/** GET /issues */
export interface IssueListResponse {
  issues: LatestIssueSummary[];
  total: number;
}

export interface IssueTrack {
  track_id: number;
  title: string;
  artist: string;
  artwork_url: string | null;
}

/** GET /issues/{issue_id} */
export interface IssueDetailResponse {
  issue_id: string;
  issue_no: number;
  is_owner: boolean;
  taste_name: string;
  summary: string;
  tags: string[];
  axes: Axes;
  mood_image_url: string | null;
  tracks: IssueTrack[];
  created_at: string;
}

/** GET /issues/{issue_id}/recommendations 의 항목 하나 */
export interface RecommendationSummary {
  rec_id: string;
  rank: number;
  title: string;
  image_url: string | null;
  match_score: number;
  reason: string;
  tags: string[];
  stamp: StampValue | null;
}

export type RecommendationsByCategory = Record<CategoryValue, RecommendationSummary[]>;

export interface RecommendationMapping {
  music: string;
  target: string;
}

export type RecommendationSource = "tmdb" | "kakao_book" | "opentripmap" | "perfume_db";

/** GET /recommendations/{rec_id} */
export interface RecommendationDetailResponse {
  rec_id: string;
  issue_id: string;
  category: CategoryValue;
  rank: number;
  title: string;
  meta: string;
  description: string | null;
  image_url: string | null;
  match_score: number;
  reason: string;
  mappings: RecommendationMapping[];
  evidence: string;
  tags: string[];
  source: RecommendationSource;
  stamp: StampValue | null;
}

/** PUT /recommendations/{rec_id}/stamp */
export interface StampUpdateResponse {
  rec_id: string;
  stamp: StampValue;
  updated_at: string;
}

export const API_ERROR_CODES = [
  "TRACK_COUNT_INVALID",
  "TRACK_DUPLICATED",
  "STAMP_INVALID",
  "NICKNAME_TOO_LONG",
  "INVALID_REQUEST",
  "DEVICE_NOT_FOUND",
  "FORBIDDEN",
  "ISSUE_NOT_FOUND",
  "RECOMMENDATION_NOT_FOUND",
  "ANALYSIS_NOT_FOUND",
  "INVITE_NOT_FOUND",
  "ANALYSIS_ALREADY_DONE",
  "MATCH_NOT_READY",
  "NOT_ENOUGH_ISSUES",
  "INVITE_EXPIRED",
  "INTERNAL_ERROR",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];
