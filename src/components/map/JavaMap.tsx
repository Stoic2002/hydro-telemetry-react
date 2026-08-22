import { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, useMapContext } from 'react-simple-maps';
import { CloudRain } from 'lucide-react';
import type {
  FeatureCollection,
  Geometry,
  GeoJsonProperties,
  LineString,
} from 'geojson';
import { getPLTAErrorMessage, getPlantDisplayName, usePlantCatalogQuery } from '../../features/plta';
import { formatMetric } from '../../shared/utils/number';
import { formatTimeWIB } from '../../shared/lib/date';
import MapSkeleton from '../skeletons/MapSkeleton';
import Badge from '../atoms/Badge';
import { getLabelCoordinate } from './label-placement';
import { horizontalShiftForWidth, pixelShiftToLongitude } from './projection';
import {
  CENTRAL_JAVA_RADAR_TILES,
  RAIN_VIEWER_TILE_HOST,
  tileXToLongitude,
  tileYToLatitude,
} from './radar-tiles';
import {
  useMapLayersQuery,
  useRainRadarFrameQuery,
  type RiverProperties,
} from './queries';

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

const CITY_LABEL_OFFSETS: Record<string, { x: number; y: number }> = {
  'Kota Magelang': { x: -36, y: 11 },
  'Kota Pekalongan': { x: -4, y: -15 },
  'Kota Salatiga': { x: 13, y: 12 },
  'Kota Semarang': { x: 13, y: -14 },
  'Kota Surakarta': { x: 15, y: -10 },
  'Kota Tegal': { x: -14, y: -13 },
};

/**
 * Bentuk wilayah Jawa Tengah, diturunkan dari data kabupaten.
 *
 * Sebelumnya bentuk ini diambil dari berkas provinsi terpisah yang 42x lebih
 * kasar dan tidak memuat Karimunjawa, sehingga garis luarnya tidak berimpit
 * dengan batas kabupaten dan clip untuk sungai maupun radar ikut meleset.
 * Menurunkannya dari satu sumber membuat keduanya berimpit sempurna.
 */
const CentralJavaShape = memo(function CentralJavaShape({
  geography,
  fill,
  outline,
}: {
  geography: FeatureCollection<Geometry, GeoJsonProperties>;
  fill?: string;
  outline?: string;
}) {
  const { path } = useMapContext();
  const d = path(geography) ?? undefined;

  if (!outline) return <path d={d} fill={fill} />;

  // Goresan digambar lebih dulu untuk seluruh batas, lalu ditimpa isian.
  // Batas antar kabupaten tertutup isian, menyisakan garis terluar saja.
  return (
    <g pointerEvents="none">
      <path d={d} fill="none" stroke={outline} strokeWidth={3} strokeLinejoin="round" />
      <path d={d} fill={fill} />
    </g>
  );
});

const RiverLayer = memo(function RiverLayer({
  geography,
  clipPathId,
}: {
  geography: FeatureCollection<LineString, RiverProperties>;
  clipPathId: string;
}) {
  const { path } = useMapContext();
  // Pengelompokan 555 fitur sungai hanya bergantung pada datanya, bukan pada
  // ukuran peta maupun marker yang sedang disorot.
  const { tributaries, secondaryRivers, primaryRivers } = useMemo(() => {
    const byOrder = (predicate: (order: number) => boolean) => ({
      type: 'FeatureCollection' as const,
      features: geography.features.filter(
        (feature) => predicate(feature.properties.strahlerOrder),
      ),
    });

    return {
      tributaries: byOrder((order) => order === 4),
      secondaryRivers: byOrder((order) => order === 5),
      primaryRivers: byOrder((order) => order >= 6),
    };
  }, [geography]);

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
});

