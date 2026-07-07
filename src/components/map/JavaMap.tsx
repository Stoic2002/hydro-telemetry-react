import { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { pltaData } from '../../data/plta-data';
import { formatMetric, getStatusColor } from '../../utils/formatters';

interface JavaMapProps {
  onPLTAClick: (pltaId: string) => void;
  projectionConfig?: any;
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

const coordinates: Record<string, [number, number]> = {
  'pbs-soedirman': [109.610, -7.385],
  'ketenger': [109.213, -7.348],
  'tapen': [109.689, -7.394],
  'garung': [109.923, -7.269],
  'wonogiri': [110.906, -7.834],
};

const geoUrl = '/indonesia-provinces.json';

export default function JavaMap({ onPLTAClick, customMarkers, projectionConfig }: JavaMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(geoUrl)
      .then(res => {
        if (!res.ok) throw new Error('Gagal memuat data peta');
        return res.json();
      })
      .then(data => setGeoData(data))
      .catch(err => setError(err.message));
  }, []);

  const hoveredPLTA = !customMarkers && hoveredId ? pltaData.find((p) => p.id === hoveredId) : null;
  const hoveredCustom = customMarkers && hoveredId ? customMarkers.find((m) => m.id === hoveredId) : null;

  if (error) return <div className="flex items-center justify-center h-full text-red-500 font-medium">{error}</div>;
  if (!geoData) return <div className="flex items-center justify-center h-full text-slate-400 font-medium animate-pulse">Memuat Peta...</div>;

  const currentProjection = projectionConfig || DEFAULT_PROJECTION;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-transparent select-none">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={currentProjection}
        className="w-full h-[500px]"
      >
        <Geographies geography={geoData}>
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

        {/* Render PLTA Markers with their real geographic coordinates */}
        {!customMarkers && pltaData.map((plta) => {
          const coord = coordinates[plta.id];
          if (!coord) return null;
          const isHovered = hoveredId === plta.id;
          const statusColor = getStatusColor(plta.status);

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
                  {plta.shortName}
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
              hoveredPLTA.status === 'Aman' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {hoveredPLTA.status}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Elevasi Aktual</span>
              <span className="text-sm font-mono font-bold text-slate-800">{formatMetric(hoveredPLTA.liveData.waterLevel)} mdpl</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Inflow Realtime</span>
              <span className="text-sm font-mono font-bold text-slate-800">{formatMetric(hoveredPLTA.liveData.inflow, 1)} m³/s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Outflow</span>
              <span className="text-sm font-mono font-bold text-slate-800">{formatMetric(hoveredPLTA.liveData.outflow, 1)} m³/s</span>
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
      
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-white border border-slate-200 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#cbd5e1] border border-slate-400"></div>
          <span className="text-[10px] font-bold text-slate-600 uppercase">Jawa Tengah</span>
        </div>
      </div>
    </div>
  );
}
