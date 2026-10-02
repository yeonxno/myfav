/**
 * SCR-PRIVACY · 개인정보 처리방침
 * 와이어프레임: docs/취향번역기_와이어프레임/11-3 PRIVACY — POLICY.png
 */
import { ScreenContainer } from "../components/ScreenContainer";
import { ScreenHeader } from "../components/ScreenHeader";
import { LegalArticleList } from "../components/LegalArticleList";
import { LEGAL_EFFECTIVE_DATE, PRIVACY_ARTICLES, PRIVACY_SUMMARY } from "../constants/legal";
import "./LegalScreen.css";

export function PrivacyScreen() {
  return (
    <ScreenContainer>
      <ScreenHeader
        eyebrow="PRIVACY POLICY"
        headline="개인정보 처리방침."
        subtext={`시행일 ${LEGAL_EFFECTIVE_DATE}`}
      />
      <div className="legal-summary-box">
        <p className="legal-summary-label">IN SHORT</p>
        <p className="legal-summary-text">{PRIVACY_SUMMARY}</p>
      </div>
      <LegalArticleList articles={PRIVACY_ARTICLES} />
    </ScreenContainer>
  );
}
