import { describe, expect, it } from 'vitest';
import { alignTrendRange } from './model';

const HOUR_MS = 60 * 60 * 1_000;
const DAY_MS = 24 * HOUR_MS;

describe('alignTrendRange', () => {
  it('membulatkan batas atas ke jam penuh pada resolusi 1h', () => {
    const range = alignTrendRange(
      new Date('2026-08-19T14:37:12.483Z'),
      24 * HOUR_MS,
      '1h',
    );

    expect(range.to).toBe('2026-08-19T15:00:00.000Z');
    expect(range.from).toBe('2026-08-18T15:00:00.000Z');
  });

  it('membulatkan batas atas ke hari penuh pada resolusi 1d', () => {
    const range = alignTrendRange(
      new Date('2026-08-19T14:37:12.483Z'),
      30 * DAY_MS,
      '1d',
    );

    expect(range.to).toBe('2026-08-20T00:00:00.000Z');
    expect(range.from).toBe('2026-07-21T00:00:00.000Z');
  });

  it('menghasilkan rentang identik untuk dua render dalam bucket yang sama', () => {
    const first = alignTrendRange(new Date('2026-08-19T14:00:03.000Z'), 24 * HOUR_MS, '1h');
    const second = alignTrendRange(new Date('2026-08-19T14:59:59.999Z'), 24 * HOUR_MS, '1h');

    // Inilah yang membuat query key stabil sehingga cache bisa dipakai ulang.
    expect(second).toEqual(first);
  });

  it('berpindah bucket setelah melewati batas resolusi', () => {
    const before = alignTrendRange(new Date('2026-08-19T14:59:59.999Z'), 24 * HOUR_MS, '1h');
    const after = alignTrendRange(new Date('2026-08-19T15:00:00.001Z'), 24 * HOUR_MS, '1h');

    expect(after.to).not.toBe(before.to);
  });
});
