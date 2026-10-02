/** API명세서 3.9·3.10절: 추천 상세 조회·스탬프 저장 */
import { apiRequest } from "./client";
import { getDeviceId } from "../platform/device";
import type { RecommendationDetailResponse, StampUpdateResponse } from "../types/api";
import type { StampValue } from "../constants/stamps";

export async function fetchRecommendationDetail(
  recId: string,
): Promise<RecommendationDetailResponse> {
  const deviceId = await getDeviceId();
  return apiRequest<RecommendationDetailResponse>(`/recommendations/${recId}`, { deviceId });
}

export async function saveStamp(recId: string, stamp: StampValue): Promise<StampUpdateResponse> {
  const deviceId = await getDeviceId();
  return apiRequest<StampUpdateResponse>(`/recommendations/${recId}/stamp`, {
    method: "PUT",
    body: { stamp },
    deviceId,
  });
}
