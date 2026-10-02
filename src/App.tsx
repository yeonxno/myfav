import { useEffect, useState } from "react";
import "./styles/global.css";
import "./App.css";
import { getDeviceId } from "./platform/device";
import { fetchHome } from "./api/home";
import { fetchIssueDetail } from "./api/issues";
import { ApiError } from "./api/client";
import { extractSharedIssueId } from "./platform/deepLink";
import { NavigationProvider } from "./navigation/ScreenStack";
import { ScreenRenderer } from "./navigation/ScreenRenderer";
import { ScreenId, type ScreenIdValue } from "./navigation/types";
import { ToastProvider, useToast } from "./components/Toast";
import type { ScreenParamsMap } from "./navigation/types";
import { TOAST_MESSAGES } from "./constants/config";

type BootState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; screen: ScreenIdValue; params: ScreenParamsMap[ScreenIdValue] };

function App() {
  return (
    <ToastProvider>
      <Bootstrapper />
    </ToastProvider>
  );
}

function Bootstrapper() {
  const { showToast } = useToast();
  const [boot, setBoot] = useState<BootState>({ status: "loading" });
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBoot({ status: "loading" });

      // 기기 등록은 모든 요청의 전제조건이라, 여기서 실패하면 화면 자체를 띄울 수 없다.
      // 서버 연결 실패 시 빈 화면에 멈추지 않도록 에러 상태를 따로 보여준다.
      try {
        await getDeviceId();
      } catch {
        if (!cancelled) setBoot({ status: "error" });
        return;
      }

      // 화면흐름명세: 공유 링크로 들어오면 해당 이슈의 취향 프로필(읽기 전용)을 바로 연다.
      const sharedIssueId = extractSharedIssueId();
      if (sharedIssueId) {
        try {
          await fetchIssueDetail(sharedIssueId);
          if (!cancelled) {
            setBoot({ status: "ready", screen: ScreenId.Profile, params: { issue_id: sharedIssueId } });
          }
          return;
        } catch (err) {
          if (!cancelled && err instanceof ApiError && err.code === "ISSUE_NOT_FOUND") {
            showToast(TOAST_MESSAGES.genericError);
          }
          // 링크가 만료·오류면 아래의 일반 홈 분기로 넘어간다(기능명세서 2.7절 예외 처리).
        }
      }

      try {
        const home = await fetchHome();
        if (cancelled) return;
        setBoot(
          home.has_issue
            ? { status: "ready", screen: ScreenId.HomeReturn, params: undefined }
            : { status: "ready", screen: ScreenId.Home, params: undefined },
        );
      } catch {
        // 기능명세서 2.1절: 지난 이슈 확인에 실패하면 첫 방문 홈을 노출한다.
        if (!cancelled) {
          setBoot({ status: "ready", screen: ScreenId.Home, params: undefined });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryTick]);

  if (boot.status === "loading") {
    return <div className="app-boot-splash" aria-hidden="true" />;
  }

  if (boot.status === "error") {
    return (
      <div className="app-boot-splash app-boot-error">
        <p>서버에 연결할 수 없어요.</p>
        <p className="app-boot-error-hint">백엔드 서버와 VITE_API_BASE_URL 설정을 확인해 주세요.</p>
        <button type="button" onClick={() => setRetryTick((t) => t + 1)}>
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <NavigationProvider initialScreen={boot.screen} initialParams={boot.params}>
      <ScreenRenderer />
    </NavigationProvider>
  );
}

export default App;
