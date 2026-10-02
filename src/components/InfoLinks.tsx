import { useNavigation } from "../navigation/ScreenStack";
import { ScreenId } from "../navigation/types";
import "./InfoLinks.css";

/** 하단 정보 링크 3종. 기능명세서 2.1·2.2절(서비스 소개/이용 약관/개인정보 처리방침). */
export function InfoLinks() {
  const { push } = useNavigation();
  return (
    <nav className="info-links" aria-label="서비스 정보">
      <button type="button" onClick={() => push(ScreenId.About, undefined)}>
        서비스 소개
      </button>
      <span aria-hidden="true">·</span>
      <button type="button" onClick={() => push(ScreenId.Terms, undefined)}>
        이용 약관
      </button>
      <span aria-hidden="true">·</span>
      <button type="button" onClick={() => push(ScreenId.Privacy, undefined)}>
        개인정보 처리방침
      </button>
    </nav>
  );
}
