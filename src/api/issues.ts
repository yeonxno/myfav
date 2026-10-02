/** API명세서 3.7·3.8절: 이슈 목록·조회·분야별 추천 */
import { apiRequest } from "./client";
import { getDeviceId } from "../platform/device";
import type { IssueDetailResponse, IssueListResponse, RecommendationsByCategory } from "../types/api";

export async function fetchIssueList(): Promise<IssueListResponse> {
  const deviceId = await getDeviceId();
  return apiRequest<IssueListResponse>("/issues", { deviceId });
}

export async function fetchIssueDetail(issueId: string): Promise<IssueDetailResponse> {
  const deviceId = await getDeviceId();
  return apiRequest<IssueDetailResponse>(`/issues/${issueId}`, { deviceId });
}

export async function fetchRecommendationsByIssue(
  issueId: string,
): Promise<RecommendationsByCategory> {
  const deviceId = await getDeviceId();
  return apiRequest<RecommendationsByCategory>(`/issues/${issueId}/recommendations`, { deviceId });
}
