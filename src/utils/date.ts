/** 와이어프레임 표기(예: "01 OCT 2026")에 맞춘 날짜 포맷터. */
export function formatIssueDate(isoString: string): string {
  const date = new Date(isoString);
  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
  return formatted.toUpperCase();
}

export function formatIssueNo(issueNo: number): string {
  return String(issueNo).padStart(2, "0");
}

export function formatMonthShort(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("en-GB", { month: "short" }).format(date).toUpperCase();
}
