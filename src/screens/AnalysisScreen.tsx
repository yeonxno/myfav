/**
 * SCR-ANALYSIS · 분석 중 (+ SCR-ANALYSIS-RETRY 재시도 상태)
 * 와이어프레임:
 *   docs/취향번역기_와이어프레임/03 ANALYSIS — EDITING.png
 *   docs/취향번역기_와이어프레임/03-1 ANALYSIS — RETRY.png
 */
import { useEffect, useRef, useState } from "react";
import { ScreenContainer } from "../components/ScreenContainer";
import { ScreenHeader } from "../components/ScreenHeader";
import { MainButton } from "../components/MainButton";
import { NoticeBox } from "../components/NoticeBox";
import { TextLink } from "../components/SecondaryButton";
import { useNavigation, useScreenParams } from "../navigation/ScreenStack";
import { ScreenId } from "../navigation/types";
import { cancelAnalysis, createAnalysis, fetchAnalysisStatus } from "../api/analyses";
import { ANALYSIS_STEPS, ANALYSIS_STEP_INTERVAL_MS } from "../constants/analysisSteps";
import { ANALYSIS_POLL_INTERVAL_MS, ANALYSIS_TIMEOUT_SECONDS } from "../constants/config";
import "./AnalysisScreen.css";

type Phase = "running" | "retry";

