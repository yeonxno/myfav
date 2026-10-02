/**
 * SCR-PROFILE · 취향 프로필
 * 와이어프레임: docs/취향번역기_와이어프레임/04 TASTE PROFILE — IDENTITY.png
 *
 * 와이어프레임의 "친구와 궁합 보기" 보조 버튼은 궁합이 MVP 후순위 기능이라
 * CLAUDE.md "알려진 차이"에 따라 숨긴다.
 */
import { useEffect, useState } from "react";
import { ScreenContainer } from "../components/ScreenContainer";
import { ScreenHeader } from "../components/ScreenHeader";
import { MainButton } from "../components/MainButton";
import { SecondaryButton } from "../components/SecondaryButton";
import { TasteTagList } from "../components/TasteTag";
import { AxesGraph } from "../components/AxesGraph";
import { useToast } from "../components/Toast";
import { useNavigation, useScreenParams } from "../navigation/ScreenStack";
import { ScreenId } from "../navigation/types";
import { fetchIssueDetail } from "../api/issues";
import { ApiError } from "../api/client";
import type { IssueDetailResponse } from "../types/api";
import { DEFAULT_CATEGORY } from "../constants/categories";
import { TOAST_MESSAGES } from "../constants/config";
import "./ProfileScreen.css";

export function ProfileScreen() {
  const { issue_id } = useScreenParams<typeof ScreenId.Profile>();
  const { push, resetTo } = useNavigation();
  const { showToast } = useToast();

  const [issue, setIssue] = useState<IssueDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchIssueDetail(issue_id);
        if (!cancelled) setIssue(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.code === "ISSUE_NOT_FOUND") {
          showToast(TOAST_MESSAGES.genericError);
          resetTo(ScreenId.HomeReturn, undefined);
          return;
        }
        showToast(TOAST_MESSAGES.networkRetry);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [issue_id, resetTo, showToast]);

  if (loading || !issue) {
    return <ScreenContainer>{null}</ScreenContainer>;
  }

  const summaryLines = issue.summary.split("\n");

  return (
    <ScreenContainer
      footer={
        issue.is_owner ? (
          <MainButton
            onClick={() => push(ScreenId.Translate, { issue_id: issue.issue_id, category: DEFAULT_CATEGORY })}
          >
            다른 세계로 번역하기
          </MainButton>
        ) : (
          <MainButton onClick={() => push(ScreenId.Input, undefined)}>나도 번역해보기</MainButton>
        )
      }
    >
      <ScreenHeader
        eyebrow="YOUR TASTE PROFILE"
        trailing={<span className="profile-vol">VOL. {String(issue.issue_no).padStart(2, "0")}</span>}
        headline={issue.taste_name}
        subtext={
          <>
            {summaryLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < summaryLines.length - 1 ? <br /> : null}
              </span>
            ))}
          </>
        }
      />

      <div className="profile-mood-band">
        <div className="profile-mood-photo">
          {issue.mood_image_url ? <img src={issue.mood_image_url} alt="" /> : null}
        </div>
        <span className="profile-mood-sparkle" aria-hidden="true">
          ✦
        </span>
        <span className="profile-mood-bubble">this is so you.</span>
      </div>

      <TasteTagList tags={issue.tags} />

      <AxesGraph axes={issue.axes} title="THE SHAPE OF YOUR TASTE" countLabel="8 NOTES" />
      <p className="profile-axes-caption">선택한 음악에서 발견한 감각의 방향이에요.</p>

      {issue.is_owner ? (
        <div className="profile-secondary-row">
          <SecondaryButton onClick={() => push(ScreenId.Share, { issue_id: issue.issue_id })}>
            취향 카드 공유
          </SecondaryButton>
        </div>
      ) : null}
    </ScreenContainer>
  );
}
