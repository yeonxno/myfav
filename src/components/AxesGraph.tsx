import { AXIS_DEFINITIONS } from "../constants/axes";
import type { Axes } from "../types/api";
import "./AxesGraph.css";

/**
 * 8개 감각 축 인포그래픽. 와이어프레임 04 TASTE PROFILE — IDENTITY.png 기준
 * (좌측 라벨 · 회색 트랙 · 민트 점 · 우측 라벨).
 */
export function AxesGraph({ axes, title, countLabel }: { axes: Axes; title: string; countLabel: string }) {
  return (
    <section className="axes-graph">
      <div className="axes-graph-head">
        <p className="axes-graph-title">{title}</p>
        <p className="axes-graph-count">{countLabel}</p>
      </div>
      <div className="axes-graph-rows">
        {AXIS_DEFINITIONS.map((axis) => {
          const score = axes[axis.key];
          return (
            <div className="axes-graph-row" key={axis.key}>
              <span className="axes-graph-label axes-graph-label-left">{axis.left}</span>
              <span className="axes-graph-track">
                <span className="axes-graph-dot" style={{ left: `${score}%` }} />
              </span>
              <span className="axes-graph-label axes-graph-label-right">{axis.right}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
