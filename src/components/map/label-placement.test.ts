import { describe, expect, it } from 'vitest';
import type { Geometry } from 'geojson';
import { getLabelCoordinate, getRingArea2 } from './label-placement';

const unitSquare = [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]];

describe('getRingArea2', () => {
  it('menghitung dua kali luas cincin', () => {
    expect(Math.abs(getRingArea2(unitSquare))).toBe(8);
  });

  it('menghasilkan nol untuk cincin tanpa luas', () => {
    expect(getRingArea2([[0, 0], [1, 1], [0, 0]])).toBe(0);
  });
});

describe('getLabelCoordinate', () => {
  it('menempatkan label di centroid poligon', () => {
    const geometry: Geometry = { type: 'Polygon', coordinates: [unitSquare] };

    expect(getLabelCoordinate(geometry)).toEqual([1, 1]);
  });

  it('memilih pulau terbesar pada MultiPolygon', () => {
    // Kabupaten kepulauan: label harus jatuh di daratan utama, bukan di antara
    // kedua pulau.
    const smallIsland = [[10, 10], [10.2, 10], [10.2, 10.2], [10, 10.2], [10, 10]];
    const geometry: Geometry = {
      type: 'MultiPolygon',
      coordinates: [[smallIsland], [unitSquare]],
    };

    expect(getLabelCoordinate(geometry)).toEqual([1, 1]);
  });

  it('kembali ke rata-rata titik saat cincin tidak punya luas', () => {
    const geometry: Geometry = {
      type: 'Polygon',
      coordinates: [[[0, 0], [4, 4], [0, 0]]],
    };

    expect(getLabelCoordinate(geometry)).toEqual([4 / 3, 4 / 3]);
  });

  it('mengembalikan null untuk geometri tanpa area', () => {
    const geometry: Geometry = {
      type: 'LineString',
      coordinates: [[0, 0], [1, 1]],
    };

    expect(getLabelCoordinate(geometry)).toBeNull();
  });
});
