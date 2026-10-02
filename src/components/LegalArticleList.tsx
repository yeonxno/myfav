import type { LegalArticle } from "../constants/legal";
import "./LegalArticleList.css";

export function LegalArticleList({ articles }: { articles: readonly LegalArticle[] }) {
  return (
    <div className="legal-article-list">
      {articles.map((article) => (
        <div className="legal-article" key={article.no}>
          <p className="legal-article-no">{article.no}</p>
          <h2 className="legal-article-title">{article.title}</h2>
          <p className="legal-article-body">{article.body}</p>
        </div>
      ))}
    </div>
  );
}