const RegencyLabelLayer = memo(function RegencyLabelLayer({
  geography,
  mapWidth,
}: {
  geography: FeatureCollection<Geometry, GeoJsonProperties>;
  mapWidth: number;
}) {
  const { projection } = useMapContext();
  const responsiveFactor = mapWidth < 480 ? 0.62 : mapWidth < 768 ? 0.78 : 1;
  const fontSize = mapWidth < 480 ? 5.8 : mapWidth < 768 ? 7 : 8.5;
  // Centroid dihitung dari 6.069 titik dan tidak bergantung pada ukuran peta,
  // jadi cukup sekali per kumpulan data.
  const labels = useMemo(() => (
    geography.features.flatMap((feature) => {
      const name = String(
        feature.properties?.namobj || feature.properties?.wadmkk || '',
      ).trim();
      if (!name) return [];

      const coordinate = getLabelCoordinate(feature.geometry);
      return coordinate ? [{ name, coordinate }] : [];
    })
  ), [geography]);

  return (
    <g aria-label="Nama kabupaten dan kota di Jawa Tengah" pointerEvents="none">
      {labels.map(({ name, coordinate }, index) => {
        const centroid = projection(coordinate);
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
});

const RainRadarLayer = memo(function RainRadarLayer({
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
});

export default function JavaMap({
  onPLTAClick,
  customMarkers,
  projectionConfig,
  showPrecipitation = false,
}: JavaMapProps) {
  const plantsQuery = usePlantCatalogQuery(!customMarkers);
  const pltaList = plantsQuery.data ?? [];
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  /** Dipisahkan dari hover agar cincin fokus hanya tampil untuk keyboard. */
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const mapLayersQuery = useMapLayersQuery();
  const mapLayers = mapLayersQuery.data ?? null;
  const [mapSize, setMapSize] = useState<{ width: number; height: number }>(MAP_VIEWBOX);
  const radarQuery = useRainRadarFrameQuery(showPrecipitation);
  const radarFrame = radarQuery.data ?? null;
  const radarStatus = radarQuery.isPending
    ? (radarQuery.fetchStatus === 'idle' ? 'idle' : 'loading')
    : radarQuery.isError ? 'error' : 'ready';
  const [isPrecipitationVisible, setIsPrecipitationVisible] = useState(showPrecipitation);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const clipPathId = `central-java-map-${useId().replace(/:/g, '')}`;
  const isMapReady = Boolean(mapLayers && (customMarkers || !plantsQuery.isPending));

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

  const hasPlantError = !customMarkers && plantsQuery.isError;

  if (mapLayersQuery.isError || hasPlantError) {
    const failingQuery = mapLayersQuery.isError ? mapLayersQuery : plantsQuery;

    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm font-medium text-red-600">
          {mapLayersQuery.isError
            ? 'Data batas wilayah peta gagal dimuat.'
            : getPLTAErrorMessage(plantsQuery.error)}
        </p>
        <button
          type="button"
          onClick={() => void failingQuery.refetch()}
          className="cursor-pointer rounded-lg border border-red-200 bg-surface-raised px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          {mapLayersQuery.isError ? 'Muat ulang peta' : 'Muat ulang data PLTA'}
        </button>
      </div>
    );
  }

  if (!mapLayers || (!customMarkers && plantsQuery.isPending)) return <MapSkeleton />;

  const currentProjection = projectionConfig || DEFAULT_PROJECTION;
  const viewportScale = Math.min(
    mapSize.width / MAP_VIEWBOX.width,
    mapSize.height / MAP_VIEWBOX.height,
  );
  const effectiveScale = (currentProjection.scale ?? DEFAULT_PROJECTION.scale) * viewportScale;
  const [baseLongitude, baseLatitude] = currentProjection.center ?? DEFAULT_PROJECTION.center;
  // Digeser ke kiri sejauh setengah lebar panel melayang di kanan, supaya
  // daratan tidak tertutup sakelar radar dan legenda.
  const centerLongitude = baseLongitude + pixelShiftToLongitude(
    horizontalShiftForWidth(mapSize.width),
    effectiveScale,
  );
  const responsiveProjection = {
    ...currentProjection,
    center: [centerLongitude, baseLatitude] as [number, number],
    scale: effectiveScale,
  };
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
            <CentralJavaShape geography={mapLayers.regencies} />
          </clipPath>
        </defs>

        <CentralJavaShape
          geography={mapLayers.regencies}
          fill={showPrecipitation && isPrecipitationVisible ? '#f1f5f9' : '#f8fafc'}
          outline="#94a3b8"
        />

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
                tabIndex={-1}
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
          // Fokus keyboard memunculkan sorotan yang sama seperti hover, supaya
          // kartu detail di samping peta ikut terbuka saat ditelusuri dengan Tab.
          const isHighlighted = hoveredId === plta.id;
          const isFocused = focusedId === plta.id;
          const statusColor = plta.isActive ? '#0891b2' : '#94a3b8';
          const plantName = getPlantDisplayName(plta);

          return (
            <Marker
              key={plta.id}
              coordinates={coord}
              onClick={() => onPLTAClick(plta.id)}
              onMouseEnter={() => setHoveredId(plta.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <g
                role="button"
                tabIndex={0}
                aria-label={`Buka telemetering PLTA ${plantName}`}
                onFocus={() => {
                  setFocusedId(plta.id);
                  setHoveredId(plta.id);
                }}
                onBlur={() => {
                  setFocusedId(null);
                  setHoveredId(null);
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  // Spasi menggulirkan halaman bila tidak dicegat.
                  event.preventDefault();
                  onPLTAClick(plta.id);
                }}
                className="cursor-pointer outline-none transition-all duration-300"
              >
                {isFocused && (
                  <circle
                    r={26}
                    fill="none"
                    stroke="var(--color-brand-primary-strong)"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                  />
                )}
                <circle
                  r={isHighlighted ? 20 : 12}
                  fill={statusColor}
                  fillOpacity={isHighlighted ? 0.2 : 0.1}
                  className={isHighlighted ? '' : 'animate-pulse'}
                />
                <circle
                  r={isHighlighted ? 7 : 5}
                  fill={statusColor}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
                <text
                  textAnchor="middle"
                  y={isHighlighted ? -26 : -16}
                  aria-hidden="true"
                  className={`text-[10px] font-bold ${isHighlighted ? 'fill-text-primary opacity-100' : 'fill-text-muted opacity-70'} transition-all font-sans`}
                >
                  {plantName}
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
                className={`text-[9px] font-bold ${hoveredId === m.id ? 'fill-text-primary' : 'fill-text-muted'} transition-all font-sans`}
              >
                {m.name}
              </text>
            </g>
          </Marker>
        ))}
      </ComposableMap>

      {showPrecipitation && (
        <div className="absolute right-3 top-3 z-10 w-[212px] max-w-[calc(100%-1.5rem)] rounded-md border border-border-subtle bg-surface-raised/95 px-3.5 py-3 shadow-[0_6px_16px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:right-4 sm:top-4">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text-primary">
              <CloudRain size={14} className="shrink-0 text-text-muted" aria-hidden="true" />
              Radar Hujan
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isPrecipitationVisible}
              aria-label={isPrecipitationVisible ? 'Matikan radar hujan' : 'Nyalakan radar hujan'}
              onClick={() => setIsPrecipitationVisible((current) => !current)}
              className={`relative h-[18px] w-8 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary-strong/40 ${
                isPrecipitationVisible ? 'bg-brand-primary-strong' : 'bg-border-subtle'
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 size-3.5 rounded-full bg-surface-raised transition-transform ${
                  isPrecipitationVisible ? 'translate-x-[14px]' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {isPrecipitationVisible && (
            <div role="status" className="mt-2.5 border-t border-surface-overlay pt-2">
              <p className="flex items-center justify-between gap-2 text-[11px] font-medium text-text-secondary">
                <span>Frame terakhir</span>
                {radarStatus === 'ready' && radarFrame && (
                  <span className="font-mono text-[11px] tabular-nums text-text-primary">
                    {formatTimeWIB(radarFrame.time * 1000)} WIB
                  </span>
                )}
                {radarStatus === 'error' && <span className="text-status-warning">Tidak tersedia</span>}
                {radarStatus === 'loading' && <span className="animate-pulse text-text-muted">Memuat…</span>}
              </p>
              {radarStatus === 'ready' && (
                <a
                  href="https://www.rainviewer.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block text-[10px] font-medium text-brand-primary-strong underline decoration-cyan-300 underline-offset-2"
                >
                  Data radar: RainViewer
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info Panel Overlay (PLTA) */}
      {hoveredPLTA && (
        <div className="pointer-events-none absolute inset-x-3 top-3 rounded-md border border-border-subtle bg-surface-raised p-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)] animate-in fade-in zoom-in-95 duration-200 sm:inset-x-auto sm:left-4 sm:top-4 sm:min-w-[250px] sm:p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h4 className="min-w-0 font-sans text-sm font-bold text-text-strong">{hoveredPLTA.name}</h4>
            <Badge tone={hoveredPLTA.isActive ? 'green' : 'slate'}>
              {hoveredPLTA.isActive ? 'Aktif' : 'Tidak aktif'}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-text-muted">Kode</span>
              <span className="text-sm font-mono font-bold text-text-strong">{hoveredPLTA.code}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-text-muted">Kapasitas</span>
              <span className="text-sm font-mono font-bold text-text-strong">{formatMetric(hoveredPLTA.capacityMw, 1)} MW</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-text-muted">Koordinat</span>
              <span className="text-right text-[11px] font-mono font-semibold text-text-secondary">
                {hoveredPLTA.latitude?.toFixed(4)}, {hoveredPLTA.longitude?.toFixed(4)}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-overlay text-[10px] text-brand-primary-strong font-bold flex items-center gap-1">
            Klik untuk detail telemetering →
          </div>
        </div>
      )}

      {/* Info Panel Overlay (Custom AWLR/Rain Sensors) */}
      {hoveredCustom && (
        <div className="pointer-events-none absolute inset-x-3 top-3 rounded-md border border-border-subtle bg-surface-raised p-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)] animate-in fade-in zoom-in-95 duration-200 sm:inset-x-auto sm:left-4 sm:top-4 sm:min-w-[180px]">
          <h4 className="font-bold text-text-strong text-sm mb-1">{hoveredCustom.name}</h4>
          <p className="text-xs font-mono font-bold text-brand-primary-strong">{hoveredCustom.valueLabel}</p>
        </div>
      )}

      {!customMarkers && pltaList.length === 0 && (
        <div className="absolute inset-x-4 top-4 rounded-xl border border-border-subtle bg-surface-raised/95 px-4 py-3 text-center text-sm text-text-muted backdrop-blur-sm">
          Belum ada PLTA yang dapat ditampilkan pada peta.
        </div>
      )}
      
      <div className="absolute bottom-3 right-3 flex max-w-[calc(100%-1.5rem)] min-w-[150px] flex-col gap-2 rounded-md border border-border-subtle bg-surface-raised/95 px-3 py-2.5 shadow-[0_6px_16px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:bottom-4 sm:right-4 sm:min-w-[212px] sm:px-3.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">Legenda</span>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-3.5 shrink-0 rounded-[2px] bg-border-subtle"></div>
            <span className="text-xs text-text-secondary">Jawa Tengah</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 shrink-0 border-t border-dashed border-text-placeholder"></div>
            <span className="text-xs text-text-secondary">Batas Kab/Kota</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-3.5 shrink-0 rounded-full bg-sky-400"></div>
            <span className="text-xs text-text-secondary">Jaringan Sungai</span>
          </div>
          {showPrecipitation && isPrecipitationVisible && radarStatus === 'ready' && (
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-3.5 shrink-0 rounded-[2px] bg-gradient-to-r from-sky-300 via-amber-300 to-fuchsia-500"></div>
              <span className="text-xs text-text-secondary">Radar Hujan</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="size-2.5 shrink-0 rounded-full bg-brand-primary-strong"></div>
            <span className="text-xs text-text-secondary">PLTA</span>
          </div>
        </div>
        <span
          className="hidden max-w-[210px] border-t border-surface-overlay pt-2 text-[10px] leading-[1.4] text-text-muted sm:block"
          title="Batas wilayah: BIG · Jaringan sungai: HydroRIVERS/HydroSHEDS"
        >
          Batas: BIG · Sungai: HydroRIVERS{showPrecipitation && radarStatus === 'ready' ? ' · Radar: RainViewer' : ''}
        </span>
      </div>
    </div>
  );
}
