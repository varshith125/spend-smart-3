export const expenseCategories = [
  { name: 'Food & Dining', emoji: '🍔', color: '#34d399', bgClass: 'bg-emerald-400/20', textClass: 'text-emerald-400', borderClass: 'border-emerald-400/40' },
  { name: 'Transport', emoji: '🚗', color: '#60a5fa', bgClass: 'bg-blue-400/20', textClass: 'text-blue-400', borderClass: 'border-blue-400/40' },
  { name: 'Entertainment', emoji: '🎮', color: '#a78bfa', bgClass: 'bg-violet-400/20', textClass: 'text-violet-400', borderClass: 'border-violet-400/40' },
  { name: 'Shopping', emoji: '🛒', color: '#fbbf24', bgClass: 'bg-amber-400/20', textClass: 'text-amber-400', borderClass: 'border-amber-400/40' },
  { name: 'Health', emoji: '💊', color: '#f87171', bgClass: 'bg-red-400/20', textClass: 'text-red-400', borderClass: 'border-red-400/40' },
  { name: 'Education', emoji: '📚', color: '#2dd4bf', bgClass: 'bg-teal-400/20', textClass: 'text-teal-400', borderClass: 'border-teal-400/40' },
  { name: 'Housing', emoji: '🏠', color: '#fb923c', bgClass: 'bg-orange-400/20', textClass: 'text-orange-400', borderClass: 'border-orange-400/40' },
  { name: 'Utilities', emoji: '⚡', color: '#facc15', bgClass: 'bg-yellow-400/20', textClass: 'text-yellow-400', borderClass: 'border-yellow-400/40' },
  { name: 'Savings', emoji: '🐷', color: '#10b981', bgClass: 'bg-emerald-400/20', textClass: 'text-emerald-400', borderClass: 'border-emerald-400/40' },
];

export const incomeCategories = [
  { name: 'Salary', emoji: '🏢', color: '#10b981', bgClass: 'bg-emerald-500/20', textClass: 'text-emerald-500', borderClass: 'border-emerald-500/40' },
  { name: 'Bonus', emoji: '🎉', color: '#8b5cf6', bgClass: 'bg-purple-500/20', textClass: 'text-purple-500', borderClass: 'border-purple-500/40' },
  { name: 'Gift', emoji: '🎁', color: '#ec4899', bgClass: 'bg-pink-500/20', textClass: 'text-pink-500', borderClass: 'border-pink-500/40' },
  { name: 'Other', emoji: '💵', color: '#06b6d4', bgClass: 'bg-cyan-500/20', textClass: 'text-cyan-500', borderClass: 'border-cyan-500/40' },
];

export const categories = [...expenseCategories, ...incomeCategories];

export function getCategoryInfo(categoryName) {
  return categories.find((c) => c.name === categoryName) || categories[0];
}

export function getCategoryColor(categoryName) {
  const cat = getCategoryInfo(categoryName);
  return cat.color;
}

export const chartColors = categories.map((c) => c.color);
