interface CategoryChipsProps {
  categories: string[];
  value?: string;
  onSelect: (category: string) => void;
}

const CategoryChips = ({ categories, value, onSelect }: CategoryChipsProps) => (
  <div className="flex flex-wrap gap-2" role="group" aria-label="Categorías">
    {categories.map((category) => {
      const active = category === value;
      return (
        <button
          key={category}
          type="button"
          onClick={() => onSelect(category)}
          className={`rounded-full border px-3 py-1 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
            active
              ? 'border-brand bg-brand/20 text-brand'
              : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-brand/60'
          }`}
        >
          {category}
        </button>
      );
    })}
  </div>
);

export default CategoryChips;
