import type { ReactNode } from "react";
import "./NoticeBox.css";

/** 안내 박스. 기능명세서 1.6.4절(점선 테두리 + 아이콘 + 한 줄 문구). */
export function NoticeBox({
  icon = "✦",
  children,
  onClick,
  trailing,
}: {
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  trailing?: ReactNode;
}) {
  if (onClick) {
    return (
      <button type="button" className="notice-box notice-box-clickable" onClick={onClick}>
        <span className="notice-box-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="notice-box-text">{children}</span>
        {trailing}
      </button>
    );
  }
  return (
    <div className="notice-box">
      <span className="notice-box-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="notice-box-text">{children}</span>
      {trailing}
    </div>
  );
}
