/**
 * SCR-HOME-RETURN · 재방문 홈(허브)
 * 와이어프레임: docs/취향번역기_와이어프레임/01-1 HOME — RETURNING.png
 *
 * 와이어프레임에는 궁합 안내 점선 박스가 있으나, 궁합은 MVP 후순위 기능이라
 * CLAUDE.md "알려진 차이"에 따라 숨긴다.
 */
import { useEffect, useState } from "react";
import { ScreenContainer } from "../components/ScreenContainer";
import { ScreenHeader } from "../components/ScreenHeader";
import { MainButton } from "../components/MainButton";
import { InfoLinks } from "../components/InfoLinks";
import { IssueSummaryCard } from "../components/IssueSummaryCard";
import { fetchHome } from "../api/home";
import type { LatestIssueSummary } from "../types/api";
import { useNavigation } from "../navigation/ScreenStack";
import { ScreenId } from "../navigation/types";
import "./HomeReturnScreen.css";

export function HomeReturnScreen() {
  const { push } = useNavigation();
  const [latestIssue, setLatestIssue] = useState<LatestIssueSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const home = await fetchHome();
        if (!cancelled) {
          setLatestIssue(home.latest_issue);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ScreenContainer
      footer={
        <>
          <MainButton onClick={() => push(ScreenId.Input, undefined)}>새로운 취향 번역하기</MainButton>
          <p className="home-return-helper-text">좋아하는 3곡이면 충분해요. 약 1분 정도 걸려요.</p>
          <InfoLinks />
        </>
      }
    >
      <ScreenHeader
        eyebrow="WELCOME BACK."
        headline={
          <>
            다시 펼친
            <br />
            당신의 취향 잡지.
          </>
        }
        subtext={
          <>
            지난 이슈를 다시 읽거나,
            <br />
            새로운 음악으로 다음 호를 만들어요.
          </>
        }
      />

      <div className="home-return-section-head">
        <p className="home-return-section-title">MY ISSUES</p>
        <button type="button" className="home-return-archive-link" onClick={() => push(ScreenId.Archive, undefined)}>
          지난 이슈 전체 보기 →
        </button>
      </div>

      {!loading && latestIssue ? (
        <IssueSummaryCard
          issue={latestIssue}
          size="compact"
          coverLabel="LAST ISSUE"
          linkLabel="다시 펼쳐보기"
          onClick={() => push(ScreenId.Profile, { issue_id: latestIssue.issue_id })}
        />
      ) : null}
    </ScreenContainer>
  );
}
