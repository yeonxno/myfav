import type { LatestIssueSummary } from "../types/api";
import { TasteTag } from "./TasteTag";
import { formatIssueDate } from "../utils/date";
import "./IssueSummaryCard.css";

/**
 * 이슈 요약 카드. 재방문 홈의 최근 이슈 카드(01-1), 아카이브의 이슈 목록(09)에서 함께 쓴다.
 * size="large"는 아카이브 최신 이슈, size="compact"는 재방문 홈·아카이브 이전 이슈에 쓴다.
 */
export function IssueSummaryCard({
  issue,
  size = "compact",
  coverLabel,
  linkLabel,
  onClick,
}: {
  issue: LatestIssueSummary;
  size?: "large" | "compact";
  coverLabel: string;
  linkLabel: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`issue-card issue-card-${size}`} onClick={onClick}>
      <span className="issue-card-cover">
        {issue.mood_image_url ? <img src={issue.mood_image_url} alt="" /> : null}
        <span className="issue-card-cover-overlay">
          <span className="issue-card-cover-label">{coverLabel}</span>
        </span>
      </span>
      <span className="issue-card-body">
        <span className="issue-card-date">
          {formatIssueDate(issue.created_at)} · ISSUE {String(issue.issue_no).padStart(2, "0")}
        </span>
        <span className="issue-card-name">{issue.taste_name}</span>
        <span className="issue-card-tracks">
          {issue.first_track.title} · {issue.first_track.artist}
          {issue.track_count > 1 ? ` 외 ${issue.track_count - 1}곡` : ""}
        </span>
        {issue.tags[0] ? <TasteTag label={issue.tags[0]} /> : null}
        <span className="issue-card-link">{linkLabel} →</span>
      </span>
    </button>
  );
}
