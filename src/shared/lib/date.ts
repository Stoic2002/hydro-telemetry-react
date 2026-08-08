import { TZDate } from '@date-fns/tz';

const WIB_TIME_ZONE = 'Asia/Jakarta';

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
] as const;

type DateValue = Date | string | number;

function toDate(value: DateValue): Date {
  return value instanceof Date ? value : new Date(value);
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function toWIBDate(value: DateValue = new Date()): TZDate {
  return new TZDate(toDate(value).getTime(), WIB_TIME_ZONE);
}

export function formatDateWIB(value: DateValue): string {
  const date = toWIBDate(value);
  return `${pad(date.getDate())} ${SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())} WIB`;
}
