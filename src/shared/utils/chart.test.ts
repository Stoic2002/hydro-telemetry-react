import { describe, expect, it } from 'vitest';
import { chartValueDomain } from './chart';

describe('chartValueDomain', () => {
  it('memberi rentang aman saat tidak ada nilai', () => {
    expect(chartValueDomain([])).toEqual([0, 1]);
    expect(chartValueDomain([Number.NaN, Number.POSITIVE_INFINITY])).toEqual([0, 1]);
  });

  it('tidak memaku dasar sumbu di nol untuk nilai yang jauh di atas nol', () => {
    const [minimum, maximum] = chartValueDomain([45, 52, 62]);

    expect(minimum).toBeGreaterThan(40);
    expect(maximum).toBeGreaterThan(62);
    // Data harus mengisi sebagian besar tinggi grafik, bukan terjepit di atas.
    expect((62 - 45) / (maximum - minimum)).toBeGreaterThan(0.7);
  });

  it('menaruh garis datar di tengah dengan jendela yang proporsional', () => {
    const [minimum, maximum] = chartValueDomain([231.5, 231.5]);

    expect(minimum).toBeLessThan(231.5);
    expect(maximum).toBeGreaterThan(231.5);
    // Jendela tetap kecil relatif terhadap nilainya, dan nilainya di tengah.
    expect(maximum - minimum).toBeLessThan(231.5 * 0.1);
    expect((minimum + maximum) / 2).toBeCloseTo(231.5, 5);
  });

  it('menjaga rentang nyaris datar tetap mengisi tinggi grafik', () => {
    const [minimum, maximum] = chartValueDomain([231.0, 231.6, 232.0]);

    expect((232 - 231) / (maximum - minimum)).toBeGreaterThan(0.7);
  });

  it('tidak menurunkan dasar sumbu di bawah nol untuk data non-negatif', () => {
    expect(chartValueDomain([0, 4, 10])[0]).toBe(0);
  });

  it('mengizinkan dasar negatif kalau datanya memang negatif', () => {
    expect(chartValueDomain([-8, -2])[0]).toBeLessThan(-8);
  });
});
