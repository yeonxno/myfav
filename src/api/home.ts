/** API명세서 3.3절: GET /home */
import { apiRequest } from "./client";
import { getDeviceId } from "../platform/device";
import type { HomeResponse } from "../types/api";

export async function fetchHome(): Promise<HomeResponse> {
  const deviceId = await getDeviceId();
  return apiRequest<HomeResponse>("/home", { deviceId });
}
