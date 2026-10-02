/**
 * SCR-HOME · 첫 방문 홈
 * 와이어프레임: docs/취향번역기_와이어프레임/01 HOME — COVER.png
 */
import heroCollage from "../assets/hero-collage.png";
import { ScreenContainer } from "../components/ScreenContainer";
import { ScreenHeader } from "../components/ScreenHeader";
import { MainButton } from "../components/MainButton";
import { InfoLinks } from "../components/InfoLinks";
import { useNavigation } from "../navigation/ScreenStack";
import { ScreenId } from "../navigation/types";
import "./HomeScreen.css";

export function HomeScreen() {
  const { push } = useNavigation();

  return (
    <ScreenContainer
      footer={
        <>
          <MainButton onClick={() => push(ScreenId.Input, undefined)}>내 취향 번역하기</MainButton>
          <p className="home-flow-row">
            MUSIC <span aria-hidden="true">→</span> TASTE <span aria-hidden="true">→</span> YOUR WORLD
          </p>
          <p className="home-flow-categories">MOVIE · BOOK · TRAVEL · PERFUME</p>
          <p className="home-helper-text">좋아하는 3곡이면 충분해요. 약 1분 정도 걸려요.</p>
          <InfoLinks />
        </>
      }
    >
      <ScreenHeader
        eyebrow="YOUR MUSIC, ANOTHER WORLD."
        headline={
          <>
            좋아하는 음악을
            <br />
            다른 취향의 언어로.
          </>
        }
        subtext="플레이리스트에서 시작되는 나만의 작은 취향 잡지."
      />

      <div className="home-collage">
        <img src={heroCollage} alt="" />
        <span className="home-collage-bubble">음악 너머의 나를 만나봐!</span>
        <span className="home-collage-caption">a little more like you ↗</span>
      </div>
    </ScreenContainer>
  );
}
