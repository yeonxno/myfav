import "./TasteTag.css";

/** 취향 태그 칩. 기능명세서 1.6.3절(#키워드, 첫 번째는 민트 강조). */
export function TasteTag({ label, emphasized = false }: { label: string; emphasized?: boolean }) {
  return (
    <span className={["taste-tag", emphasized ? "taste-tag-emphasized" : ""].join(" ")}>
      #{label}
    </span>
  );
}

export function TasteTagList({ tags }: { tags: string[] }) {
  return (
    <div className="taste-tag-list">
      {tags.map((tag, index) => (
        <TasteTag key={tag} label={tag} emphasized={index === 0} />
      ))}
    </div>
  );
}
