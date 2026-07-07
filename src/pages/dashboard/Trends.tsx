import { useState, useMemo } from 'react';
import { usePLTAStore } from '../../store/plta-store';
import { pltaData } from '../../data/plta-data';
import { useNotificationStore } from '../../store/notification-store';
import { formatNumber } from '../../utils/formatters';
import { Calendar } from 'lucide-react';

interface SvgPathData {
  linePath: string;
  fillPath: string;
}

export default function Trends() {
  const { selectedPLTAId } = usePLTAStore();
  const { addToast } = useNotificationStore();
  const plta = pltaData.find((p) => p.id === selectedPLTAId) || pltaData[0];

  const [period, setPeriod] = useState('30 Hari Terakhir');

  // Dynamic status parameters
  const currentInflow = plta.liveData.inflow;
  const currentLevel = plta.liveData.waterLevel;
  const currentOutflow = plta.liveData.outflow;
  
  // ARR Rainfall calculation (deterministic per PLTA)
  const isLargePLTA = plta.capacity > 100;
  const currentARR = isLargePLTA ? 18.4 : 9.2;

  // Max elevation threshold
  const maxElevation = plta.liveData.targetLevel || 231.0;

  // SVG Area Chart generator helper
  const generateSvgPath = (values: number[]): SvgPathData => {
    if (values.length === 0) return { linePath: '', fillPath: '' };
    
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    // Map 31 points to width 520, height 200
    // Height scaled between 45 (top margin) and 155 (bottom margin)
    const points = values.map((val, idx) => {
      const x = (idx / (values.length - 1)) * 520;
      const y = 155 - ((val - minVal) / range) * 110;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const linePath = `M` + points.map((p, i) => `${i === 0 ? '' : 'L'}${p}`).join(' ');
    const fillPath = `${linePath} L520,200 L0,200 Z`;

    return { linePath, fillPath };
  };

  // 1. Inflow Historical Points & Paths
  const inflowHistory = useMemo(() => {
    return plta.historicalData.map((d) => d.inflow);
  }, [plta.id]);

  const inflowPaths = useMemo(() => {
    return generateSvgPath(inflowHistory);
  }, [inflowHistory]);

  // 2. Water Level Historical Points & Paths
  const levelHistory = useMemo(() => {
    return plta.historicalData.map((d) => d.waterLevel);
  }, [plta.id]);

  const levelPaths = useMemo(() => {
    return generateSvgPath(levelHistory);
  }, [levelHistory]);

  // 3. Outflow Historical Points & Paths
  const outflowHistory = useMemo(() => {
    return plta.historicalData.map((d) => d.outflow);
  }, [plta.id]);

  const outflowPaths = useMemo(() => {
    return generateSvgPath(outflowHistory);
  }, [outflowHistory]);

  // 4. ARR / Rainfall 20 bars mapping
  const rainBars = useMemo(() => {
    const bars: { x: number; y: number; h: number }[] = [];
    const base = currentARR;
    
    const maxVal = base * 2.5;

    for (let i = 0; i < 20; i++) {
      // Seeded deterministic random heights based on index and plta.id
      const seed = i + (plta.id === 'pbs-soedirman' ? 5 : 12);
      const rand = Math.sin(seed) * 0.5 + 0.5;
      const val = base * rand * 1.5 + 2.0;

      const h = (val / maxVal) * 130 + 15; // scaled height
      const y = 200 - h;
      const x = 4 + i * 26;

      bars.push({ x, y, h });
    }
    return bars;
  }, [plta.id, currentARR]);

  // Handlers
  const handleApplyFilter = () => {
    addToast({ type: 'success', message: 'Filter tren berhasil diterapkan' });
  };

  return (
    <div className="flex flex-col flex-1 gap-6 animate-in fade-in duration-500">
      {/* Top Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#0f172a] font-display text-2xl font-bold leading-normal">
            Tren & Grafik
          </h1>
          <p className="text-[#64748b] font-sans text-sm leading-normal">
            Tren parameter hidrologi: inflow, water level, outflow, dan curah hujan (ARR)
          </p>
        </div>

        {/* Filter Bar Widgets (No Shadow!) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active PLTA indicator */}
          <div className="flex h-11 items-center bg-[#ecfeff] border border-[#a5f3fc] rounded-[10px] px-3.5 py-0 gap-2">
            <div className="size-2 bg-[#0891b2] rounded-full"></div>
            <span className="text-[#0e7490] font-sans text-sm font-medium">
              PLTA {plta.shortName}
            </span>
          </div>

          {/* Period selector */}
          <div className="flex h-11 items-center bg-white border border-[#e2e8f0] rounded-[10px] px-3.5 py-0 gap-2">
            <Calendar size={15} className="text-[#94a3b8]" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent border-0 text-[#334155] font-sans text-[13px] font-medium focus:outline-none pr-6 cursor-pointer"
            >
              <option value="30 Hari Terakhir">30 Hari Terakhir</option>
              <option value="7 Hari Terakhir">7 Hari Terakhir</option>
              <option value="24 Jam Terakhir">24 Jam Terakhir</option>
            </select>
          </div>

          {/* Terapkan Button */}
          <button
            onClick={handleApplyFilter}
            className="flex h-11 justify-center items-center bg-[#0891b2] hover:bg-[#0e7490] text-white font-sans text-[13px] font-semibold rounded-[10px] px-[18px] py-0 border-0 cursor-pointer transition-colors"
          >
            Terapkan
          </button>
        </div>
      </div>

      {/* Grid of 4 Trend Cards (2x2 Layout, No Shadows!) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Trend Card 1: Inflow */}
        <div className="flex flex-col bg-white border border-[#e2e8f0] rounded-[14px] p-5 gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <h4 className="text-[#0f172a] font-sans text-[15px] font-semibold leading-normal">
                Inflow
              </h4>
              <p className="text-[#94a3b8] font-sans text-xs leading-normal">
                m³/s · rata-rata harian
              </p>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[#0891b2] font-sans text-lg font-bold leading-normal">
                {formatNumber(currentInflow, 1)}
              </span>
              <span className="text-[#94a3b8] font-sans text-[11px]">terkini</span>
            </div>
          </div>

          {/* SVG Inflow Area Chart */}
          <div className="w-full h-[200px]">
            <svg viewBox="0 0 520 200" className="w-full h-full" preserveAspectRatio="none">
              {/* Horizontal Grid lines */}
              <line x1="0" y1="50" x2="520" y2="50" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="100" x2="520" y2="100" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="150" x2="520" y2="150" stroke="#F1F5F9" strokeWidth="1" />
              
              {/* Filled Area */}
              {inflowPaths.fillPath && (
                <path d={inflowPaths.fillPath} fill="#0891B2" fillOpacity="0.08" />
              )}
              {/* Top border line */}
              {inflowPaths.linePath && (
                <path d={inflowPaths.linePath} fill="none" stroke="#0891B2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </div>

          {/* Timeline labels */}
          <div className="flex justify-between text-[#94a3b8] font-sans text-[11px] mt-1">
            <span>19 Jan</span>
            <span>02 Feb</span>
            <span>17 Feb</span>
          </div>
        </div>

        {/* Trend Card 2: Water Level */}
        <div className="flex flex-col bg-white border border-[#e2e8f0] rounded-[14px] p-5 gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <h4 className="text-[#0f172a] font-sans text-[15px] font-semibold leading-normal">
                Water Level
              </h4>
              <p className="text-[#94a3b8] font-sans text-xs leading-normal">
                mdpl · elevasi muka air waduk
              </p>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[#0e7490] font-sans text-lg font-bold leading-normal">
                {formatNumber(currentLevel, 2)}
              </span>
              <span className="text-[#94a3b8] font-sans text-[11px]">terkini</span>
            </div>
          </div>

          {/* SVG Water Level Area Chart */}
          <div className="w-full h-[200px] relative">
            <svg viewBox="0 0 520 200" className="w-full h-full" preserveAspectRatio="none">
              {/* Horizontal Grid lines */}
              <line x1="0" y1="50" x2="520" y2="50" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="100" x2="520" y2="100" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="150" x2="520" y2="150" stroke="#F1F5F9" strokeWidth="1" />
              
              {/* Max elevation target reference line */}
              <line x1="0" y1="40" x2="520" y2="40" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="6 4" />
              
              {/* Filled Area */}
              {levelPaths.fillPath && (
                <path d={levelPaths.fillPath} fill="#0E7490" fillOpacity="0.08" />
              )}
              {/* Top border line */}
              {levelPaths.linePath && (
                <path d={levelPaths.linePath} fill="none" stroke="#0E7490" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </div>

          {/* Timeline & threshold label */}
          <div className="flex justify-between items-center text-[#94a3b8] font-sans text-[11px] mt-1">
            <span>19 Jan</span>
            <span className="text-[#b45309] font-medium">
              - - Batas elevasi maksimum {formatNumber(maxElevation, 1)} mdpl
            </span>
            <span>17 Feb</span>
          </div>
        </div>

        {/* Trend Card 3: Outflow */}
        <div className="flex flex-col bg-white border border-[#e2e8f0] rounded-[14px] p-5 gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <h4 className="text-[#0f172a] font-sans text-[15px] font-semibold leading-normal">
                Outflow
              </h4>
              <p className="text-[#94a3b8] font-sans text-xs leading-normal">
                m³/s · turbin + spillway
              </p>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[#7c3aed] font-sans text-lg font-bold leading-normal">
                {formatNumber(currentOutflow, 1)}
              </span>
              <span className="text-[#94a3b8] font-sans text-[11px]">terkini</span>
            </div>
          </div>

          {/* SVG Outflow Area Chart */}
          <div className="w-full h-[200px]">
            <svg viewBox="0 0 520 200" className="w-full h-full" preserveAspectRatio="none">
              {/* Horizontal Grid lines */}
              <line x1="0" y1="50" x2="520" y2="50" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="100" x2="520" y2="100" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="150" x2="520" y2="150" stroke="#F1F5F9" strokeWidth="1" />
              
              {/* Filled Area */}
              {outflowPaths.fillPath && (
                <path d={outflowPaths.fillPath} fill="#7C3AED" fillOpacity="0.07" />
              )}
              {/* Top border line */}
              {outflowPaths.linePath && (
                <path d={outflowPaths.linePath} fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </div>

          {/* Timeline labels */}
          <div className="flex justify-between text-[#94a3b8] font-sans text-[11px] mt-1">
            <span>19 Jan</span>
            <span>02 Feb</span>
            <span>17 Feb</span>
          </div>
        </div>

        {/* Trend Card 4: ARR / Rainfall */}
        <div className="flex flex-col bg-white border border-[#e2e8f0] rounded-[14px] p-5 gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <h4 className="text-[#0f172a] font-sans text-[15px] font-semibold leading-normal">
                ARR / Rainfall
              </h4>
              <p className="text-[#94a3b8] font-sans text-xs leading-normal">
                mm/hari · curah hujan stasiun ARR
              </p>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[#2563eb] font-sans text-lg font-bold leading-normal">
                {formatNumber(currentARR, 1)}
              </span>
              <span className="text-[#94a3b8] font-sans text-[11px]">terkini</span>
            </div>
          </div>

          {/* SVG ARR Bar Chart */}
          <div className="w-full h-[200px]">
            <svg viewBox="0 0 520 200" className="w-full h-full" preserveAspectRatio="none">
              {/* Horizontal Grid lines */}
              <line x1="0" y1="50" x2="520" y2="50" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="100" x2="520" y2="100" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="150" x2="520" y2="150" stroke="#F1F5F9" strokeWidth="1" />
              
              {/* 20 Bars */}
              {rainBars.map((bar, idx) => (
                <rect 
                  key={idx}
                  x={bar.x}
                  y={bar.y}
                  width={18}
                  height={bar.h}
                  fill="#3B82F6"
                  opacity="0.85"
                  rx="3"
                />
              ))}
            </svg>
          </div>

          {/* Timeline labels */}
          <div className="flex justify-between text-[#94a3b8] font-sans text-[11px] mt-1">
            <span>19 Jan</span>
            <span>02 Feb</span>
            <span>17 Feb</span>
          </div>
        </div>

      </div>
    </div>
  );
}