export function AnalysisScreen() {
  const { analysis_id, tracks: originalTracks, invite_id } = useScreenParams<typeof ScreenId.Analysis>();
  const { resetToSequence, registerBackOverride, back } = useNavigation();

  const [phase, setPhase] = useState<Phase>("running");
  const [currentStep, setCurrentStep] = useState(1);
  const [serverDone, setServerDone] = useState(false);
  const [issueId, setIssueId] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const currentAnalysisId = useRef(analysis_id);
  const failedStepRef = useRef(3);

  useEffect(() => {
    currentAnalysisId.current = analysis_id;
  }, [analysis_id]);

  useEffect(
    () =>
      registerBackOverride(() => {
        void cancelAnalysis(currentAnalysisId.current).catch(() => undefined);
        return false;
      }),
    [registerBackOverride],
  );

  // 01~03단계는 연출로 자동 진행(기능명세서 2.5절). 04단계는 서버가 fetching이 되면 전환한다.
  useEffect(() => {
    if (phase !== "running" || serverDone) return;
    if (currentStep >= 3) return;
    const timer = setTimeout(() => setCurrentStep((s) => Math.min(s + 1, 3)), ANALYSIS_STEP_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [phase, currentStep, serverDone]);

  useEffect(() => {
    // serverDone이 이미 true면(재시도 중 즉시 재사용 응답을 받은 경우 등) 다시 폴링을 돌리지
    // 않는다 — 안 그러면 완료 버튼이 보이는 도중에 다시 재시도 화면으로 바뀌는 경쟁 상태가 생긴다.
    if (phase !== "running" || serverDone) return;
    let cancelled = false;
    const startedAt = Date.now();

    const poll = async () => {
      if (cancelled) return;
      try {
        const status = await fetchAnalysisStatus(currentAnalysisId.current);
        if (cancelled) return;

        if (status.status === "fetching") {
          setCurrentStep(4);
        }
        if (status.status === "done" && status.issue_id) {
          setServerDone(true);
          setCurrentStep(4);
          setIssueId(status.issue_id);
          return;
        }
        if (status.status === "failed") {
          failedStepRef.current = currentStep;
          setPhase("retry");
          return;
        }

        if (Date.now() - startedAt >= ANALYSIS_TIMEOUT_SECONDS * 1000) {
          failedStepRef.current = currentStep;
          setPhase("retry");
          return;
        }
        setTimeout(poll, ANALYSIS_POLL_INTERVAL_MS);
      } catch {
        if (!cancelled) {
          setTimeout(poll, ANALYSIS_POLL_INTERVAL_MS);
        }
      }
    };

    void poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, serverDone]);

  function handleViewProfile() {
    if (!issueId) return;
    resetToSequence([
      { screen: ScreenId.HomeReturn, params: undefined },
      { screen: ScreenId.Profile, params: { issue_id: issueId } },
    ]);
  }

  async function handleRetry() {
    setRetrying(true);
    try {
      // 기능명세서 2.6절: 같은 곡으로 다시 분석을 요청한다(API명세서 3.4절 POST /analyses).
      // 원래 요청이 서버에서는 계속 진행 중이었을 수 있어, 같은 곡 조합이면 서버가 즉시
      // 완료된 결과(reused)를 돌려줄 수 있다 — 이 경우 폴링을 다시 돌리지 않고 바로 반영한다.
      const response = await createAnalysis({ tracks: originalTracks, invite_id: invite_id ?? null });
      if (response.status === "done" && response.issue_id) {
        setIssueId(response.issue_id);
        setServerDone(true);
        setCurrentStep(4);
        setPhase("running");
        return;
      }
      currentAnalysisId.current = response.analysis_id;
      failedStepRef.current = 3;
      setCurrentStep(1);
      setServerDone(false);
      setPhase("running");
    } catch {
      // 재시도 요청 자체가 실패하면 재시도 화면에 머무른다.
    } finally {
      setRetrying(false);
    }
  }

  return (
    <ScreenContainer
      footer={
        phase === "running" ? (
          <>
            <MainButton tone="dark" disabled={!serverDone} onClick={handleViewProfile}>
              내 취향 프로필 보기
            </MainButton>
            <p className="analysis-footer-caption">거의 다 왔어요. 당신의 첫 번째 이슈를 만드는 중.</p>
          </>
        ) : (
          <>
            <MainButton onClick={handleRetry} disabled={retrying}>
              다시 번역하기
            </MainButton>
            <div className="analysis-retry-link-row">
              <TextLink onClick={back}>음악 다시 고르기 →</TextLink>
            </div>
          </>
        )
      }
    >
      {phase === "running" ? (
        <>
          <ScreenHeader
            eyebrow={`EDITING YOUR TASTE / 0${Math.min(currentStep, 3)}`}
            headline="음악 사이에 숨은 당신을 읽는 중."
            subtext="멜로디에서 감각을 골라내고 있어요."
          />
          <AnalysisIllustration tone="active" />
        </>
      ) : (
        <>
          <ScreenHeader
            eyebrow="EDITING PAUSED / 03"
            headline="잠시, 번역이 멈췄어요."
            subtext="음악을 읽는 데 평소보다 오래 걸리고 있어요."
          />
          <AnalysisIllustration tone="paused" />
        </>
      )}

      <div className="analysis-progress">
        <div className="analysis-progress-head">
          <p>TRANSLATING YOUR WORLD</p>
          <p>
            {currentStep.toString().padStart(2, "0")} / 04
          </p>
        </div>
        <div className="analysis-progress-track">
          <div
            className={["analysis-progress-fill", phase === "retry" ? "analysis-progress-fill-paused" : ""].join(" ")}
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      <ul className="analysis-steps">
        {ANALYSIS_STEPS.map(({ step, label }) => {
          const isFailed = phase === "retry" && step === failedStepRef.current;
          const isDone = step < currentStep || (serverDone && step === 4);
          const isActive = step === currentStep && !isDone && phase === "running";
          return (
            <li
              key={step}
              className={[
                "analysis-step",
                isActive ? "analysis-step-active" : "",
                isFailed ? "analysis-step-failed" : "",
              ].join(" ")}
            >
              <span className="analysis-step-number">{step.toString().padStart(2, "0")}</span>
              <span className="analysis-step-label">{label}</span>
              {isFailed ? (
                <span className="analysis-step-status analysis-step-status-failed">다시 시도 필요</span>
              ) : isDone ? (
                <span className="analysis-step-status" aria-hidden="true">
                  ✓
                </span>
              ) : isActive ? (
                <span className="analysis-step-status" aria-hidden="true">
                  •••
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>

      {phase === "retry" ? (
        <NoticeBox icon="♪">고른 음악은 그대로 남아 있어요. 네트워크를 확인해 주세요.</NoticeBox>
      ) : null}
    </ScreenContainer>
  );
}

function AnalysisIllustration({ tone }: { tone: "active" | "paused" }) {
  return (
    <div className="analysis-illustration">
      <span className="analysis-sticker analysis-sticker-1">dreamy</span>
      <p className="analysis-illustration-word">MUSIC</p>
      <p className="analysis-illustration-arrow" aria-hidden="true">
        ↓
      </p>
      <p className="analysis-illustration-word">MOOD</p>
      <span className="analysis-sticker analysis-sticker-2">
        {tone === "active" ? "nostalgic" : "try again?"}
      </span>
      <p className="analysis-illustration-arrow" aria-hidden="true">
        ↓
      </p>
      <div className="analysis-illustration-bottom-row">
        <span className="analysis-sticker analysis-sticker-3">warm &amp; quiet</span>
        {tone === "active" ? (
          <span className="analysis-illustration-taste">TASTE</span>
        ) : (
          <span className="analysis-illustration-taste analysis-illustration-taste-paused">· ·</span>
        )}
      </div>
    </div>
  );
}
