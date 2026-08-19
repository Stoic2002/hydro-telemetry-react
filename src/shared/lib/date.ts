/**
 * Formatter tanggal dan waktu dalam WIB.
 *
 * Seluruh tampilan waktu di dashboard memakai zona Asia/Jakarta. Sebelumnya
 * setiap halaman menyusun `Intl.DateTimeFormat`-nya sendiri, sehingga format
 * yang sama ditulis ulang dengan opsi yang sedikit berbeda dan penanganan
 * tanggal tidak valid yang tidak seragam.
 *
 * Bagian tanggal diambil sebagai angka dengan locale netral, lalu nama bulan
 * disusun dari tabel di bawah. Dengan begitu hasilnya tidak bergantung pada data
 * locale yang tersedia di browser atau runtime test.
 */

const WIB_TIME_ZONE = 'Asia/Jakarta';

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
] as const;

const LONG_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const;

/** Ditampilkan menggantikan tanggal yang tidak dapat dibaca. */
export const INVALID_DATE_PLACEHOLDER = '—';

export type DateValue = Date | string | number;

export interface WIBDateParts {
  day: string;
  /** 1-12. */
  month: number;
  year: number;
  hour: string;
  minute: string;
}

const wibFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: WIB_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function toDate(value: DateValue): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Bagian tanggal dalam WIB, atau null bila nilainya bukan tanggal yang sah. */
export function getWIBDateParts(value: DateValue): WIBDateParts | null {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Map(
    wibFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  );

  return {
    day: parts.get('day') ?? '01',
    month: Number(parts.get('month') ?? '1'),
    year: Number(parts.get('year') ?? '0'),
    // Tengah malam dilaporkan sebagai '24' oleh sebagian runtime pada hour12:false.
    hour: (parts.get('hour') ?? '00').replace(/^24$/, '00'),
    minute: parts.get('minute') ?? '00',
  };
}

/** `19 Agu 2026 14:37 WIB` */
export function formatDateWIB(value: DateValue): string {
  const parts = getWIBDateParts(value);
  if (!parts) return INVALID_DATE_PLACEHOLDER;

  return `${parts.day} ${SHORT_MONTHS[parts.month - 1]} ${parts.year} ${parts.hour}:${parts.minute} WIB`;
}

/** `19 Agu 2026` */
export function formatDayMonthYearWIB(value: DateValue): string {
  const parts = getWIBDateParts(value);
  if (!parts) return INVALID_DATE_PLACEHOLDER;

  return `${parts.day} ${SHORT_MONTHS[parts.month - 1]} ${parts.year}`;
}

/** `19 Agu 2026 14:37` */
export function formatDayMonthYearTimeWIB(value: DateValue): string {
  const parts = getWIBDateParts(value);
  if (!parts) return INVALID_DATE_PLACEHOLDER;

  return `${parts.day} ${SHORT_MONTHS[parts.month - 1]} ${parts.year} ${parts.hour}:${parts.minute}`;
}

/** `19 Agu 14:37` */
export function formatDayMonthTimeWIB(value: DateValue): string {
  const parts = getWIBDateParts(value);
  if (!parts) return INVALID_DATE_PLACEHOLDER;

  return `${parts.day} ${SHORT_MONTHS[parts.month - 1]} ${parts.hour}:${parts.minute}`;
}

/** `19 Agu` */
export function formatDayMonthWIB(value: DateValue): string {
  const parts = getWIBDateParts(value);
  if (!parts) return INVALID_DATE_PLACEHOLDER;

  return `${parts.day} ${SHORT_MONTHS[parts.month - 1]}`;
}

/** `14:37` */
export function formatTimeWIB(value: DateValue): string {
  const parts = getWIBDateParts(value);
  if (!parts) return INVALID_DATE_PLACEHOLDER;

  return `${parts.hour}:${parts.minute}`;
}

/** `2026-08-19`, dipakai sebagai parameter tanggal ke API. */
export function toISODateWIB(value: DateValue = new Date()): string {
  const parts = getWIBDateParts(value);
  if (!parts) return INVALID_DATE_PLACEHOLDER;

  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${parts.day}`;
}

/**
 * `19 Agustus 2026` dari tanggal kalender `YYYY-MM-DD`.
 *
 * Nilai tanggal murni tidak membawa jam, jadi tidak ada konversi zona waktu:
 * mengubahnya ke WIB justru bisa menggeser harinya.
 */
export function formatLongCalendarDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return INVALID_DATE_PLACEHOLDER;

  const [, year, month, day] = match;
  const monthIndex = Number(month) - 1;
  if (monthIndex < 0 || monthIndex > 11) return INVALID_DATE_PLACEHOLDER;

  return `${day} ${LONG_MONTHS[monthIndex]} ${Number(year)}`;
}
