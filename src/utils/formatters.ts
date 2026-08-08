// Utility Formatters — Sistem Telemetering PLTA

/**
 * Format number with dot as thousands separator (Indonesian format)
 * e.g. 142300 → "142.300"
 */
export function formatNumber(n: number | undefined | null, decimals = 0): string {
  if (n === undefined || n === null) return '-';
  const parts = n.toFixed(decimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decimals > 0 ? parts[0] + ',' + parts[1] : parts[0];
}

/**
 * Format number for metric display with appropriate precision
 * e.g. 223.10 → "223,10"
 */
export function formatMetric(n: number | undefined | null, decimals = 2): string {
  if (n === undefined || n === null) return '-';
  return n.toFixed(decimals).replace('.', ',');
}
