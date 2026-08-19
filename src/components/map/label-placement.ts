import type { Geometry, Position } from 'geojson';

/**
 * Penempatan label wilayah pada peta.
 *
 * Label diletakkan di centroid cincin terluar terbesar sebuah poligon, sehingga
 * kabupaten yang terdiri dari beberapa pulau tetap mendapat label pada daratan
 * utamanya, bukan di titik tengah gabungan yang bisa jatuh di laut.
 *
 * Fungsi di sini murni sehingga dapat diuji tanpa merender peta.
 */

/** Dua kali luas bertanda sebuah cincin (rumus shoelace). */
export function getRingArea2(ring: Position[]): number {
  let area2 = 0;

  for (let index = 0; index < ring.length - 1; index += 1) {
    const current = ring[index];
    const next = ring[index + 1];
    area2 += current[0] * next[1] - next[0] * current[1];
  }

  return area2;
}

export function getLabelCoordinate(geometry: Geometry): [number, number] | null {
  const outerRings = geometry.type === 'Polygon'
    ? geometry.coordinates.slice(0, 1)
    : geometry.type === 'MultiPolygon'
      ? geometry.coordinates.map((polygon) => polygon[0])
      : [];
  const ring = outerRings.reduce<Position[] | null>((largest, candidate) => {
    if (!candidate?.length) return largest;
    if (!largest) return candidate;
    return Math.abs(getRingArea2(candidate)) > Math.abs(getRingArea2(largest))
      ? candidate
      : largest;
  }, null);

  if (!ring?.length) return null;

  const area2 = getRingArea2(ring);
  // Cincin degenerate (luas nol) tidak punya centroid; pakai rata-rata titik.
  if (Math.abs(area2) < Number.EPSILON) {
    const longitude = ring.reduce((sum, point) => sum + point[0], 0) / ring.length;
    const latitude = ring.reduce((sum, point) => sum + point[1], 0) / ring.length;
    return [longitude, latitude];
  }

  let longitudeSum = 0;
  let latitudeSum = 0;

  for (let index = 0; index < ring.length - 1; index += 1) {
    const current = ring[index];
    const next = ring[index + 1];
    const crossProduct = current[0] * next[1] - next[0] * current[1];
    longitudeSum += (current[0] + next[0]) * crossProduct;
    latitudeSum += (current[1] + next[1]) * crossProduct;
  }

  return [longitudeSum / (3 * area2), latitudeSum / (3 * area2)];
}
