/**
 * Konversi koordinat geografis ke petak (tile) skema Web Mercator, dipakai untuk
 * menempatkan citra radar RainViewer di atas peta.
 *
 * Semua fungsi di sini murni sehingga dapat diuji tanpa merender peta.
 */

export const RAIN_VIEWER_TILE_HOST = 'https://tilecache.rainviewer.com';
export const RAIN_RADAR_ZOOM = 7;

export const CENTRAL_JAVA_RADAR_BOUNDS = {
  west: 108,
  east: 112.2,
  north: -5.4,
  south: -8.6,
} as const;

export interface RadarTile {
  x: number;
  y: number;
  zoom: number;
}

export interface RainViewerFrame {
  time: number;
  path: string;
}

export function longitudeToTileX(longitude: number, zoom: number): number {
  return Math.floor(((longitude + 180) / 360) * (2 ** zoom));
}

export function latitudeToTileY(latitude: number, zoom: number): number {
  const latitudeRadians = latitude * Math.PI / 180;
  return Math.floor(
    ((1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2) * (2 ** zoom),
  );
}

export function tileXToLongitude(x: number, zoom: number): number {
  return (x / (2 ** zoom)) * 360 - 180;
}

export function tileYToLatitude(y: number, zoom: number): number {
  const mercatorY = Math.PI * (1 - (2 * y) / (2 ** zoom));
  return Math.atan(Math.sinh(mercatorY)) * 180 / Math.PI;
}

/** Seluruh petak radar yang menutupi kotak batas Jawa Tengah. */
export function createRadarTiles(): RadarTile[] {
  const firstX = longitudeToTileX(CENTRAL_JAVA_RADAR_BOUNDS.west, RAIN_RADAR_ZOOM);
  const lastX = longitudeToTileX(CENTRAL_JAVA_RADAR_BOUNDS.east, RAIN_RADAR_ZOOM);
  const firstY = latitudeToTileY(CENTRAL_JAVA_RADAR_BOUNDS.north, RAIN_RADAR_ZOOM);
  const lastY = latitudeToTileY(CENTRAL_JAVA_RADAR_BOUNDS.south, RAIN_RADAR_ZOOM);
  const tiles: RadarTile[] = [];

  for (let x = firstX; x <= lastX; x += 1) {
    for (let y = firstY; y <= lastY; y += 1) {
      tiles.push({ x, y, zoom: RAIN_RADAR_ZOOM });
    }
  }

  return tiles;
}

export const CENTRAL_JAVA_RADAR_TILES = createRadarTiles();
