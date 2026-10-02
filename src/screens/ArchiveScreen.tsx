/**
 * SCR-ARCHIVE · 아카이브 (+ SCR-ARCHIVE-DELETE 기록 삭제 확인 팝업)
 * 와이어프레임:
 *   docs/취향번역기_와이어프레임/09 MY TASTE ARCHIVE — COLLECTION.png
 *   docs/취향번역기_와이어프레임/09-2 ARCHIVE — DELETE CONFIRM.png
 *
 * 와이어프레임의 "취향 변화 보기" 링크는 취향 변화 비교가 MVP 후순위 기능이라
 * CLAUDE.md "알려진 차이"에 따라 숨긴다.
 */
import { useEffect, useState } from "react";
import { ScreenContainer } from "../components/ScreenContainer";
import { ScreenHeader } from "../components/ScreenHeader";
import { MainButton } from "../components/MainButton";
import { NoticeBox } from "../components/NoticeBox";
import { IssueSummaryCard } from "../components/IssueSummaryCard";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";
import { useNavigation } from "../navigation/ScreenStack";
import { ScreenId } from "../navigation/types";
import { fetchIssueList } from "../api/issues";
import { deleteAllRecords } from "../api/devices";
import type { LatestIssueSummary } from "../types/api";
import { TOAST_MESSAGES } from "../constants/config";
import "./ArchiveScreen.css";

export function ArchiveScreen() {
  const { push, resetTo, registerBackOverride } = useNavigation();
  const { showToast } = useToast();

  const [issues, setIssues] = useState<LatestIssueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchIssueList();
        if (!cancelled) setIssues(data.issues);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () =>
      registerBackOverride(() => {
        if (deleteOpen) {
          setDeleteOpen(false);
          return true;
        }
        return false;
      }),
    [deleteOpen, registerBackOverride],
  );

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await deleteAllRecords();
      resetTo(ScreenId.Home, undefined);
    } catch {
      showToast(TOAST_MESSAGES.networkRetry);
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  const [latest, ...rest] = issues;

  return (
    <ScreenContainer
      footer={<MainButton onClick={() => push(ScreenId.Input, undefined)}>새로운 취향 번역하기</MainButton>}
    >
      <ScreenHeader
        eyebrow="MY TASTE ARCHIVE"
        trailing={!loading ? <span className="archive-count">{issues.length} ISSUES</span> : null}
        headline={
          <>
            차곡차곡,
            <br />
            나를 닮은 이슈들.
          </>
        }
        subtext="취향은 변해도, 기록은 남으니까."
      />

      {!loading && issues.length === 0 ? (
        <div className="archive-empty">
          <p>아직 번역한 취향이 없어요.</p>
          <MainButton onClick={() => push(ScreenId.Input, undefined)}>첫 번째 취향 번역하기</MainButton>
        </div>
      ) : null}

      {latest ? (
        <div className="archive-latest">
          <IssueSummaryCard
            issue={latest}
            size="large"
            coverLabel={`MY TASTE / ISSUE ${String(latest.issue_no).padStart(2, "0")}`}
            linkLabel="이슈 펼쳐보기"
            onClick={() => push(ScreenId.Profile, { issue_id: latest.issue_id })}
          />
        </div>
      ) : null}

      {rest.length > 0 ? (
        <div className="archive-rest">
          {rest.map((issue) => (
            <IssueSummaryCard
              key={issue.issue_id}
              issue={issue}
              size="compact"
              coverLabel={`ISSUE ${String(issue.issue_no).padStart(2, "0")}`}
              linkLabel="이슈 펼쳐보기"
              onClick={() => push(ScreenId.Profile, { issue_id: issue.issue_id })}
            />
          ))}
        </div>
      ) : null}

      {issues.length > 0 ? (
        <>
          <NoticeBox icon="📁">나의 취향 잡지에, 다음 이야기를 더해볼까요?</NoticeBox>

          <div className="archive-manage-row">
            <button type="button" className="archive-delete-link" onClick={() => setDeleteOpen(true)}>
              기록 관리 · 전체 삭제
            </button>
          </div>
        </>
      ) : null}

      {deleteOpen ? (
        <ConfirmDialog
          eyebrow="CLEAR ARCHIVE"
          title="모든 이슈를 지울까요?"
          description="이 기기에 저장된 이슈와 스탬프가 모두 지워지고, 되돌릴 수 없어요."
          cancelLabel="취소"
          confirmLabel="삭제하기"
          onCancel={() => setDeleteOpen(false)}
          onConfirm={deleting ? () => undefined : handleDeleteConfirm}
        />
      ) : null}
    </ScreenContainer>
  );
}
