/**
 * SCR-DETAIL · 추천 상세
 * 와이어프레임: docs/취향번역기_와이어프레임/06 RECOMMENDATION DETAIL — ARTICLE/BOOK/TRAVEL/PERFUME.png
 */
import { useEffect, useState } from "react";
import { MainButton } from "../components/MainButton";
import { FallbackArt } from "../components/FallbackArt";
import { useNavigation, useScreenParams } from "../navigation/ScreenStack";
import { ScreenId } from "../navigation/types";
import { fetchRecommendationDetail } from "../api/recommendations";
import type { RecommendationDetailResponse } from "../types/api";
import { CATEGORY_DEFINITIONS } from "../constants/categories";
import "./DetailScreen.css";

export function DetailScreen() {
  const { rec_id, issue_id, category } = useScreenParams<typeof ScreenId.Detail>();
  const { push } = useNavigation();

  const [detail, setDetail] = useState<RecommendationDetailResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchRecommendationDetail(rec_id);
      if (!cancelled) setDetail(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [rec_id]);

  if (!detail) {
    return <div className="detail-container" />;
  }

  const categoryDef = CATEGORY_DEFINITIONS.find((c) => c.value === category)!;

  return (
    <div className="detail-container">
      <div className="detail-scroll">
        <div className="detail-image">
          {detail.image_url ? <img src={detail.image_url} alt={detail.title} /> : <FallbackArt category={category} />}
        </div>

        <div className="detail-body">
          <p className="detail-label">
            {categoryDef.detailLabel} / TASTE NOTE {String(detail.rank).padStart(2, "0")}
          </p>
          <h1 className="detail-title">{detail.title}</h1>
          <p className="detail-meta">{detail.meta}</p>
          {detail.description ? <p className="detail-description">{detail.description}</p> : null}

          <div className="detail-divider" />

          <p className="detail-mappings-label">WHY IT MATCHES YOUR TASTE</p>
          <div className="detail-mappings-head">
            <span>YOUR MUSIC</span>
            <span>{categoryDef.mappingTargetLabel}</span>
          </div>
          <div className="detail-mappings-list">
            {detail.mappings.map((mapping, i) => (
              <div className="detail-mapping-row" key={i}>
                <span className="detail-mapping-music">{mapping.music}</span>
                <span className="detail-mapping-arrow" aria-hidden="true">
                  →
                </span>
                <span className="detail-mapping-target">{mapping.target}</span>
              </div>
            ))}
          </div>

          <p className="detail-evidence">{detail.evidence}</p>
        </div>
      </div>

      <div className="detail-footer">
        <MainButton onClick={() => push(ScreenId.Feedback, { rec_id, issue_id, category })}>
          이 번역에 답해주기
        </MainButton>
      </div>
    </div>
  );
}
