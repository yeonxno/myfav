import type { ButtonHTMLAttributes } from "react";
import "./MainButton.css";

interface MainButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: "mint" | "dark";
  showArrow?: boolean;
}

/** 화면 하단 메인 버튼. 기능명세서 1.6.2절(민트색 알약형, 오른쪽 화살표). */
export function MainButton({
  tone = "mint",
  showArrow = true,
  children,
  className,
  ...rest
}: MainButtonProps) {
  return (
    <button
      type="button"
      className={["main-button", `main-button-${tone}`, className].filter(Boolean).join(" ")}
      {...rest}
    >
      <span>{children}</span>
      {showArrow ? (
        <span className="main-button-arrow" aria-hidden="true">
          →
        </span>
      ) : null}
    </button>
  );
}
