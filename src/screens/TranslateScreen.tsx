/**
 * SCR-TRANSLATE · 분야별 번역
 * 와이어프레임: docs/취향번역기_와이어프레임/05 TASTE TRANSLATION — MOVIE/BOOK/TRAVEL/PERFUME.png
 *
 * 기능명세서 2.8절: 탭 전환은 뒤로가기 단계에 쌓이지 않는다(로컬 상태로만 처리).
 * 분야당 추천 3건 중 1건은 대표 카드, 2건은 "다음 추천" 목록으로 보여준다.
 */
import { useEffect, useState } from "react";
import { ScreenContainer } from "../components/ScreenContainer";
import { CategoryTabs } from "../components/CategoryTabs";
import { FeaturedRecommendationCard, NextRecommendationItem } from "../components/RecommendationCard";
import { useNavigation, useScreenParams } from "../navigation/ScreenStack";
import { ScreenId } from "../navigation/types";
import { fetchRecommendationsByIssue } from "../api/issues";
import type { RecommendationsByCategory } from "../types/api";
import { DEFAULT_CATEGORY, type CategoryValue } from "../constants/categories";
import "./TranslateScreen.css";

export function TranslateScreen() {
  const { issue_id, category } = useScreenParams<typeof ScreenId.Translate>();
  const { push, updateTopParams } = useNavigation();

  const [activeCategory, setActiveCategory] = useState<CategoryValue>(category ?? DEFAULT_CATEGORY);
  const [recommendations, setRecommendations] = useState<RecommendationsByCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchRecommendationsByIssue(issue_id);
        if (!cancelled) setRecommendations(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [issue_id]);

  function changeCategory(next: CategoryValue) {
    setActiveCategory(next);
    updateTopParams<typeof ScreenId.Translate>({ category: next });
  }

  const items = recommendations?.[activeCategory] ?? [];
  const featured = items.find((item) => item.rank === 1) ?? items[0];
  const nextItems = items.filter((item) => item !== featured);

  return (
    <ScreenContainer>
      <p className="translate-eyebrow">YOUR TASTE, TRANSLATED.</p>
      <h1 className="translate-headline">
        이 취향을
        <br />
        다른 세계로 번역하면?
      </h1>

      <div className="translate-tabs">
        <CategoryTabs value={activeCategory} onChange={changeCategory} />
      </div>

      {loading ? null : items.length === 0 ? (
        <p className="translate-empty">이 분야의 번역을 불러오지 못했어요.</p>
      ) : (
        <div className="translate-body">
          {featured ? (
            <FeaturedRecommendationCard
              category={activeCategory}
              imageUrl={featured.image_url}
              title={featured.title}
              matchScore={featured.match_score}
              reason={featured.reason}
              tags={featured.tags}
              onClick={() =>
                push(ScreenId.Detail, { rec_id: featured.rec_id, issue_id, category: activeCategory })
              }
            />
          ) : null}

          {nextItems.length > 0 ? (
            <div className="translate-next-list">
              {nextItems.map((item) => (
                <NextRecommendationItem
                  key={item.rec_id}
                  category={activeCategory}
                  imageUrl={item.image_url}
                  title={item.title}
                  description={item.reason}
                  onClick={() => push(ScreenId.Detail, { rec_id: item.rec_id, issue_id, category: activeCategory })}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </ScreenContainer>
  );
}
