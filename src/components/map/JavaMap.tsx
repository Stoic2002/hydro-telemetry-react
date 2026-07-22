import { useEffect, useId, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, useMapContext } from 'react-simple-maps';
import type {
  Feature,
  FeatureCollection,
  Geometry,
  GeoJsonProperties,
  LineString,
} from 'geojson';
import { usePlantCatalogQuery } from '../../features/plta/api/queries';
import { getPLTAErrorMessage } from '../../features/plta/error';
import { getPlantDisplayName } from '../../features/plta/presentation';
import { formatMetric } from '../../utils/formatters';
import MapSkeleton from '../skeletons/MapSkeleton';

interface JavaMapProps {
  onPLTAClick: (pltaId: string) => void;
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

const MAP_LAYER_URLS = {
  province: '/indonesia-provinces.json',
  regencies: '/central-java-regencies.geojson',
  rivers: '/central-java-rivers.geojson',
} as const;

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

export default function JavaMap({ onPLTAClick, customMarkers, projectionConfig }: JavaMapProps) {
  const plantsQuery = usePlantCatalogQuery(!customMarkers);
  const pltaList = plantsQuery.data ?? [];
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mapLayers, setMapLayers] = useState<MapLayers | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clipPathId = `central-java-map-${useId().replace(/:/g, '')}`;

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
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-transparent select-none">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={currentProjection}
        className="w-full h-[500px]"
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
                  fill="#e0f2fe"
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { fill: '#bae6fd', outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              );
            })
          }
        </Geographies>

        <Geographies geography={mapLayers.regencies}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                aria-label={`Batas ${geo.properties?.namobj || geo.properties?.wadmkk || 'kabupaten/kota'}`}
                fill="rgba(255, 255, 255, 0.02)"
                stroke="#64748b"
                strokeWidth={0.42}
                vectorEffect="non-scaling-stroke"
                style={{
                  default: { outline: 'none' },
                  hover: { fill: 'rgba(255, 255, 255, 0.32)', outline: 'none' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        <RiverLayer geography={mapLayers.rivers} clipPathId={clipPathId} />

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

      {/* Info Panel Overlay (PLTA) - No Shadow! */}
      {hoveredPLTA && (
        <div className="absolute top-4 left-4 bg-white border border-slate-200 rounded-2xl p-4 min-w-[250px] pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-800 font-sans text-sm">{hoveredPLTA.name}</h4>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              hoveredPLTA.isActive
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {hoveredPLTA.isActive ? 'Aktif' : 'Tidak aktif'}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Kode</span>
              <span className="text-sm font-mono font-bold text-slate-800">{hoveredPLTA.code}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Kapasitas</span>
              <span className="text-sm font-mono font-bold text-slate-800">{formatMetric(hoveredPLTA.capacityMw, 1)} MW</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Koordinat</span>
              <span className="text-[11px] font-mono font-semibold text-slate-700">
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
        <div className="absolute top-4 left-4 bg-white border border-slate-200 rounded-xl p-3 min-w-[180px] pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <h4 className="font-bold text-slate-800 text-sm mb-1">{hoveredCustom.name}</h4>
          <p className="text-xs font-mono font-bold text-pln-teal">{hoveredCustom.valueLabel}</p>
        </div>
      )}

      {!customMarkers && pltaList.length === 0 && (
        <div className="absolute inset-x-4 top-4 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 text-center text-sm text-slate-500 backdrop-blur-sm">
          Belum ada PLTA yang dapat ditampilkan pada peta.
        </div>
      )}
      
      <div className="absolute bottom-5 right-5 flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white/95 p-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm border border-sky-400 bg-sky-100"></div>
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
        <span
          className="max-w-[210px] border-t border-slate-100 pt-2 text-[9px] font-medium leading-3.5 text-slate-400"
          title="Batas wilayah: BIG · Jaringan sungai: HydroRIVERS/HydroSHEDS"
        >
          Batas: BIG · Sungai: HydroRIVERS
        </span>
      </div>
    </div>
  );
}
