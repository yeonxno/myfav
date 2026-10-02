/**
 * 토스 공유 링크 생성·공유 시트 호출.
 *
 * 주의(확인 필요): `Share.createLink`의 `path`는 `intoss://`로 시작하는 딥링크여야 한다(SDK 타입 정의 기준).
 * 이 미니앱의 실제 등록 경로(appId, 라우트 규칙)는 앱인토스 콘솔 등록 내용에 따라 달라지므로,
 * 아래 `buildDeepLinkPath`의 경로 형식은 배포 전 앱인토스 콘솔/공식 문서로 반드시 재확인해야 한다.
 */
import { Share } from "@apps-in-toss/web-framework";

function buildIssueDeepLinkPath(issueId: string): string {
  // TODO(확인 필요): 실제 앱인토스 앱 식별자·라우트 규칙에 맞게 보정한다.
  return `intoss://myfav/issues/${issueId}`;
}

export async function createIssueShareLink(issueId: string, ogImageUrl?: string): Promise<string> {
  const path = buildIssueDeepLinkPath(issueId);
  try {
    return await Share.createLink({ path, ogImageUrl });
  } catch {
    // 브라우저 개발 환경 폴백: 실제 공유는 불가하므로 경로 문자열만 반환한다.
    return path;
  }
}

export async function openShareSheet(message: string): Promise<void> {
  try {
    await Share.sendMessage({ message });
  } catch {
    // 브릿지가 없는 환경에서는 클립보드 복사로 대체한다.
    await copyToClipboard(message);
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
