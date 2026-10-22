/**
 * Lightweight formatting helpers shared by the calculator UIs.
 * Using Intl.* is zero-dep and locale-aware.
 */

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const currencyFormatterWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const formatCurrency = (value: number, whole: boolean = false): string => {
  const safe = Number.isFinite(value) ? value : 0;
  return (whole ? currencyFormatterWhole : currencyFormatter).format(safe);
};

export const formatPercent = (value: number, digits: number = 2): string => {
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe.toFixed(digits)}%`;
};

export const formatMonths = (months: number): string => {
  const safe = Math.max(0, Math.round(Number.isFinite(months) ? months : 0));
  if (safe === 0) return '0 months';
  const years = Math.floor(safe / 12);
  const remMonths = safe % 12;
  if (years === 0) return `${safe} mo`;
  if (remMonths === 0) return `${years} yr`;
  return `${years} yr ${remMonths} mo`;
};
