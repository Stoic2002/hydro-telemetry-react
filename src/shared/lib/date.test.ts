import { describe, expect, it } from 'vitest';
import {
  INVALID_DATE_PLACEHOLDER,
  formatDateWIB,
  formatDayMonthTimeWIB,
  formatDayMonthWIB,
  formatDayMonthYearTimeWIB,
  formatDayMonthYearWIB,
  formatLongCalendarDate,
  formatTimeWIB,
  toISODateWIB,
} from './date';

// 07:37 UTC = 14:37 WIB pada hari yang sama.
const SIANG_UTC = '2026-08-19T07:37:00.000Z';
// 18:30 UTC = 01:30 WIB keesokan harinya.
const MALAM_UTC = '2026-08-19T18:30:00.000Z';

describe('formatter WIB', () => {
  it('menggeser UTC ke waktu Jakarta', () => {
    expect(formatDateWIB(SIANG_UTC)).toBe('19 Agu 2026 14:37 WIB');
    expect(formatDayMonthYearTimeWIB(SIANG_UTC)).toBe('19 Agu 2026 14:37');
    expect(formatDayMonthYearWIB(SIANG_UTC)).toBe('19 Agu 2026');
    expect(formatDayMonthTimeWIB(SIANG_UTC)).toBe('19 Agu 14:37');
    expect(formatDayMonthWIB(SIANG_UTC)).toBe('19 Agu');
    expect(formatTimeWIB(SIANG_UTC)).toBe('14:37');
  });

  it('ikut memindahkan tanggal saat melewati tengah malam WIB', () => {
    expect(formatDateWIB(MALAM_UTC)).toBe('20 Agu 2026 01:30 WIB');
    expect(formatDayMonthWIB(MALAM_UTC)).toBe('20 Agu');
    expect(toISODateWIB(MALAM_UTC)).toBe('2026-08-20');
  });

  it('menampilkan tengah malam sebagai 00:00', () => {
    expect(formatDateWIB('2026-01-31T17:00:00.000Z')).toBe('01 Feb 2026 00:00 WIB');
    expect(formatTimeWIB('2026-01-31T17:00:00.000Z')).toBe('00:00');
  });

  it('menerima Date dan epoch selain string', () => {
    const iso = '2026-12-25T03:05:00.000Z';

    expect(formatDateWIB(new Date(iso))).toBe('25 Des 2026 10:05 WIB');
    expect(formatDateWIB(new Date(iso).getTime())).toBe('25 Des 2026 10:05 WIB');
  });

  it('mengembalikan penanda seragam untuk nilai yang tidak valid', () => {
    for (const format of [
      formatDateWIB,
      formatDayMonthYearTimeWIB,
      formatDayMonthYearWIB,
      formatDayMonthTimeWIB,
      formatDayMonthWIB,
      formatTimeWIB,
      toISODateWIB,
    ]) {
      expect(format('bukan tanggal')).toBe(INVALID_DATE_PLACEHOLDER);
    }
  });
});

describe('toISODateWIB', () => {
  it('menghasilkan tanggal kalender WIB untuk parameter API', () => {
    expect(toISODateWIB(SIANG_UTC)).toBe('2026-08-19');
  });
});

describe('formatLongCalendarDate', () => {
  it('menampilkan nama bulan panjang tanpa menggeser zona waktu', () => {
    expect(formatLongCalendarDate('2026-08-19')).toBe('19 Agustus 2026');
    expect(formatLongCalendarDate('2026-01-01')).toBe('01 Januari 2026');
    expect(formatLongCalendarDate('2026-12-31')).toBe('31 Desember 2026');
  });

  it('menolak format selain YYYY-MM-DD', () => {
    expect(formatLongCalendarDate('19-08-2026')).toBe(INVALID_DATE_PLACEHOLDER);
    expect(formatLongCalendarDate('2026-13-01')).toBe(INVALID_DATE_PLACEHOLDER);
    expect(formatLongCalendarDate('')).toBe(INVALID_DATE_PLACEHOLDER);
  });
});
