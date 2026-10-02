/**
 * 공유 링크로 들어왔을 때 이슈 ID를 추출한다. 화면흐름명세 "진입 경로": 친구가 공유한
 * 취향 카드 링크 → 취향 프로필(읽기 전용).
 *
 * 주의(확인 필요): 실제 앱인토스 딥링크 경로 규칙이 확정되면 이 파서도 함께 맞춰야 한다
 * (platform/share.ts의 buildIssueDeepLinkPath와 쌍을 이룬다).
 */
import { Environment } from "@apps-in-toss/web-framework";

export function extractSharedIssueId(): string | null {
  let url: string;
  try {
    url = Environment.initialURL || "";
  } catch {
    url = typeof window !== "undefined" ? window.location.href : "";
  }
  if (!url) return null;

  const match = url.match(/\/issues\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
