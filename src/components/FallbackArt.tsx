import type { CategoryValue } from "../constants/categories";
import "./FallbackArt.css";

/**
 * 추천 이미지가 없을 때 쓰는 분야별 기본 일러스트.
 * 주의(확인 필요): 실제 일러스트 에셋이 아직 없어 임시 플레이스홀더로 대체했다.
 * 팀이 분야별 기본 일러스트 파일을 전달하면 이 컴포넌트만 교체하면 된다.
 */
const CATEGORY_GLYPH: Record<CategoryValue, string> = {
  movie: "🎬",
  book: "📖",
  travel: "🧭",
  perfume: "🧴",
};

export function FallbackArt({ category, className }: { category: CategoryValue; className?: string }) {
  return (
    <div className={["fallback-art", className].filter(Boolean).join(" ")}>
      <span aria-hidden="true">{CATEGORY_GLYPH[category]}</span>
    </div>
  );
}
