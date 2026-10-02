/**
 * 익명 기기 ID 부트스트랩. 기능명세서 3.1절 / API명세서 3.1절 기준.
 * 기기 저장소에 device_id가 없으면 POST /devices로 새로 발급받아 저장한다.
 */
import { apiRequest } from "../api/client";
import type { DeviceRegisterResponse } from "../types/api";
import { getStorageItem, setStorageItem } from "./storage";

const DEVICE_ID_STORAGE_KEY = "myfav.device_id";

let cachedDeviceId: string | null = null;
let pendingBootstrap: Promise<string> | null = null;

async function registerDevice(): Promise<string> {
  const data = await apiRequest<DeviceRegisterResponse>("/devices", { method: "POST" });
  await setStorageItem(DEVICE_ID_STORAGE_KEY, data.device_id);
  return data.device_id;
}

async function bootstrap(): Promise<string> {
  const stored = await getStorageItem(DEVICE_ID_STORAGE_KEY);
  if (stored) {
    return stored;
  }
  return registerDevice();
}

/** device_id를 반환한다. 저장된 값이 없으면 서버에 새로 등록한다. */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }
  if (!pendingBootstrap) {
    pendingBootstrap = bootstrap().then((id) => {
      cachedDeviceId = id;
      return id;
    });
  }
  return pendingBootstrap;
}

/** 전체 기록 삭제(DELETE /devices/me) 이후, 새 기기 ID를 발급받아 교체한다. */
export async function reissueDeviceId(): Promise<string> {
  cachedDeviceId = null;
  pendingBootstrap = null;
  const id = await registerDevice();
  cachedDeviceId = id;
  return id;
}
