/**
 * Format a number using Indonesian separators.
 *
 * Invalid or missing values are rendered as a dash so dashboard components do
 * not need to repeat defensive checks.
 */
export function formatNumber(
  value: number | null | undefined,
  decimals = 0,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';

  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Format a dashboard metric with a fixed number of decimal places. */
export function formatMetric(
  value: number | null | undefined,
  decimals = 2,
): string {
  return formatNumber(value, decimals);
}

