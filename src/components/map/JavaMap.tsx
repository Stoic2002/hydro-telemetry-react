import { useEffect, useId, useRef, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, useMapContext } from 'react-simple-maps';
import { CloudRain } from 'lucide-react';
import type {
  Feature,
  FeatureCollection,
  Geometry,
  GeoJsonProperties,
  LineString,
  Position,
} from 'geojson';
import { usePlantCatalogQuery } from '../../features/plta/api/queries';
import { getPLTAErrorMessage } from '../../features/plta/error';
import { getPlantDisplayName } from '../../features/plta/presentation';
import { formatMetric } from '../../shared/utils/number';
import MapSkeleton from '../skeletons/MapSkeleton';

interface JavaMapProps {
  onPLTAClick: (pltaId: string) => void;
  showPrecipitation?: boolean;
  projectionConfig?: {
    center?: [number, number];
    rotate?: [number, number, number];
    parallels?: [number, number];
    scale?: number;
  };
  customMarkers?: {
    id: string;
    name: string;
    coordinates: [number, number];
    color: string;
    valueLabel: string;
  }[];
}

// Bounding box centered around Central Java with high scale for a larger view
const DEFAULT_PROJECTION = {
  scale: 22000,
  center: [110.10, -7.42] as [number, number],
};

const MAP_VIEWBOX = { width: 800, height: 600 } as const;

const MAP_LAYER_URLS = {
  province: '/indonesia-provinces.json',
  regencies: '/central-java-regencies.geojson',
  rivers: '/central-java-rivers.geojson',
} as const;

const RAIN_VIEWER_API_URL = 'https://api.rainviewer.com/public/weather-maps.json';
const RAIN_VIEWER_TILE_HOST = 'https://tilecache.rainviewer.com';
const RAIN_RADAR_ZOOM = 7;
const CENTRAL_JAVA_RADAR_BOUNDS = {
  west: 108,
  east: 112.2,
  north: -5.4,
  south: -8.6,
} as const;

interface RainViewerFrame {
  time: number;
  path: string;
}

interface RainViewerWeatherMaps {
  radar?: {
    past?: RainViewerFrame[];
  };
}

interface RadarTile {
  x: number;
  y: number;
  zoom: number;
}

function longitudeToTileX(longitude: number, zoom: number) {
  return Math.floor(((longitude + 180) / 360) * (2 ** zoom));
}

