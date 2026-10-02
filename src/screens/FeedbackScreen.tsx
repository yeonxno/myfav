/**
 * SCR-FEEDBACK · 반응
 * 와이어프레임: docs/취향번역기_와이어프레임/07 FEEDBACK — REACTION.png
 */
import { useEffect, useState } from "react";
import { ScreenContainer } from "../components/ScreenContainer";
import { ScreenHeader } from "../components/ScreenHeader";
import { MainButton } from "../components/MainButton";
import { useToast } from "../components/Toast";
import { useNavigation, useScreenParams } from "../navigation/ScreenStack";
import { ScreenId } from "../navigation/types";
import { fetchRecommendationDetail, saveStamp } from "../api/recommendations";
import { STAMP_DEFINITIONS, type StampValue } from "../constants/stamps";
import { TOAST_MESSAGES } from "../constants/config";
import "./FeedbackScreen.css";

export function FeedbackScreen() {
  const { rec_id, issue_id } = useScreenParams<typeof ScreenId.Feedback>();
  const { push } = useNavigation();
  const { showToast } = useToast();

  const [selected, setSelected] = useState<StampValue | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const detail = await fetchRecommendationDetail(rec_id);
      if (!cancelled) setSelected(detail.stamp);
    })();
    return () => {
      cancelled = true;
    };
  }, [rec_id]);

  async function handleSelect(stamp: StampValue) {
    const previous = selected;
    setSelected(stamp);
    try {
      await saveStamp(rec_id, stamp);
      showToast(TOAST_MESSAGES.stampSaved);
    } catch {
      setSelected(previous);
      showToast(TOAST_MESSAGES.networkRetry);
    }
  }

  async function handleSubmit() {
    if (!selected || saving) return;
    setSaving(true);
    try {
      push(ScreenId.Share, { issue_id });
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer
      footer={
        <MainButton disabled={!selected || saving} onClick={handleSubmit}>
          스탬프 남기고 취향 카드 보기
        </MainButton>
      }
    >
      <ScreenHeader
        eyebrow="A NOTE FROM YOU"
        headline="이 번역, 나랑 닮았나요?"
        subtext={
          <>
            맞고 틀린 답은 없어요.
            <br />
            당신의 감각을 스탬프로 남겨주세요.
          </>
        }
      />

      <div className="feedback-bubble-row">
        <span className="feedback-bubble-arrow" aria-hidden="true">
          ↗
        </span>
        <span className="feedback-bubble">음악만큼, 이것도 좋아요?</span>
      </div>

      <div className="feedback-stamp-grid">
        {STAMP_DEFINITIONS.map((stamp) => {
          const isSelected = selected === stamp.value;
          return (
            <button
              key={stamp.value}
              type="button"
              className={["feedback-stamp", isSelected ? "feedback-stamp-selected" : ""].join(" ")}
              onClick={() => handleSelect(stamp.value)}
            >
              <span className="feedback-stamp-icon" aria-hidden="true">
                {stamp.icon}
              </span>
              <span className="feedback-stamp-label-ko">{stamp.labelKo}</span>
              <span className="feedback-stamp-label-en">{stamp.labelEn}</span>
            </button>
          );
        })}
      </div>

      <p className="feedback-helper-text">이 감각을 기억해서, 다음 번역을 더 당신답게.</p>
    </ScreenContainer>
  );
}
