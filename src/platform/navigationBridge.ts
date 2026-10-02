/**
 * 토스 뒤로가기(backEvent) 구독과 미니앱 종료(Screen.close)를 감싼다.
 * 브릿지가 없는 브라우저 환경에서는 window.history의 popstate로 대체해
 * 개발 중에도 뒤로가기 흐름을 확인할 수 있게 한다.
 */
import { Screen, graniteEvent } from "@apps-in-toss/web-framework";

export function subscribeBackEvent(onBack: () => void): () => void {
  try {
    const unsubscribe = graniteEvent.addEventListener("backEvent", {
      onEvent: onBack,
      onError: () => {
        /* 브릿지 오류 시 브라우저 폴백만 사용한다 */
      },
    });
    // 브라우저 폴백(뒤로가기 제스처가 없는 WebView 밖 환경 대비)도 함께 건다.
    const historyHandler = () => onBack();
    window.addEventListener("popstate", historyHandler);
    window.history.pushState({ __appStack: true }, "");

    return () => {
      unsubscribe();
      window.removeEventListener("popstate", historyHandler);
    };
  } catch {
    const historyHandler = () => onBack();
    window.addEventListener("popstate", historyHandler);
    return () => window.removeEventListener("popstate", historyHandler);
  }
}

export async function closeMiniApp(): Promise<void> {
  try {
    await Screen.close();
  } catch {
    // 브라우저 개발 환경 폴백
    window.history.back();
  }
}
