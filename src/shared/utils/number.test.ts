import { describe, expect, it } from 'vitest';
import { formatMetric, formatNumber } from './number';

describe('Indonesian number formatters', () => {
  it('formats thousands and decimal separators', () => {
    expect(formatNumber(142_300)).toBe('142.300');
    expect(formatNumber(1_234.5, 2)).toBe('1.234,50');
  });

  it('keeps a fixed precision for dashboard metrics', () => {
    expect(formatMetric(223.1)).toBe('223,10');
    expect(formatMetric(0, 1)).toBe('0,0');
  });

  it.each([null, undefined, Number.NaN, Number.POSITIVE_INFINITY])(
    'returns a dash for an unavailable value: %s',
    (value) => {
      expect(formatNumber(value)).toBe('-');
      expect(formatMetric(value)).toBe('-');
    },
  );
});

