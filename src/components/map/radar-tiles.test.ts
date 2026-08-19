import { describe, expect, it } from 'vitest';
import {
  CENTRAL_JAVA_RADAR_BOUNDS,
  RAIN_RADAR_ZOOM,
  createRadarTiles,
  latitudeToTileY,
  longitudeToTileX,
  tileXToLongitude,
  tileYToLatitude,
} from './radar-tiles';

describe('konversi petak radar', () => {
  it('memetakan meridian dan khatulistiwa ke tengah grid', () => {
    expect(longitudeToTileX(0, 1)).toBe(1);
    expect(latitudeToTileY(0, 1)).toBe(1);
  });

  it('membalik konversi kembali ke sudut barat laut petak', () => {
    const zoom = RAIN_RADAR_ZOOM;
    const x = longitudeToTileX(110.1, zoom);
    const y = latitudeToTileY(-7.42, zoom);

    // Sudut barat laut selalu berada di barat dan utara titik asalnya.
    expect(tileXToLongitude(x, zoom)).toBeLessThanOrEqual(110.1);
    expect(tileXToLongitude(x + 1, zoom)).toBeGreaterThan(110.1);
    expect(tileYToLatitude(y, zoom)).toBeGreaterThanOrEqual(-7.42);
    expect(tileYToLatitude(y + 1, zoom)).toBeLessThan(-7.42);
  });
});

describe('createRadarTiles', () => {
  const tiles = createRadarTiles();

  it('menghasilkan grid yang menutupi seluruh kotak batas Jawa Tengah', () => {
    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles.every((tile) => tile.zoom === RAIN_RADAR_ZOOM)).toBe(true);

    const westEdge = Math.min(...tiles.map((tile) => tileXToLongitude(tile.x, tile.zoom)));
    const eastEdge = Math.max(...tiles.map((tile) => tileXToLongitude(tile.x + 1, tile.zoom)));
    const northEdge = Math.max(...tiles.map((tile) => tileYToLatitude(tile.y, tile.zoom)));
    const southEdge = Math.min(...tiles.map((tile) => tileYToLatitude(tile.y + 1, tile.zoom)));

    expect(westEdge).toBeLessThanOrEqual(CENTRAL_JAVA_RADAR_BOUNDS.west);
    expect(eastEdge).toBeGreaterThanOrEqual(CENTRAL_JAVA_RADAR_BOUNDS.east);
    expect(northEdge).toBeGreaterThanOrEqual(CENTRAL_JAVA_RADAR_BOUNDS.north);
    expect(southEdge).toBeLessThanOrEqual(CENTRAL_JAVA_RADAR_BOUNDS.south);
  });

  it('tidak menghasilkan petak kembar', () => {
    const keys = new Set(tiles.map((tile) => `${tile.zoom}-${tile.x}-${tile.y}`));

    expect(keys.size).toBe(tiles.length);
  });
});
