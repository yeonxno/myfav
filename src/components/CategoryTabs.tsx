import { CATEGORY_DEFINITIONS, type CategoryValue } from "../constants/categories";
import "./CategoryTabs.css";

export function CategoryTabs({
  value,
  onChange,
}: {
  value: CategoryValue;
  onChange: (next: CategoryValue) => void;
}) {
  return (
    <div className="category-tabs" role="tablist">
      {CATEGORY_DEFINITIONS.map((category) => {
        const selected = category.value === value;
        return (
          <button
            key={category.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={["category-tab", selected ? "category-tab-selected" : ""].join(" ")}
            onClick={() => onChange(category.value)}
          >
            {category.tabLabel}
          </button>
        );
      })}
    </div>
  );
}
