/**
 * SCR-TERMS · 이용 약관
 * 와이어프레임: docs/취향번역기_와이어프레임/11-2 TERMS — SERVICE.png
 */
import { ScreenContainer } from "../components/ScreenContainer";
import { ScreenHeader } from "../components/ScreenHeader";
import { LegalArticleList } from "../components/LegalArticleList";
import { LEGAL_EFFECTIVE_DATE, TERMS_ARTICLES } from "../constants/legal";

export function TermsScreen() {
  return (
    <ScreenContainer>
      <ScreenHeader
        eyebrow="TERMS OF SERVICE"
        headline="이용 약관."
        subtext={`시행일 ${LEGAL_EFFECTIVE_DATE}`}
      />
      <LegalArticleList articles={TERMS_ARTICLES} />
    </ScreenContainer>
  );
}
