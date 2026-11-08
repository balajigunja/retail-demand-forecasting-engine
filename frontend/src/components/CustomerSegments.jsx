import { Package, Sparkles, Shirt, Laptop, ArrowUpRight } from "lucide-react";

const categories = [
  {
    name: "Beauty",
    description: "Beauty product demand",
    icon: Sparkles,
    color: "cyan",
  },
  {
    name: "Clothing",
    description: "Apparel demand",
    icon: Shirt,
    color: "purple",
  },
  {
    name: "Electronics",
    description: "Electronic product demand",
    icon: Laptop,
    color: "green",
  },
];

export default function CustomerSegments({
  selectedCategory,
  onSelectCategory,
}) {
  return (
    <section className="panel segments-panel" id="categories">
      <div className="section-heading">
        <div>
          <h2>Product categories</h2>
          <p className="muted">Select a category to update the forecast</p>
        </div>
        <Package size={20} className="heading-icon" />
      </div>

      <div className="category-list">
        {categories.map((category) => {
          const Icon = category.icon;
          const selected = selectedCategory === category.name;

          return (
            <button
              key={category.name}
              type="button"
              className={`category-item ${selected ? "selected" : ""}`}
              aria-pressed={selected}
              onClick={() => onSelectCategory(category.name)}
            >
              <span className={`category-icon ${category.color}`}>
                <Icon size={19} />
              </span>

              <span className="category-copy">
                <strong>{category.name}</strong>
                <small>{category.description}</small>
              </span>

              <ArrowUpRight
                size={17}
                className="category-arrow"
              />
            </button>
          );
        })}
      </div>

      <div className="category-note">
        <span className="status-dot" />
        Forecasts update when you select a category.
      </div>
    </section>
  );
}