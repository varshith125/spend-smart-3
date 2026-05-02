/**
 * Format a number as Indian Rupee with Indian number system grouping.
 * e.g., 120000 → "₹1,20,000"
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';

  const num = Number(amount);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Use Indian locale for proper grouping
  const formatted = absNum.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

  return `${isNegative ? '-' : ''}₹${formatted}`;
}

/**
 * Format a compact version for large numbers.
 * e.g., 150000 → "₹1.5L"
 */
export function formatCurrencyCompact(amount) {
  if (!amount) return '₹0';
  const num = Number(amount);

  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return formatCurrency(num);
}
