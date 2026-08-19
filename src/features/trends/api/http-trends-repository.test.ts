import { describe, expect, it } from 'vitest';
import { isPlausibleReading } from './http-trends-repository';

describe('isPlausibleReading', () => {
  it('menerima pembacaan hidrologi yang wajar', () => {
    // Nilai nyata dari deret inflow PLTA Soedirman.
    for (const value of [0, 2.376288906420168, 25.910726581831568, 74.4332630683487]) {
      expect(isPlausibleReading(value)).toBe(true);
    }
  });

  it('menolak nilai hasil perhitungan server yang meledak', () => {
    for (const value of [5.030894426417129e23, 1.508223614529355e28, 7.381646136592233e37]) {
      expect(isPlausibleReading(value)).toBe(false);
    }
  });

  it('menolak nilai yang bukan angka terhingga', () => {
    expect(isPlausibleReading(Number.NaN)).toBe(false);
    expect(isPlausibleReading(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isPlausibleReading(Number.NEGATIVE_INFINITY)).toBe(false);
  });

  it('masih menerima lonjakan besar yang secara fisik mungkin', () => {
    // Banjir ekstrem sekalipun jauh di bawah ambang; ambang ini menjaring
    // kerusakan numerik, bukan membatasi rentang hidrologi.
    expect(isPlausibleReading(200_000)).toBe(true);
    expect(isPlausibleReading(-1_500)).toBe(true);
  });
});
