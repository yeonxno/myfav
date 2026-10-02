/** API명세서 3.4~3.6절: 분석 요청·상태 조회·취소 */
import { apiRequest } from "./client";
import { getDeviceId } from "../platform/device";
import type { AnalysisCreateRequest, AnalysisCreateResponse, AnalysisStatusResponse } from "../types/api";

export async function createAnalysis(
  request: AnalysisCreateRequest,
): Promise<AnalysisCreateResponse> {
  const deviceId = await getDeviceId();
  return apiRequest<AnalysisCreateResponse>("/analyses", {
    method: "POST",
    body: request,
    deviceId,
  });
}

export async function fetchAnalysisStatus(analysisId: string): Promise<AnalysisStatusResponse> {
  const deviceId = await getDeviceId();
  return apiRequest<AnalysisStatusResponse>(`/analyses/${analysisId}`, { deviceId });
}

export async function cancelAnalysis(analysisId: string): Promise<{ canceled: boolean }> {
  const deviceId = await getDeviceId();
  return apiRequest<{ canceled: boolean }>(`/analyses/${analysisId}`, {
    method: "DELETE",
    deviceId,
  });
}
