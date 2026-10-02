import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { TOAST_DURATION_MS } from "../constants/config";
import "./Toast.css";

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((next: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setMessage(next);
    timerRef.current = setTimeout(() => setMessage(null), TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message ? (
        <div className="toast-host">
          <div className="toast-bubble" role="status">
            {message}
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast는 ToastProvider 안에서만 쓸 수 있다.");
  }
  return ctx;
}
