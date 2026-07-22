import JavaMap from '../map/JavaMap';
import Card from '../atoms/Card';

import { PJT_RAINFALL_DATA, PJT_WATER_DATA } from '../../mocks/pjt.mock';

interface MapContentProps {
  activeTab: 'water' | 'rainfall';
}

const PJT_PROJECTION = {
  scale: 22000,
  center: [109.60, -7.50] as [number, number],
};

export default function MapContent({ activeTab }: MapContentProps) {
  const stations = activeTab === 'water' ? PJT_WATER_DATA : PJT_RAINFALL_DATA;
  const markers = stations.map(s => ({
    id: s.id,
    name: s.name,
    coordinates: [s.coordinates.x, s.coordinates.y] as [number, number],
    color: activeTab === 'water' ? '#3b82f6' : '#22c55e',
    valueLabel: `${s.value.toFixed(2)} ${s.unit}`
  }));

  return (
    <div className="flex flex-col gap-4 h-full min-h-[600px]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Peta Lokasi Stasiun</h2>
        <div className="flex items-center gap-4 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${activeTab === 'water' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-300'}`}></div>
            <span className={`text-[10px] font-bold uppercase ${activeTab === 'water' ? 'text-blue-600' : 'text-slate-400'}`}>Water Level</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${activeTab === 'rainfall' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-300'}`}></div>
            <span className={`text-[10px] font-bold uppercase ${activeTab === 'rainfall' ? 'text-green-600' : 'text-slate-400'}`}>Rainfall</span>
          </div>
          <div className="w-px h-3 bg-slate-200"></div>
          <div className="text-[10px] font-bold text-pln-teal uppercase">
            {stations.length} Terminal Aktif
          </div>
        </div>
      </div>
      
      <Card noPadding className="flex-1 overflow-hidden relative border-slate-200">
        <div className="absolute inset-0 bg-slate-50/50">
          <JavaMap 
            onPLTAClick={(id) => console.log('Station clicked:', id)} 
            customMarkers={markers}
            projectionConfig={PJT_PROJECTION}
          />
        </div>
        
      </Card>
    </div>
  );
}
