import type { ReactNode } from "react";
import "./ScreenHeader.css";

/**
 * 공통 화면 상단 구조: 영문 라벨(eyebrow) + 굵은 한글 헤드라인 + 보조 문장.
 * 기능명세서 1.6.2절 기준.
 */
export function ScreenHeader({
  eyebrow,
  headline,
  subtext,
  trailing,
}: {
  eyebrow: ReactNode;
  headline: ReactNode;
  subtext?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <header className="screen-header">
      <div className="screen-header-row">
        <p className="screen-header-eyebrow">{eyebrow}</p>
        {trailing}
      </div>
      <h1 className="screen-header-headline">{headline}</h1>
      {subtext ? <p className="screen-header-subtext">{subtext}</p> : null}
    </header>
  );
}
