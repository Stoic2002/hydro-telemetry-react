import { describe, expect, it } from 'vitest';
import { formatCoordinate, parseCatalogView } from './model';

describe('resource catalog model', () => {
  it.each([
    ['plta', 'plta'],
    ['tags', 'tags'],
    ['ws', 'ws'],
    ['unknown', 'ws'],
    [null, 'ws'],
  ] as const)('normalizes the view query parameter %s', (input, expected) => {
    expect(parseCatalogView(input)).toBe(expected);
  });

  it('formats coordinates consistently while preserving missing values', () => {
    expect(formatCoordinate(-7.3631)).toBe('-7.36310');
    expect(formatCoordinate(null)).toBe('—');
  });
});

