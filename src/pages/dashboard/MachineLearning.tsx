import { usePLTAStore } from '../../store/plta-store';
import { pltaData } from '../../data/plta-data';
import { formatNumber } from '../../utils/formatters';
import { AlertTriangle, Droplet, ArrowUpRight } from 'lucide-react';

export default function MachineLearning() {
  const { selectedPLTAId } = usePLTAStore();
  const plta = pltaData.find((p) => p.id === selectedPLTAId) || pltaData[0];

  // Derive dynamic forecasting stats from plta data to make it realistic
  const currentInflow = plta.liveData.inflow;
  const currentLevel = plta.liveData.waterLevel;
  const targetLevel = plta.liveData.targetLevel || 231.00;
  
  // Calculate relative stats based on station capacity
  const isLargePLTA = plta.capacity > 100;
  const inflowPeak = isLargePLTA ? currentInflow * 1.67 : currentInflow * 1.45;
  const totalSpillVolume = isLargePLTA ? 0.84 : 0.12;
  const isSpillwayRisk = isLargePLTA; // Only large PLTA like Mrica has spillway warnings in this mock setup

  // Daily forecast projection array (10 days: 4 actual, 6 forecast)
  const forecastDays = [
    { date: '15 Feb', value: isLargePLTA ? 96 : 42, isActual: true },
    { date: '16 Feb', value: isLargePLTA ? 110 : 45, isActual: true },
    { date: '17 Feb', value: isLargePLTA ? 124 : 48, isActual: true },
    { date: 'Hari ini', value: Math.round(currentInflow), isActual: true, isToday: true },
    { date: '19 Feb', value: isLargePLTA ? 168.2 : 62.4, isActual: false, level: 229.10, outflow: 148.0, spill: 0.0, status: 'Normal' },
    { date: '20 Feb', value: isLargePLTA ? 196.5 : 68.2, isActual: false, level: 230.05, outflow: 162.0, spill: 0.0, status: 'Normal' },
    { date: '21 Feb', value: Math.round(inflowPeak), isActual: false, level: 230.88, outflow: 168.0, spill: 24.6, status: 'Siaga', isWarning: true },
    { date: '22 Feb', value: isLargePLTA ? 224.0 : 71.0, isActual: false, level: 230.92, outflow: 168.0, spill: 18.2, status: 'Siaga', isWarning: true },
    { date: '23 Feb', value: isLargePLTA ? 172.0 : 54.0, isActual: false, level: 230.31, outflow: 165.0, spill: 0.0, status: 'Normal' },
    { date: '24 Feb', value: isLargePLTA ? 140.0 : 47.0, isActual: false, level: 229.64, outflow: 156.0, spill: 0.0, status: 'Normal' },
  ];

  // Map values for the custom bar heights inside a 240px container
  const maxValue = Math.max(...forecastDays.map(d => d.value));
  const chartLimit = maxValue * 1.1; // scale height to give 10% top margin
  const spillwayThreshold = isLargePLTA ? 210 : 80;

  return (
    <div className="flex flex-col flex-1 gap-6 animate-in fade-in duration-500">
      {/* Page Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-[#0f172a] font-display text-2xl font-bold leading-normal">
              Forecasting Inflow
            </h1>
            <div className="flex items-center bg-[#ecfeff] border border-[#a5f3fc] rounded-full px-2.5 py-1 gap-1.5">
              <Droplet size={12} className="text-[#0891b2]" />
              <span className="text-[#0891b2] font-sans text-xs font-semibold">
                PLTA {plta.shortName}
              </span>
            </div>
          </div>
          <p className="text-[#64748b] font-sans text-sm leading-normal">
            Prediksi inflow waduk {plta.shortName} & kalkulasi potensi limpasan 7 hari ke depan
          </p>
        </div>
        
        {/* Date Selector Widget (No Shadow!) */}
        <div className="flex h-10 shrink-0 items-center bg-white border border-[#e2e8f0] rounded-[10px] px-3.5 py-0 gap-2">
          <span className="text-[#334155] font-sans text-[13px] font-medium">
            18 – 24 Feb 2025
          </span>
        </div>
      </div>

      {/* KPI Cards Row (No Shadow!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Inflow Saat Ini */}
        <div className="flex flex-col bg-white border border-[#e2e8f0] rounded-xl p-5 gap-1.5">
          <div className="text-[#64748b] font-sans text-xs font-medium tracking-[0.6px] uppercase">
            Inflow Saat Ini
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[#0f172a] font-sans text-[26px] font-bold">
              {formatNumber(currentInflow, 1)}
            </span>
            <span className="text-[#94a3b8] font-sans text-[13px] font-medium">m³/s</span>
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpRight size={14} className="text-[#059669]" />
            <span className="text-[#059669] font-sans text-xs font-medium">+12% vs kemarin</span>
          </div>
        </div>

        {/* Card 2: Prediksi Inflow Puncak */}
        <div className="flex flex-col bg-white border border-[#e2e8f0] rounded-xl p-5 gap-1.5">
          <div className="text-[#64748b] font-sans text-xs font-medium tracking-[0.6px] uppercase">
            Prediksi Inflow Puncak
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[#0891b2] font-sans text-[26px] font-bold">
              {formatNumber(inflowPeak, 1)}
            </span>
            <span className="text-[#94a3b8] font-sans text-[13px] font-medium">m³/s</span>
          </div>
          <div className="text-[#64748b] font-sans text-xs font-medium">
            Kamis, 21 Feb · 03:00 WIB
          </div>
        </div>

        {/* Card 3: Elevasi Waduk */}
        <div className="flex flex-col bg-white border border-[#e2e8f0] rounded-xl p-5 gap-1.5">
          <div className="text-[#64748b] font-sans text-xs font-medium tracking-[0.6px] uppercase">
            Elevasi Waduk
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[#0f172a] font-sans text-[26px] font-bold">
              {formatNumber(currentLevel, 2)}
            </span>
            <span className="text-[#94a3b8] font-sans text-[13px] font-medium">mdpl</span>
          </div>
          <div className="text-[#64748b] font-sans text-xs font-medium">
            Ambang limpas {formatNumber(targetLevel, 2)} mdpl
          </div>
        </div>

        {/* Card 4: Prediksi Limpasan */}
        <div className={`flex flex-col border rounded-xl p-5 gap-1.5 ${
          isSpillwayRisk ? 'bg-[#fffbeb] border-[#fde68a]' : 'bg-white border-[#e2e8f0]'
        }`}>
          <div className="flex items-center gap-1.5">
            {isSpillwayRisk && <AlertTriangle size={13} className="text-[#b45309]" />}
            <div className={`${isSpillwayRisk ? 'text-[#b45309]' : 'text-[#64748b]'} font-sans text-xs font-medium tracking-[0.6px] uppercase`}>
              Prediksi Limpasan
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`${isSpillwayRisk ? 'text-[#b45309]' : 'text-[#0f172a]'} font-sans text-[26px] font-bold`}>
              {formatNumber(totalSpillVolume, 2)}
            </span>
            <span className="text-[#94a3b8] font-sans text-[13px] font-medium">juta m³</span>
          </div>
          <div className="text-[#64748b] font-sans text-xs font-medium">
            {isSpillwayRisk ? 'Potensi limpas 21–22 Feb' : 'Tidak ada potensi limpasan'}
          </div>
        </div>
      </div>

      {/* Inflow Chart Container (No Shadow!) */}
      <div className="flex flex-col bg-white border border-[#e2e8f0] rounded-xl p-6 gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-[#0f172a] font-sans text-base font-semibold">
              Inflow Waduk {plta.shortName} — Aktual vs Prediksi
            </h3>
            <p className="text-[#64748b] font-sans text-xs leading-normal">
              Rata-rata harian (m³/s), model update terakhir 06:00 WIB
            </p>
          </div>
          
          {/* Chart Legend */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 bg-[#94a3b8] rounded-[3px]"></div>
              <span className="text-[#64748b] font-sans text-xs">Aktual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 bg-[#06b6d4] rounded-[3px]"></div>
              <span className="text-[#64748b] font-sans text-xs">Prediksi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-0 border-t-2 border-[#f59e0b]"></div>
              <span className="text-[#64748b] font-sans text-xs">Ambang limpas</span>
            </div>
          </div>
        </div>

        {/* Custom Rendered Bar Chart (Consistent with mockup & responsive) */}
        <div className="flex relative w-full h-[260px] items-end border-b border-[#e2e8f0] px-2 py-0 gap-3 sm:gap-5 mt-4">
          {/* Spillway Threshold Horizontal Line */}
          <div 
            className="flex absolute justify-end left-0 right-0 border-t-2 border-t-[#f59e0b] z-10 pointer-events-none"
            style={{ bottom: `${(spillwayThreshold / chartLimit) * 100}%` }}
          >
            <span className="mt-[-9px] bg-[#fffbeb] text-[#b45309] font-sans text-[11px] font-medium px-1.5 py-0.5 rounded border border-[#fde68a]">
              {spillwayThreshold} m³/s
            </span>
          </div>

          {/* Render Columns */}
          {forecastDays.map((day, idx) => {
            const heightPercent = (day.value / chartLimit) * 100;
            return (
              <div key={idx} className="flex h-full flex-col justify-end items-center flex-1 gap-2 z-0">
                <div 
                  className={`w-full max-w-[44px] rounded-t-md transition-all duration-500 ${
                    day.isActual ? 'bg-[#94a3b8]' : 'bg-[#06b6d4]'
                  } ${day.isWarning ? 'border-2 border-[#f59e0b]' : ''}`}
                  style={{ height: `${heightPercent}%` }}
                  title={`${day.date}: ${day.value} m³/s`}
                />
                <span className={`text-[11px] leading-normal font-sans text-center whitespace-nowrap ${
                  day.isToday ? 'text-[#334155] font-semibold' : 'text-[#94a3b8]'
                }`}>
                  {day.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Grid: Spillway Calculation & Daily Forecast Table */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Spillway Calculation Card */}
        <div className="flex w-full lg:w-[380px] flex-col shrink-0 bg-white border border-[#e2e8f0] rounded-xl p-6 gap-4">
          <div className="flex items-center gap-2">
            <h4 className="text-[#0f172a] font-sans text-base font-semibold flex-1">
              Kalkulasi Limpasan
            </h4>
            <div className={`flex items-center rounded-full px-2.5 py-1 gap-[5px] ${
              isSpillwayRisk ? 'bg-[#fef3c7]' : 'bg-green-100'
            }`}>
              <AlertTriangle size={11} className={isSpillwayRisk ? 'text-[#b45309]' : 'text-green-700'} />
              <span className={`font-sans text-[11px] font-bold uppercase ${
                isSpillwayRisk ? 'text-[#b45309]' : 'text-green-700'
              }`}>
                {isSpillwayRisk ? 'Siaga' : 'Aman'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64748b] font-medium">Elevasi terhadap ambang limpas</span>
              <span className={`font-semibold ${isSpillwayRisk ? 'text-[#b45309]' : 'text-green-700'}`}>
                {isSpillwayRisk ? '92%' : '84%'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#f1f5f9] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${isSpillwayRisk ? 'bg-[#f59e0b]' : 'bg-green-500'}`}
                style={{ width: isSpillwayRisk ? '92%' : '84%' }}
              />
            </div>
            <div className="flex justify-between text-[#94a3b8] text-[11px]">
              <span>224.50 mdpl</span>
              <span>231.00 mdpl</span>
            </div>
          </div>

          <div className="flex flex-col divide-y divide-[#f1f5f9]">
            <div className="flex justify-between items-center py-2 text-[13px]">
              <span className="text-[#64748b]">Elevasi saat ini</span>
              <span className="text-[#0f172a] font-semibold">{formatNumber(currentLevel, 2)} mdpl</span>
            </div>
            <div className="flex justify-between items-center py-2 text-[13px]">
              <span className="text-[#64748b]">Volume tampung efektif</span>
              <span className="text-[#0f172a] font-semibold">{isLargePLTA ? '32.4' : '8.6'} juta m³</span>
            </div>
            <div className="flex justify-between items-center py-2 text-[13px]">
              <span className="text-[#64748b]">Sisa kapasitas tampung</span>
              <span className="text-[#0f172a] font-semibold">{isLargePLTA ? '6.1' : '1.8'} juta m³</span>
            </div>
            <div className="flex justify-between items-center py-2 text-[13px]">
              <span className="text-[#64748b]">Inflow kumulatif 72 jam (prediksi)</span>
              <span className="text-[#0f172a] font-semibold">{isLargePLTA ? '48.9' : '14.2'} juta m³</span>
            </div>
            <div className="flex justify-between items-center py-2 text-[13px]">
              <span className="text-[#64748b]">Outflow turbin maks. 72 jam</span>
              <span className="text-[#0f172a] font-semibold">{isLargePLTA ? '42.0' : '12.2'} juta m³</span>
            </div>
          </div>

          <div className={`flex justify-between items-center border rounded-[10px] px-3.5 py-3 gap-3 ${
            isSpillwayRisk ? 'bg-[#fffbeb] border-[#fde68a]' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`${isSpillwayRisk ? 'text-[#92400e]' : 'text-slate-600'} font-sans text-[13px] font-medium`}>
              Estimasi limpasan
            </span>
            <span className={`${isSpillwayRisk ? 'text-[#b45309]' : 'text-slate-800'} font-sans text-lg font-bold`}>
              {formatNumber(totalSpillVolume, 2)} juta m³
            </span>
          </div>
          <p className="text-[#94a3b8] font-sans text-[11px] leading-relaxed">
            Limpasan = inflow kumulatif − (outflow turbin + sisa kapasitas). Nilai positif menandakan potensi pelimpahan melalui spillway.
          </p>
        </div>

        {/* Right Side: Daily Forecast Table */}
        <div className="flex-1 flex flex-col bg-white border border-[#e2e8f0] rounded-xl p-6 gap-3">
          <h4 className="text-[#0f172a] font-sans text-base font-semibold">
            Detail Forecast Harian
          </h4>
          
          <div className="flex flex-col w-full overflow-x-auto">
            {/* Table Header */}
            <div className="flex h-[38px] items-center bg-[#f8fafc] rounded-lg px-3.5 gap-2 min-w-[500px]">
              <div className="w-20 text-[#64748b] font-sans text-[11px] font-semibold uppercase tracking-[0.55px]">
                Tanggal
              </div>
              <div className="flex-1 text-[#64748b] font-sans text-[11px] font-semibold uppercase tracking-[0.55px] text-right">
                Inflow (m³/s)
              </div>
              <div className="flex-1 text-[#64748b] font-sans text-[11px] font-semibold uppercase tracking-[0.55px] text-right">
                Elevasi (mdpl)
              </div>
              <div className="flex-1 text-[#64748b] font-sans text-[11px] font-semibold uppercase tracking-[0.55px] text-right">
                Outflow (m³/s)
              </div>
              <div className="flex-1 text-[#64748b] font-sans text-[11px] font-semibold uppercase tracking-[0.55px] text-right">
                Limpas (m³/s)
              </div>
              <div className="w-[92px] text-[#64748b] font-sans text-[11px] font-semibold uppercase tracking-[0.55px] text-right">
                Status
              </div>
            </div>

            {/* Table Rows */}
            <div className="flex flex-col min-w-[500px] divide-y divide-[#f1f5f9]">
              {forecastDays.filter(day => !day.isActual).map((day, idx) => (
                <div key={idx} className="flex h-11 items-center px-3.5 gap-2 hover:bg-slate-50/50 transition-colors">
                  <div className="w-20 text-[#334155] font-sans text-[13px] font-medium">
                    {day.date}
                  </div>
                  <div className="flex-1 text-[#0f172a] font-sans text-[13px] font-semibold text-right">
                    {formatNumber(day.value, 1)}
                  </div>
                  <div className="flex-1 text-[#334155] font-sans text-[13px] text-right">
                    {day.level ? formatNumber(day.level, 2) : '-'}
                  </div>
                  <div className="flex-1 text-[#334155] font-sans text-[13px] text-right">
                    {day.outflow ? formatNumber(day.outflow, 1) : '-'}
                  </div>
                  <div className={`flex-1 font-sans text-[13px] text-right ${day.spill && day.spill > 0 ? 'text-[#b45309] font-semibold' : 'text-[#94a3b8]'}`}>
                    {day.spill ? formatNumber(day.spill, 1) : '0.0'}
                  </div>
                  <div className="w-[92px] flex justify-end">
                    <span className={`font-sans text-[11px] font-semibold rounded-full px-2.5 py-[3px] ${
                      day.status === 'Siaga' ? 'bg-[#fef3c7] text-[#b45309]' : 'bg-[#d1fae5] text-[#047857]'
                    }`}>
                      {day.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
