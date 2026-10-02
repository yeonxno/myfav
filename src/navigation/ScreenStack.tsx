/**
 * 앱 내 화면 스택. 앱인토스 SDK에는 라우터가 없어 직접 구현한다.
 * 기능명세서 3.7절(뒤로가기 목적지)을 이 스택의 push/resetTo/back 호출로 구현한다.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { closeMiniApp, subscribeBackEvent } from "../platform/navigationBridge";
import type { ScreenIdValue, ScreenParamsMap, StackEntry } from "./types";

let keySeq = 0;
function nextKey(): string {
  keySeq += 1;
  return `scr-${keySeq}`;
}

interface NavigationContextValue {
  stack: StackEntry[];
  push: <K extends ScreenIdValue>(screen: K, params: ScreenParamsMap[K]) => void;
  resetTo: <K extends ScreenIdValue>(screen: K, params: ScreenParamsMap[K]) => void;
  /** 여러 화면으로 스택을 통째로 교체한다(예: 분석 완료 시 [재방문 홈, 취향 프로필]). */
  resetToSequence: (entries: { screen: ScreenIdValue; params: ScreenParamsMap[ScreenIdValue] }[]) => void;
  back: () => void;
  updateTopParams: <K extends ScreenIdValue>(partial: Partial<ScreenParamsMap[K]>) => void;
  /**
   * 화면 안의 임시 상태(검색 상태, 팝업 등)가 하드웨어 뒤로가기를 가로채야 할 때 등록한다.
   * handler가 true를 반환하면 스택 pop을 막는다. 반환값 함수를 호출하면 등록이 해제된다.
   */
  registerBackOverride: (handler: () => boolean) => () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({
  initialScreen,
  initialParams,
  children,
}: {
  initialScreen: ScreenIdValue;
  initialParams: ScreenParamsMap[ScreenIdValue];
  children: ReactNode;
}) {
  const [stack, setStack] = useState<StackEntry[]>([
    { screen: initialScreen, params: initialParams, key: nextKey() },
  ]);
  const backOverrides = useRef<Array<() => boolean>>([]);

  const push = useCallback<NavigationContextValue["push"]>((screen, params) => {
    setStack((prev) => [...prev, { screen, params, key: nextKey() } as StackEntry]);
  }, []);

  const resetTo = useCallback<NavigationContextValue["resetTo"]>((screen, params) => {
    setStack([{ screen, params, key: nextKey() } as StackEntry]);
  }, []);

  const resetToSequence = useCallback<NavigationContextValue["resetToSequence"]>((entries) => {
    setStack(entries.map((entry) => ({ ...entry, key: nextKey() }) as StackEntry));
  }, []);

  const updateTopParams = useCallback<NavigationContextValue["updateTopParams"]>((partial) => {
    setStack((prev) => {
      if (prev.length === 0) return prev;
      const top = prev[prev.length - 1];
      const next = [...prev];
      next[next.length - 1] = { ...top, params: { ...top.params, ...partial } };
      return next;
    });
  }, []);

  const registerBackOverride = useCallback((handler: () => boolean) => {
    backOverrides.current.push(handler);
    return () => {
      backOverrides.current = backOverrides.current.filter((h) => h !== handler);
    };
  }, []);

  const back = useCallback(() => {
    const topOverride = backOverrides.current[backOverrides.current.length - 1];
    if (topOverride && topOverride()) {
      return;
    }
    setStack((prev) => {
      if (prev.length <= 1) {
        void closeMiniApp();
        return prev;
      }
      return prev.slice(0, -1);
    });
  }, []);

  const backRef = useRef(back);
  useEffect(() => {
    backRef.current = back;
  }, [back]);

  useEffect(() => {
    // 하드웨어 뒤로가기 구독은 Provider 생애주기 동안 한 번만 건다.
    return subscribeBackEvent(() => {
      backRef.current();
    });
  }, []);

  const value = useMemo<NavigationContextValue>(
    () => ({ stack, push, resetTo, resetToSequence, back, updateTopParams, registerBackOverride }),
    [stack, push, resetTo, resetToSequence, back, updateTopParams, registerBackOverride],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useNavigation은 NavigationProvider 안에서만 쓸 수 있다.");
  }
  return ctx;
}

export function useCurrentScreen(): StackEntry {
  const { stack } = useNavigation();
  return stack[stack.length - 1];
}

export function useScreenParams<K extends ScreenIdValue>(): ScreenParamsMap[K] {
  const entry = useCurrentScreen();
  return entry.params as ScreenParamsMap[K];
}
