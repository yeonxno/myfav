/**
 * SCR-SHARE · 저장 · 공유
 * 와이어프레임: docs/취향번역기_와이어프레임/08 SAVE SHARE — POSTER.png
 *
 * 주의(확인 필요): "이미지 저장"은 화면의 취향 카드 DOM을 이미지 파일로 변환해야 하는데,
 * 현재 골격에는 그런 변환 라이브러리(html2canvas 등)가 없다. 새 라이브러리 추가이므로
 * 임의로 넣지 않고 버튼/흐름만 구현한 뒤 사용자에게 추가 여부를 확인한다.
 */
import { useEffect, useRef, useState } from "react";
import heroCollage from "../assets/hero-collage.png";
import { SecondaryButton, TextLink } from "../components/SecondaryButton";
import { MainButton } from "../components/MainButton";
import { TasteTagList } from "../components/TasteTag";
import { useToast } from "../components/Toast";
import { useNavigation, useScreenParams } from "../navigation/ScreenStack";
import { ScreenId } from "../navigation/types";
import { fetchIssueDetail } from "../api/issues";
import type { IssueDetailResponse } from "../types/api";
import { createIssueShareLink, openShareSheet } from "../platform/share";
import { TOAST_MESSAGES } from "../constants/config";
import "./ShareScreen.css";

export function ShareScreen() {
  const { issue_id } = useScreenParams<typeof ScreenId.Share>();
  const { resetTo, push } = useNavigation();
  const { showToast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  const [issue, setIssue] = useState<IssueDetailResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchIssueDetail(issue_id);
      if (!cancelled) setIssue(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [issue_id]);

  async function handleSaveImage() {
    // TODO(확인 필요): DOM→이미지 변환 라이브러리 도입 여부를 사용자에게 확인한 뒤 연결한다.
    showToast(TOAST_MESSAGES.genericError);
  }

  async function handleShare() {
    if (!issue) return;
    try {
      const link = await createIssueShareLink(issue.issue_id, issue.mood_image_url ?? undefined);
      await openShareSheet(link);
    } catch {
      showToast(TOAST_MESSAGES.networkRetry);
    }
  }

  if (!issue) {
    return <div className="share-container" />;
  }

  return (
    <div className="share-container">
      <div className="share-scroll">
        <p className="share-eyebrow">KEEP YOUR TASTE.</p>
        <h1 className="share-headline">
          한 장으로 남기는
          <br />
          나의 취향.
        </h1>

        <div className="taste-card" ref={cardRef}>
          <div className="taste-card-head">
            <span>MY TASTE</span>
            <span>ISSUE {String(issue.issue_no).padStart(2, "0")}</span>
          </div>
          <h2 className="taste-card-name">{issue.taste_name}</h2>

          <div className="taste-card-collage">
            <img src={heroCollage} alt="" />
            <span className="taste-card-sticker">translated from music ♡</span>
          </div>

          <TasteTagList tags={issue.tags} />

          <div className="taste-card-divider" />

          <p className="taste-card-flow">MUSIC → MOVIE · BOOK · TRAVEL · PERFUME</p>
          <div className="taste-card-footer-row">
            <span>취향 번역기</span>
            <span>PERSONAL TASTE MAGAZINE</span>
          </div>
        </div>

        <div className="share-button-row">
          <SecondaryButton onClick={handleSaveImage}>이미지 저장 ⬇</SecondaryButton>
          <MainButton showArrow={false} onClick={handleShare}>
            카드 공유 ⬆
          </MainButton>
        </div>

        <div className="share-link-list">
          <TextLink onClick={() => push(ScreenId.Archive, undefined)}>내 취향 아카이브에서 다시 보기 →</TextLink>
          <TextLink onClick={() => resetTo(ScreenId.HomeReturn, undefined)}>처음 화면으로 →</TextLink>
        </div>
      </div>
    </div>
  );
}
