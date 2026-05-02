import { getCategoryInfo } from '../utils/categoryColors';

export default function CategoryBadge({ category, selected, onClick, size = 'md' }) {
  const cat = getCategoryInfo(category);

  const sizeClasses = size === 'sm' 
    ? 'px-3 py-1.5 text-xs gap-1.5' 
    : 'px-4 py-2.5 text-sm gap-2';

  return (
    <button
      type="button"
      onClick={() => onClick?.(category)}
      className={`inline-flex items-center rounded-full font-medium transition-all duration-200 border ${sizeClasses} ${
        selected
          ? `${cat.bgClass} ${cat.textClass} ${cat.borderClass} shadow-lg`
          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20'
      }`}
    >
      <span>{cat.emoji}</span>
      <span>{category}</span>
    </button>
  );
}
