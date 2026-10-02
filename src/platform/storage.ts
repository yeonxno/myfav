/**
 * 기기 저장소 접근. 앱인토스 WebView 안에서는 `Storage` 브릿지를 쓰고,
 * 브릿지가 없는 환경(일반 브라우저 개발 서버)에서는 localStorage로 대체한다.
 * 저장 형식과 키는 같게 유지해 두 환경에서 동작이 같다.
 */
import { Storage } from "@apps-in-toss/web-framework";

async function isBridgeAvailable(): Promise<boolean> {
  try {
    await Storage.getItem("__probe__");
    return true;
  } catch {
    return false;
  }
}

let bridgeAvailable: boolean | null = null;

async function resolveBridge(): Promise<boolean> {
  if (bridgeAvailable === null) {
    bridgeAvailable = await isBridgeAvailable();
  }
  return bridgeAvailable;
}

export async function getStorageItem(key: string): Promise<string | null> {
  if (await resolveBridge()) {
    return Storage.getItem(key);
  }
  return window.localStorage.getItem(key);
}

export async function setStorageItem(key: string, value: string): Promise<void> {
  if (await resolveBridge()) {
    await Storage.setItem(key, value);
    return;
  }
  window.localStorage.setItem(key, value);
}

export async function removeStorageItem(key: string): Promise<void> {
  if (await resolveBridge()) {
    // 앱인토스 Storage는 removeItem이 없어 빈 문자열로 덮어쓰지 않고 그대로 둔다.
    // device 삭제 흐름에서는 항상 새 값을 setItem으로 덮어쓰므로 문제되지 않는다.
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.removeItem(key);
}
