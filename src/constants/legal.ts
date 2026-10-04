/**
 * 서비스 소개 · 이용 약관 · 개인정보 처리방침 고정 텍스트.
 *
 * 확인 필요(사용자에게 보고함):
 * - 시행일/팀 이름은 와이어프레임에도 "[2026.00.00]" "[팀 이름]" 처럼 대괄호 placeholder로
 *   남아 있고, 기능명세서 4.2절도 "시행일 확정 필요"라고 명시한다. 실제 값이 정해지면
 *   아래 두 상수만 바꾸면 된다.
 * - 이용 약관 ARTICLE 02 본문은 기능명세서에 조항 제목만 있고 본문 문장이 없어(2.19절,
 *   "조항 본문은 출시 전 확정이 필요") 와이어프레임 문장을 그대로 썼다. 다만 그 문장이
 *   "궁합 기능을 제공해요"를 언급하는데, 궁합은 이번 MVP에서 숨긴 후순위 기능이라
 *   실제 제공 범위와 맞지 않는다. 출시 전 문구 조정이 필요하다.
 * - 개인정보 처리방침 ARTICLE 02 "이용 목적"은 와이어프레임에 "추천 품질 개선"이 추가로
 *   적혀 있지만, 기능명세서 2.20절 표에는 없다. 정책 내용은 기능명세서가 우선이므로
 *   기능명세서 문구(추천 품질 개선 제외)를 따랐다.
 */
export const LEGAL_EFFECTIVE_DATE = "[2026.10.04]";
export const TEAM_NAME_PLACEHOLDER = "MYFAV";

export interface LegalArticle {
  no: string;
  title: string;
  body: string;
}

export const TERMS_ARTICLES: readonly LegalArticle[] = [
  { no: "ARTICLE 01", title: "목적", body: "이 약관은 취향 번역기 서비스를 이용하는 데 필요한 사항을 정해요." },
  {
    no: "ARTICLE 02",
    title: "서비스의 제공",
    body: "음악 기반 취향 분석, 분야별 추천, 취향 카드 저장과 공유, 궁합 기능을 제공해요.",
  },
  {
    no: "ARTICLE 03",
    title: "AI 생성 콘텐츠",
    body: "추천 이유와 취향 이름은 AI가 생성하며, 내용의 정확성을 보장하지 않아요.",
  },
  {
    no: "ARTICLE 04",
    title: "이용자의 의무",
    body: "타인의 권리를 침해하거나 서비스 운영을 방해하는 행위를 하지 않아요.",
  },
  {
    no: "ARTICLE 05",
    title: "기록의 보관",
    body: "기록은 이용자의 기기에 연결된 익명 ID로 보관되며, 이용자가 언제든 삭제할 수 있어요.",
  },
] as const;

export const PRIVACY_SUMMARY =
  "이름 · 연락처 · 토스 계정 정보는 받지 않아요. 기기마다 만들어지는 익명 번호로만 기록을 구분해요.";

export const PRIVACY_ARTICLES: readonly LegalArticle[] = [
  { no: "ARTICLE 01", title: "수집하는 정보", body: "익명 기기 번호, 고른 음악 목록, 추천에 남긴 스탬프" },
  { no: "ARTICLE 02", title: "이용 목적", body: "취향 분석과 추천, 지난 이슈 보관" },
  {
    no: "ARTICLE 03",
    title: "외부 처리",
    body:
      "취향 분석을 위해 고른 음악 정보가 AI 모델 제공사(OpenAI 또는 Anthropic)로 전송돼요. 음악 검색어는 사용자 기기에서 Apple(iTunes Search)로 직접 전송돼요. 개인을 알아볼 수 있는 정보는 함께 보내지 않아요.",
  },
  { no: "ARTICLE 04", title: "보관과 삭제", body: "아카이브 › 기록 관리에서 언제든 모든 기록을 지울 수 있어요." },
  { no: "ARTICLE 05", title: "문의", body: "토스 상단 ⋯ 메뉴의 고객센터로 문의해 주세요." },
] as const;

/** 기능명세서 2.18절: 와이어프레임에 없는 요소지만 팀 표기 위에 추가해야 하는 TMDB 고지. */
export const TMDB_NOTICE =
  "This product uses the TMDB API but is not endorsed or certified by TMDB.";
