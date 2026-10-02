/**
 * 서버 API 공통 호출기. API명세서 1.1·1.2·1.3절 기준
 * (기본 주소 `/api/v1`, `X-Device-Id` 헤더, `{success,data}`/`{success:false,error}` 포맷).
 *
 * 기본 주소는 `VITE_API_BASE_URL` 환경 변수로 바꿀 수 있다(.env.local에 설정, 커밋하지 않음).
 */
import type { ApiErrorCode, ApiResponse } from "../types/api";

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api/v1";

export class ApiError extends Error {
  readonly code: ApiErrorCode | string;
  readonly httpStatus: number;

  constructor(code: ApiErrorCode | string, message: string, httpStatus: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  deviceId?: string | null;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, deviceId, signal } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (deviceId) {
    headers["X-Device-Id"] = deviceId;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "네트워크 연결을 확인해 주세요.", 0);
  }

  let json: ApiResponse<T>;
  try {
    json = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError("INTERNAL_ERROR", "서버 응답을 처리하지 못했어요.", response.status);
  }

  if (!json.success) {
    throw new ApiError(json.error.code, json.error.message, response.status);
  }

  return json.data;
}
