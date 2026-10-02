import type { CategoryValue } from "../constants/categories";
import { CATEGORY_DEFINITIONS } from "../constants/categories";
import { FallbackArt } from "./FallbackArt";
import { TasteTagList } from "./TasteTag";
import "./RecommendationCard.css";

/** 대표 추천 카드(1건, 큰 카드). 와이어프레임 05 TASTE TRANSLATION — *.png 기준. */
export function FeaturedRecommendationCard({
  category,
  imageUrl,
  title,
  matchScore,
  reason,
  tags,
  onClick,
}: {
  category: CategoryValue;
  imageUrl: string | null;
  title: string;
  matchScore: number;
  reason: string;
  tags: string[];
  onClick: () => void;
}) {
  const categoryDef = CATEGORY_DEFINITIONS.find((c) => c.value === category)!;
  return (
    <div className="featured-rec">
      <button type="button" className="featured-rec-image" onClick={onClick}>
        {imageUrl ? (
          <img src={imageUrl} alt={title} />
        ) : (
          <FallbackArt category={category} />
        )}
      </button>

      <div className="featured-rec-meta-row">
        <p className="featured-rec-translated">TRANSLATED TO : {categoryDef.translatedToLabel}</p>
        <span className="featured-rec-score">취향 연결 {matchScore}%</span>
      </div>

      <button type="button" className="featured-rec-title" onClick={onClick}>
        {title}
      </button>

      <div className="featured-rec-reason">
        <p className="featured-rec-reason-label">WHY IT FEELS LIKE YOU</p>
        <p className="featured-rec-reason-text">{reason}</p>
      </div>

      <TasteTagList tags={tags} />
    </div>
  );
}

/** 다음 추천(ANOTHER PAGE FOR YOU) 목록 아이템. */
export function NextRecommendationItem({
  category,
  imageUrl,
  title,
  description,
  onClick,
}: {
  category: CategoryValue;
  imageUrl: string | null;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="next-rec-item" onClick={onClick}>
      <span className="next-rec-thumb">
        {imageUrl ? <img src={imageUrl} alt={title} /> : <FallbackArt category={category} />}
      </span>
      <span className="next-rec-body">
        <span className="next-rec-label">ANOTHER PAGE FOR YOU</span>
        <span className="next-rec-title-row">
          <span className="next-rec-title">{title}</span>
          <span className="next-rec-arrow" aria-hidden="true">
            →
          </span>
        </span>
        <span className="next-rec-description">{description}</span>
      </span>
    </button>
  );
}