function latitudeToTileY(latitude: number, zoom: number) {
  const latitudeRadians = latitude * Math.PI / 180;
  return Math.floor(
    ((1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2) * (2 ** zoom),
  );
}

function tileXToLongitude(x: number, zoom: number) {
  return (x / (2 ** zoom)) * 360 - 180;
}

function tileYToLatitude(y: number, zoom: number) {
  const mercatorY = Math.PI * (1 - (2 * y) / (2 ** zoom));
  return Math.atan(Math.sinh(mercatorY)) * 180 / Math.PI;
}

function createRadarTiles(): RadarTile[] {
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

const CENTRAL_JAVA_RADAR_TILES = createRadarTiles();

const CITY_LABEL_OFFSETS: Record<string, { x: number; y: number }> = {
  'Kota Magelang': { x: -36, y: 11 },
  'Kota Pekalongan': { x: -4, y: -15 },
  'Kota Salatiga': { x: 13, y: 12 },
  'Kota Semarang': { x: 13, y: -14 },
  'Kota Surakarta': { x: 15, y: -10 },
  'Kota Tegal': { x: -14, y: -13 },
};

function getRingArea2(ring: Position[]) {
  let area2 = 0;

  for (let index = 0; index < ring.length - 1; index += 1) {
    const current = ring[index];
    const next = ring[index + 1];
    area2 += current[0] * next[1] - next[0] * current[1];
  }

  return area2;
}

function getLabelCoordinate(geometry: Geometry): [number, number] | null {
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

interface RiverProperties {
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

interface MapLayers {
  province: FeatureCollection<Geometry, GeoJsonProperties>;
  regencies: FeatureCollection<Geometry, GeoJsonProperties>;
  rivers: FeatureCollection<LineString, RiverProperties>;
}

function CentralJavaClip({ geography }: { geography: Feature<Geometry, GeoJsonProperties> }) {
  const { path } = useMapContext();

  return <path d={path(geography) ?? undefined} />;
}

function RiverLayer({
  geography,
  clipPathId,
}: {
  geography: FeatureCollection<LineString, RiverProperties>;
  clipPathId: string;
}) {
  const { path } = useMapContext();
  const tributaries: FeatureCollection<LineString, RiverProperties> = {
    type: 'FeatureCollection',
    features: geography.features.filter((feature) => feature.properties.strahlerOrder === 4),
  };
  const secondaryRivers: FeatureCollection<LineString, RiverProperties> = {
    type: 'FeatureCollection',
    features: geography.features.filter((feature) => feature.properties.strahlerOrder === 5),
  };
  const primaryRivers: FeatureCollection<LineString, RiverProperties> = {
    type: 'FeatureCollection',
    features: geography.features.filter((feature) => feature.properties.strahlerOrder >= 6),
  };

  return (
    <g
      clipPath={`url(#${clipPathId})`}
      aria-label="Jaringan aliran sungai Jawa Tengah"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      pointerEvents="none"
    >
      <path
        d={path(tributaries) ?? undefined}
        stroke="#38bdf8"
        strokeOpacity={0.68}
        strokeWidth={0.85}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={path(secondaryRivers) ?? undefined}
        stroke="#0284c7"
        strokeOpacity={0.86}
        strokeWidth={1.4}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={path(primaryRivers) ?? undefined}
        stroke="#0369a1"
        strokeWidth={2.1}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

function RegencyLabelLayer({
  geography,
  mapWidth,
}: {
  geography: FeatureCollection<Geometry, GeoJsonProperties>;
  mapWidth: number;
}) {
  const { projection } = useMapContext();
  const responsiveFactor = mapWidth < 480 ? 0.62 : mapWidth < 768 ? 0.78 : 1;
  const fontSize = mapWidth < 480 ? 5.8 : mapWidth < 768 ? 7 : 8.5;

  return (
    <g aria-label="Nama kabupaten dan kota di Jawa Tengah" pointerEvents="none">
      {geography.features.map((feature, index) => {
        const name = String(feature.properties?.namobj || feature.properties?.wadmkk || '').trim();
        if (!name) return null;

        const labelCoordinate = getLabelCoordinate(feature.geometry);
        const centroid = labelCoordinate ? projection(labelCoordinate) : null;
        if (!centroid || !Number.isFinite(centroid[0]) || !Number.isFinite(centroid[1])) return null;
        const [centroidX, centroidY] = centroid;

        const offset = CITY_LABEL_OFFSETS[name];
        const labelX = centroidX + (offset?.x ?? 0) * responsiveFactor;
        const labelY = centroidY + (offset?.y ?? 0) * responsiveFactor;
        const isCity = name.startsWith('Kota ');
        const cityName = isCity ? name.slice(5) : name;

        return (
          <g key={`${name}-${index}`}>
            {offset && (
              <line
                x1={centroidX}
                y1={centroidY}
                x2={labelX}
                y2={labelY}
                stroke="#64748b"
                strokeOpacity={0.72}
                strokeWidth={0.65}
                vectorEffect="non-scaling-stroke"
              />
            )}
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#334155"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontSize={fontSize}
              fontWeight={700}
              letterSpacing={0.08}
              stroke="#ffffff"
              strokeOpacity={0.94}
              strokeWidth={2.5}
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {isCity ? (
                <>
                  <tspan x={labelX} dy={-fontSize * 0.42} fontSize={fontSize * 0.72}>Kota</tspan>
                  <tspan x={labelX} dy={fontSize * 0.92}>{cityName}</tspan>
                </>
              ) : name}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function RainRadarLayer({
  framePath,
  clipPathId,
}: {
  framePath: string;
  clipPathId: string;
}) {
  const { projection } = useMapContext();

  return (
    <g
      clipPath={`url(#${clipPathId})`}
      aria-label="Presipitasi radar terbaru"
      opacity={0.72}
      pointerEvents="none"
    >
      {CENTRAL_JAVA_RADAR_TILES.map((tile) => {
        const northWest = projection([
          tileXToLongitude(tile.x, tile.zoom),
          tileYToLatitude(tile.y, tile.zoom),
        ]);
        const southEast = projection([
          tileXToLongitude(tile.x + 1, tile.zoom),
          tileYToLatitude(tile.y + 1, tile.zoom),
        ]);

        if (!northWest || !southEast) return null;

        const width = southEast[0] - northWest[0];
        const height = southEast[1] - northWest[1];
        const tileUrl = `${RAIN_VIEWER_TILE_HOST}${framePath}/256/${tile.zoom}/${tile.x}/${tile.y}/2/1_1.png`;

        return (
          <image
            key={`${tile.zoom}-${tile.x}-${tile.y}`}
            href={tileUrl}
            x={northWest[0] - 0.5}
            y={northWest[1] - 0.5}
            width={width + 1}
            height={height + 1}
            preserveAspectRatio="none"
          />
        );
      })}
    </g>
  );
}

export default function JavaMap({
  onPLTAClick,
  customMarkers,
  projectionConfig,
  showPrecipitation = false,
}: JavaMapProps) {
  const plantsQuery = usePlantCatalogQuery(!customMarkers);
  const pltaList = plantsQuery.data ?? [];
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mapLayers, setMapLayers] = useState<MapLayers | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapSize, setMapSize] = useState<{ width: number; height: number }>(MAP_VIEWBOX);
  const [radarFrame, setRadarFrame] = useState<RainViewerFrame | null>(null);
  const [radarStatus, setRadarStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [isPrecipitationVisible, setIsPrecipitationVisible] = useState(showPrecipitation);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const clipPathId = `central-java-map-${useId().replace(/:/g, '')}`;
  const isMapReady = Boolean(mapLayers && (customMarkers || !plantsQuery.isPending));

  useEffect(() => {
    const controller = new AbortController();

    const loadLayer = async <T extends object>(url: string): Promise<T> => {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error('Gagal memuat data peta');
      return response.json() as Promise<T>;
    };

    Promise.all([
      loadLayer<MapLayers['province']>(MAP_LAYER_URLS.province),
      loadLayer<MapLayers['regencies']>(MAP_LAYER_URLS.regencies),
      loadLayer<MapLayers['rivers']>(MAP_LAYER_URLS.rivers),
    ])
      .then(([province, regencies, rivers]) => {
        setMapLayers({ province, regencies, rivers });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Gagal memuat data peta');
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!showPrecipitation) return undefined;

    const controller = new AbortController();

    const loadLatestRadar = async () => {
      setRadarStatus((current) => (current === 'ready' ? current : 'loading'));

      try {
        const response = await fetch(RAIN_VIEWER_API_URL, {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Radar presipitasi tidak tersedia');

        const weatherMaps = await response.json() as RainViewerWeatherMaps;
        const latestFrame = weatherMaps.radar?.past?.at(-1);
        if (!latestFrame || !/^\/v2\/radar\/[a-f0-9]+$/.test(latestFrame.path)) {
          throw new Error('Data radar presipitasi tidak valid');
        }

        setRadarFrame(latestFrame);
        setRadarStatus('ready');
      } catch (radarError: unknown) {
        if (radarError instanceof DOMException && radarError.name === 'AbortError') return;
        setRadarStatus('error');
      }
    };

    void loadLatestRadar();
    const refreshInterval = window.setInterval(() => void loadLatestRadar(), 10 * 60 * 1000);

    return () => {
      controller.abort();
      window.clearInterval(refreshInterval);
    };
  }, [showPrecipitation]);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || !isMapReady) return undefined;

    const updateMapSize = ({ width, height }: { width: number; height: number }) => {
      const nextSize = {
        width: Math.max(1, Math.round(width)),
        height: Math.max(1, Math.round(height)),
      };

      setMapSize((current) => (
        current.width === nextSize.width && current.height === nextSize.height
          ? current
          : nextSize
      ));
    };

    updateMapSize(container.getBoundingClientRect());
    const observer = new ResizeObserver(([entry]) => {
      if (entry) updateMapSize(entry.contentRect);
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [isMapReady]);

  const hoveredPLTA = !customMarkers && hoveredId ? pltaList.find((p) => p.id === hoveredId) : null;
  const hoveredCustom = customMarkers && hoveredId ? customMarkers.find((m) => m.id === hoveredId) : null;

  if (error || (!customMarkers && plantsQuery.isError)) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm font-medium text-red-600">
          {error ?? getPLTAErrorMessage(plantsQuery.error)}
        </p>
        {!customMarkers && plantsQuery.isError && (
          <button
            type="button"
            onClick={() => void plantsQuery.refetch()}
            className="cursor-pointer rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            Muat ulang data PLTA
          </button>
        )}
      </div>
    );
  }

  if (!mapLayers || (!customMarkers && plantsQuery.isPending)) return <MapSkeleton />;

  const currentProjection = projectionConfig || DEFAULT_PROJECTION;
  const viewportScale = Math.min(
    mapSize.width / MAP_VIEWBOX.width,
    mapSize.height / MAP_VIEWBOX.height,
  );
  const responsiveProjection = {
    ...currentProjection,
    scale: (currentProjection.scale ?? DEFAULT_PROJECTION.scale) * viewportScale,
  };
  const centralJavaProvince = mapLayers.province.features.find((feature) => {
    const provinceName = feature.properties?.Propinsi || feature.properties?.NAME_1 || '';
    return provinceName === 'JAWA TENGAH';
  });

  if (!centralJavaProvince) {
    return (
      <div className="flex min-h-[420px] items-center justify-center text-center text-sm font-medium text-red-600">
        Batas wilayah Jawa Tengah tidak ditemukan pada data peta.
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="relative flex h-[clamp(280px,55vw,560px)] min-w-0 w-full items-center justify-center overflow-hidden bg-transparent select-none"
    >
      <ComposableMap
        width={mapSize.width}
        height={mapSize.height}
        projection="geoMercator"
        projectionConfig={responsiveProjection}
        className="block h-full w-full"
      >
        <defs>
          <clipPath id={clipPathId}>
            <CentralJavaClip geography={centralJavaProvince} />
          </clipPath>
        </defs>

        <Geographies geography={mapLayers.province}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const provinceName = geo.properties?.Propinsi || geo.properties?.NAME_1 || '';
              const isJawaTengah = provinceName === 'JAWA TENGAH';
              
              if (!isJawaTengah) return null;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={showPrecipitation && isPrecipitationVisible ? '#f1f5f9' : '#f8fafc'}
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  pointerEvents="none"
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              );
            })
          }
        </Geographies>

        {showPrecipitation && isPrecipitationVisible && radarStatus === 'ready' && radarFrame && (
          <RainRadarLayer framePath={radarFrame.path} clipPathId={clipPathId} />
        )}

        <Geographies geography={mapLayers.regencies}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                aria-label={`Batas ${geo.properties?.namobj || geo.properties?.wadmkk || 'kabupaten/kota'}`}
                fill="transparent"
                stroke="#64748b"
                strokeWidth={0.42}
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
                style={{
                  default: { outline: 'none' },
                  hover: { outline: 'none' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        <RiverLayer geography={mapLayers.rivers} clipPathId={clipPathId} />

        <RegencyLabelLayer geography={mapLayers.regencies} mapWidth={mapSize.width} />

        {/* Render PLTA Markers with their real geographic coordinates */}
        {!customMarkers && pltaList.map((plta) => {
          if (plta.longitude === null || plta.latitude === null) return null;

          const coord: [number, number] = [plta.longitude, plta.latitude];
          const isHovered = hoveredId === plta.id;
          const statusColor = plta.isActive ? '#0891b2' : '#94a3b8';

          return (
            <Marker
              key={plta.id}
              coordinates={coord}
              onClick={() => onPLTAClick(plta.id)}
              onMouseEnter={() => setHoveredId(plta.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <g className="cursor-pointer transition-all duration-300">
                <circle 
                  r={isHovered ? 20 : 12} 
                  fill={statusColor} 
                  fillOpacity={isHovered ? 0.2 : 0.1} 
                  className={isHovered ? '' : 'animate-pulse'}
                />
                <circle 
                  r={isHovered ? 7 : 5} 
                  fill={statusColor} 
                  stroke="#ffffff" 
                  strokeWidth={2}
                />
                <text
                  textAnchor="middle"
                  y={isHovered ? -26 : -16}
                  className={`text-[10px] font-bold ${isHovered ? 'fill-slate-900 opacity-100' : 'fill-slate-500 opacity-70'} transition-all font-sans`}
                >
                  {getPlantDisplayName(plta)}
                </text>
              </g>
            </Marker>
          );
        })}

        {/* Render Custom Markers (for MapContent.tsx details) */}
        {customMarkers && customMarkers.map((m) => (
          <Marker
            key={m.id}
            coordinates={m.coordinates}
            onMouseEnter={() => setHoveredId(m.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <g className="cursor-pointer transition-all duration-300">
              <circle 
                r={hoveredId === m.id ? 15 : 9} 
                fill={m.color} 
                fillOpacity={hoveredId === m.id ? 0.3 : 0.2} 
              />
              <circle 
                r={hoveredId === m.id ? 5 : 3.5} 
                fill={m.color} 
                stroke="#ffffff" 
                strokeWidth={1.5}
              />
              <text
                textAnchor="middle"
                y={hoveredId === m.id ? -22 : -12}
                className={`text-[9px] font-bold ${hoveredId === m.id ? 'fill-slate-900' : 'fill-slate-500'} transition-all font-sans`}
              >
                {m.name}
              </text>
            </g>
          </Marker>
        ))}
      </ComposableMap>

      {showPrecipitation && (
        <div className="absolute right-2 top-2 z-10 flex max-w-[calc(100%-1rem)] flex-col items-end gap-1.5 sm:right-4 sm:top-4">
          <button
            type="button"
            aria-pressed={isPrecipitationVisible}
            onClick={() => setIsPrecipitationVisible((current) => !current)}
            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold backdrop-blur-sm transition-colors ${
              isPrecipitationVisible
                ? 'border-sky-300 bg-sky-50/95 text-sky-800 hover:bg-sky-100'
                : 'border-slate-200 bg-white/95 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CloudRain className="h-4 w-4" aria-hidden="true" />
            <span>Presipitasi</span>
            <span
              className={`h-2 w-2 rounded-full ${
                radarStatus === 'ready'
                  ? 'bg-emerald-500'
                  : radarStatus === 'error'
                    ? 'bg-amber-500'
                    : 'animate-pulse bg-sky-400'
              }`}
              aria-hidden="true"
            />
          </button>

          {isPrecipitationVisible && (
            <div
              role="status"
              className="rounded-lg border border-slate-200 bg-white/95 px-2.5 py-1.5 text-right text-[10px] font-semibold text-slate-500 backdrop-blur-sm"
            >
              <p>
                {radarStatus === 'ready' && radarFrame
                  ? `Radar ${new Intl.DateTimeFormat('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Asia/Jakarta',
                    }).format(new Date(radarFrame.time * 1000))} WIB`
                  : radarStatus === 'error'
                    ? 'Radar gratis sedang tidak tersedia'
                    : 'Memuat radar terbaru...'}
              </p>
              {radarStatus === 'ready' && (
                <>
                  <p className="font-normal text-slate-400">Area berwarna = hujan terdeteksi</p>
                  <a
                    href="https://www.rainviewer.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 block font-medium text-sky-700 underline decoration-sky-300 underline-offset-2"
                  >
                    Data radar: RainViewer
                  </a>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info Panel Overlay (PLTA) - No Shadow! */}
      {hoveredPLTA && (
        <div className="pointer-events-none absolute inset-x-3 top-3 rounded-2xl border border-slate-200 bg-white p-3 animate-in fade-in zoom-in-95 duration-200 sm:inset-x-auto sm:left-4 sm:top-4 sm:min-w-[250px] sm:p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h4 className="min-w-0 font-sans text-sm font-bold text-slate-800">{hoveredPLTA.name}</h4>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              hoveredPLTA.isActive
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {hoveredPLTA.isActive ? 'Aktif' : 'Tidak aktif'}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">Kode</span>
              <span className="text-sm font-mono font-bold text-slate-800">{hoveredPLTA.code}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">Kapasitas</span>
              <span className="text-sm font-mono font-bold text-slate-800">{formatMetric(hoveredPLTA.capacityMw, 1)} MW</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">Koordinat</span>
              <span className="text-right text-[11px] font-mono font-semibold text-slate-700">
                {hoveredPLTA.latitude?.toFixed(4)}, {hoveredPLTA.longitude?.toFixed(4)}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-pln-teal font-bold flex items-center gap-1">
            Klik untuk detail telemetering →
          </div>
        </div>
      )}

      {/* Info Panel Overlay (Custom AWLR/Rain Sensors) - No Shadow! */}
      {hoveredCustom && (
        <div className="pointer-events-none absolute inset-x-3 top-3 rounded-xl border border-slate-200 bg-white p-3 animate-in fade-in zoom-in-95 duration-200 sm:inset-x-auto sm:left-4 sm:top-4 sm:min-w-[180px]">
          <h4 className="font-bold text-slate-800 text-sm mb-1">{hoveredCustom.name}</h4>
          <p className="text-xs font-mono font-bold text-pln-teal">{hoveredCustom.valueLabel}</p>
        </div>
      )}

      {!customMarkers && pltaList.length === 0 && (
        <div className="absolute inset-x-4 top-4 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 text-center text-sm text-slate-500 backdrop-blur-sm">
          Belum ada PLTA yang dapat ditampilkan pada peta.
        </div>
      )}
      
      <div className="absolute bottom-2 right-2 flex max-w-[calc(100%-1rem)] flex-col gap-1.5 rounded-xl border border-slate-200 bg-white/95 p-2 backdrop-blur-sm sm:bottom-5 sm:right-5 sm:gap-2.5 sm:p-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm border border-slate-400 bg-slate-100"></div>
          <span className="text-[10px] font-bold text-slate-600 uppercase">Jawa Tengah</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-px w-4 bg-slate-500"></div>
          <span className="text-[10px] font-bold uppercase text-slate-600">Batas Kab/Kota</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-4 rounded-full bg-sky-600"></div>
          <span className="text-[10px] font-bold uppercase text-slate-600">Jaringan Sungai</span>
        </div>
        {showPrecipitation && isPrecipitationVisible && radarStatus === 'ready' && (
          <div className="flex items-center gap-2">
            <div className="h-3 w-4 rounded-sm bg-gradient-to-r from-sky-300 via-amber-300 to-fuchsia-500"></div>
            <span className="text-[10px] font-bold uppercase text-slate-600">Radar Hujan</span>
          </div>
        )}
        <span
          className="hidden max-w-[210px] border-t border-slate-100 pt-2 text-[9px] font-medium leading-3.5 text-slate-400 sm:block"
          title="Batas wilayah: BIG · Jaringan sungai: HydroRIVERS/HydroSHEDS"
        >
          Batas: BIG · Sungai: HydroRIVERS{showPrecipitation && radarStatus === 'ready' ? ' · Radar: RainViewer' : ''}
        </span>
      </div>
    </div>
  );
}
