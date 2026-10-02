import type { CSSProperties, ReactNode } from "react";
import "./ScreenContainer.css";

export function ScreenContainer({
  children,
  footer,
  scrollable = true,
  style,
}: {
  children: ReactNode;
  footer?: ReactNode;
  scrollable?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div className="screen-container">
      <div className={scrollable ? "screen-scroll" : "screen-scroll screen-scroll-static"} style={style}>
        {children}
      </div>
      {footer ? <div className="screen-footer">{footer}</div> : null}
    </div>
  );
}
