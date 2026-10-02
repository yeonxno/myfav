import type { ButtonHTMLAttributes } from "react";
import "./SecondaryButton.css";

/** 보조 버튼. 기능명세서 1.6.2절(흰 배경 + 테두리의 알약형). */
export function SecondaryButton({
  children,
  className,
  tone = "default",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "default" | "danger" }) {
  return (
    <button
      type="button"
      className={["secondary-button", `secondary-button-${tone}`, className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}

/** 텍스트 링크. "문구 →" 형태. */
export function TextLink({
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={["text-link", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </button>
  );
}
