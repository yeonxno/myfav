/** API명세서 3.2절: DELETE /devices/me */
import { apiRequest } from "./client";
import { getDeviceId, reissueDeviceId } from "../platform/device";
import type { DeviceDeleteResponse } from "../types/api";

export async function deleteAllRecords(): Promise<DeviceDeleteResponse> {
  const deviceId = await getDeviceId();
  const result = await apiRequest<DeviceDeleteResponse>("/devices/me", {
    method: "DELETE",
    deviceId,
  });
  await reissueDeviceId();
  return result;
}
