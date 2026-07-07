import React, { useState } from 'react';
import { Droplets, CloudRain, Search, Filter } from 'lucide-react';
import StationCard from './StationCard';

import { PJT_RAINFALL_DATA, PJT_WATER_DATA } from '../../data/pjt-mock-data';

const WATER_STATIONS = PJT_WATER_DATA;
const RAINFALL_STATIONS = PJT_RAINFALL_DATA;

interface TelemeteringContentProps {
  activeTab: 'water' | 'rainfall';
  onTabChange: (tab: 'water' | 'rainfall') => void;
}

export default function TelemeteringContent({ activeTab, onTabChange }: TelemeteringContentProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const stations = activeTab === 'water' ? WATER_STATIONS : RAINFALL_STATIONS;
  const filteredStations = stations.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => onTabChange('water')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'water' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Droplets size={16} />
            Water Level
          </button>
          <button
            onClick={() => onTabChange('rainfall')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'rainfall' 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <CloudRain size={16} />
            Rainfall
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={`Cari stasiun ${activeTab === 'water' ? 'tinggi air' : 'hujan'}...`}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pln-teal/20 focus:border-pln-teal transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-pln-teal hover:border-pln-teal transition-all">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredStations.map((station) => (
          <StationCard
            key={station.id}
            {...station}
            type={activeTab}
          />
        ))}
      </div>
      
      {filteredStations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <Search size={48} className="mb-4 opacity-20" />
          <p className="font-medium">Stasiun tidak ditemukan</p>
          <p className="text-xs">Coba gunakan kata kunci pencarian lain</p>
        </div>
      )}
    </div>
  );
}
