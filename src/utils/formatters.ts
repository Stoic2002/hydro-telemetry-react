// Utility Formatters — Sistem Telemetering PLTA

import {
  formatDateWIB as formatDateInWIB,
  formatShortDateWIB,
  formatTimeWIB as formatTimeInWIB,
  getWIBHour,
} from '../shared/lib/date';

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

/**
 * Format date to Indonesian format: DD MMM YYYY HH:mm WIB
 */
export function formatDateWIB(date: Date | string): string {
  return formatDateInWIB(date);
}

/**
 * Format time only: HH:mm WIB
 */
export function formatTimeWIB(date: Date | string): string {
  return formatTimeInWIB(date);
}

/**
 * Format short date: DD MMM YYYY
 */
export function formatShortDate(date: Date | string): string {
  return formatShortDateWIB(date);
}

/**
 * Format delta value with sign and color class
 * Returns { text: "+12,3", className: "positive" | "negative" | "neutral" }
 */
export function formatDelta(value: number | undefined | null, decimals = 1): { text: string; className: string } {
  if (value === undefined || value === null) return { text: '-', className: 'neutral' };
  const sign = value > 0 ? '+' : '';
  const text = `${sign}${value.toFixed(decimals).replace('.', ',')}`;
  const className = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
  return { text, className };
}

/**
 * Format value with unit
 * e.g. formatUnit(223.10, "mdpl") → "223,10 mdpl"
 */
export function formatUnit(value: number, unit: string, decimals = 2): string {
  return `${formatMetric(value, decimals)} ${unit}`;
}

/**
 * Get greeting based on current hour
 */
export function getGreeting(): string {
  const hour = getWIBHour();
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

/**
 * Get status badge CSS class
 */
export function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    'Aman': 'badge-aman',
    'Siaga 1': 'badge-siaga1',
    'Siaga 2': 'badge-siaga2',
    'Kritis': 'badge-kritis',
    'Offline': 'badge-offline',
  };
  return map[status] || 'badge-offline';
}

/**
 * Get status color CSS variable
 */
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    'Aman': 'var(--color-status-aman)',
    'Siaga 1': 'var(--color-status-siaga1)',
    'Siaga 2': 'var(--color-status-siaga2)',
    'Kritis': 'var(--color-status-kritis)',
    'Offline': 'var(--color-status-offline)',
  };
  return map[status] || 'var(--color-status-offline)';
}

/**
 * Generate a relative time string (e.g., "5 menit lalu")
 */
export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff} detik lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}
