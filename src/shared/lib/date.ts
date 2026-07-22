import { TZDate } from '@date-fns/tz';

export const WIB_TIME_ZONE = 'Asia/Jakarta';

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
] as const;

const LONG_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const;

const DAYS = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
] as const;

type DateValue = Date | string | number;

function toDate(value: DateValue): Date {
  return value instanceof Date ? value : new Date(value);
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

export function toWIBDate(value: DateValue = new Date()): TZDate {
  return new TZDate(toDate(value).getTime(), WIB_TIME_ZONE);
}

export function getWIBFormDateTime(value: DateValue = new Date()) {
  const date = toWIBDate(value);

  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

export function formatWIBFull(value: DateValue): string {
  const date = toWIBDate(value);
  return `${DAYS[date.getDay()]}, ${date.getDate()} ${LONG_MONTHS[date.getMonth()]} ${date.getFullYear()} · ${pad(date.getHours())}:${pad(date.getMinutes())} WIB`;
}

export function formatDateWIB(value: DateValue): string {
  const date = toWIBDate(value);
  return `${pad(date.getDate())} ${SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())} WIB`;
}

export function formatTimeWIB(value: DateValue): string {
  const date = toWIBDate(value);
  return `${pad(date.getHours())}:${pad(date.getMinutes())} WIB`;
}

export function formatWIBClock(value: DateValue): string {
  const date = toWIBDate(value);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatShortDateWIB(value: DateValue): string {
  const date = toWIBDate(value);
  return `${pad(date.getDate())} ${SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function getWIBHour(value: DateValue = new Date()): number {
  return toWIBDate(value).getHours();
}
