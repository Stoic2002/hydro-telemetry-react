import { useQuery } from '@tanstack/react-query';
import type {
  FeatureCollection,
  Geometry,
  GeoJsonProperties,
  LineString,
} from 'geojson';
import { env } from '../../shared/lib/env';
import type { RainViewerFrame } from './radar-tiles';

/**
 * Pemuatan aset peta dan bingkai radar lewat TanStack Query.
 *
 * Sebelumnya keduanya memakai `useEffect` + `fetch` manual dengan state loading,
 * error, dan interval refresh yang ditulis sendiri, sehingga perilaku cache dan
 * retry-nya berbeda dari seluruh bagian aplikasi lain.
 */

/**
 * Berkas peta memakai ekstensi `.json`, bukan `.geojson`.
 *
 * Server statis memetakan `.geojson` ke `application/geo+json`, dan tipe itu
 * tidak lolos filter kompresi milik `vite preview` maupun default `gzip_types`
 * nginx. Isinya JSON biasa, jadi ekstensi `.json` membuat ketiganya terkompresi
 * dan menghemat ratusan kilobyte pada halaman Overview.
 */
const MAP_LAYER_URLS = {
  regencies: '/central-java-regencies.json',
  rivers: '/central-java-rivers.json',
} as const;

/** Batas wilayah adalah aset statis; muat sekali per sesi. */
const MAP_LAYER_STALE_TIME = Infinity;
const RADAR_REFRESH_MS = 10 * 60 * 1_000;

export interface RiverProperties {
  hyrivId: number;
  nextDown: number;
  mainRiver: number;
  lengthKm: number;
  catchmentKm2: number;
  upstreamKm2: number;
  averageDischargeM3s: number;
  strahlerOrder: number;
  flowOrder: number;
}

export interface MapLayers {
  regencies: FeatureCollection<Geometry, GeoJsonProperties>;
  rivers: FeatureCollection<LineString, RiverProperties>;
}

interface RainViewerWeatherMaps {
  radar?: {
    past?: RainViewerFrame[];
  };
}

export const mapQueryKeys = {
  all: ['map'] as const,
  layers: () => [...mapQueryKeys.all, 'layers'] as const,
  radarFrame: () => [...mapQueryKeys.all, 'radar-frame'] as const,
};

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('Gagal memuat data peta');

  return response.json() as Promise<T>;
}

async function fetchMapLayers(signal: AbortSignal): Promise<MapLayers> {
  const [regencies, rivers] = await Promise.all([
    fetchJson<MapLayers['regencies']>(MAP_LAYER_URLS.regencies, signal),
    fetchJson<MapLayers['rivers']>(MAP_LAYER_URLS.rivers, signal),
  ]);

  return { regencies, rivers };
}

export function useMapLayersQuery() {
  return useQuery({
    queryKey: mapQueryKeys.layers(),
    queryFn: ({ signal }) => fetchMapLayers(signal),
    staleTime: MAP_LAYER_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

async function fetchLatestRadarFrame(
  endpoint: string,
  signal: AbortSignal,
): Promise<RainViewerFrame> {
  const response = await fetch(endpoint, { signal, cache: 'no-store' });
  if (!response.ok) throw new Error('Radar presipitasi tidak tersedia');

  const weatherMaps = await response.json() as RainViewerWeatherMaps;
  const latestFrame = weatherMaps.radar?.past?.at(-1);

  // Path bingkai ikut disusun menjadi URL citra, jadi bentuknya diperiksa dulu.
  if (!latestFrame || !/^\/v2\/radar\/[a-f0-9]+$/.test(latestFrame.path)) {
    throw new Error('Data radar presipitasi tidak valid');
  }

  return latestFrame;
}

/**
 * Bingkai radar terbaru. Query dimatikan bila overlay tidak diminta atau bila
 * sumber radar sengaja dikosongkan untuk jaringan tanpa akses internet.
 */
export function useRainRadarFrameQuery(enabled: boolean) {
  const endpoint = env.rainviewerApiUrl;

  return useQuery({
    queryKey: mapQueryKeys.radarFrame(),
    queryFn: ({ signal }) => fetchLatestRadarFrame(endpoint ?? '', signal),
    enabled: enabled && Boolean(endpoint),
    staleTime: RADAR_REFRESH_MS,
    refetchInterval: RADAR_REFRESH_MS,
    refetchOnWindowFocus: false,
  });
}
