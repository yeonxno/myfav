/**
 * SCR-ABOUT · 서비스 소개
 * 와이어프레임: docs/취향번역기_와이어프레임/11-1 ABOUT — SERVICE.png
 *
 * 기능명세서 2.18절: TMDB 로고·고지 문구는 와이어프레임에 없는 요소지만 팀 표기 위에 추가한다.
 * 확인 필요: 실제 TMDB 로고 이미지 에셋이 없어 문구만 표기했다. 로고 이미지가 오면 교체한다.
 */
import heroCollage from "../assets/hero-collage.png";
import { ScreenContainer } from "../components/ScreenContainer";
import { ScreenHeader } from "../components/ScreenHeader";
import { TEAM_NAME_PLACEHOLDER, TMDB_NOTICE } from "../constants/legal";
import "./AboutScreen.css";

const HOW_IT_WORKS = [
  { step: "01", label: "좋아하는 음악 3–5곡 고르기" },
  { step: "02", label: "8개의 감각으로 취향 읽기" },
  { step: "03", label: "영화 · 책 · 여행 · 향수로 번역" },
] as const;

export function AboutScreen() {
  return (
    <ScreenContainer>
      <ScreenHeader
        eyebrow="ABOUT THIS MAGAZINE"
        headline="음악에서 발견한 나를, 다른 세계의 언어로."
        subtext={
          <>
            좋아하는 음악 몇 곡으로 만드는
            <br />
            나만의 작은 취향 잡지예요.
          </>
        }
      />

      <div className="about-collage">
        <img src={heroCollage} alt="" />
      </div>

      <p className="about-section-title">HOW IT WORKS</p>
      <ul className="about-steps">
        {HOW_IT_WORKS.map((item) => (
          <li key={item.step} className="about-step">
            <span className="about-step-no">{item.step}</span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>

      <div className="about-ai-note">
        <p className="about-ai-note-label">A NOTE ON AI</p>
        <p className="about-ai-note-text">
          추천 이유와 취향 이름은 AI가 쓴 문장이에요.
          <br />
          실제 작품과 다를 수 있어요.
        </p>
      </div>

      <div className="about-tmdb-notice">
        <span className="about-tmdb-wordmark" aria-hidden="true">
          TMDB
        </span>
        <p>{TMDB_NOTICE}</p>
      </div>

      <div className="about-footer-row">
        <span>MADE BY {TEAM_NAME_PLACEHOLDER}</span>
      </div>
    </ScreenContainer>
  );
}
