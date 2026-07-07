import { usePLTAStore } from '../../store/plta-store';
import { pltaData } from '../../data/plta-data';
import { formatNumber } from '../../utils/formatters';

export default function Telemetering() {
  const { selectedPLTAId } = usePLTAStore();
  const plta = pltaData.find((p) => p.id === selectedPLTAId) || pltaData[0];

  // Dynamic parameters from store
  const currentInflow = plta.liveData.inflow;
  const currentLevel = plta.liveData.waterLevel;
  const currentOutflow = plta.liveData.outflow;
  const currentARR = plta.liveData.curahHujan || 12.4;
  const deltaHead = plta.liveData.deltaHead || 28.6;
  const targetLevel = plta.liveData.targetLevel || 231.0;
  const volumeEfektif = plta.liveData.volumeEfektif || 41.2;
  const availableEnergy = plta.liveData.currentAvailableEnergy || 96.2;
  const wadukName = plta.waduk || 'Waduk';
  
  // Safe units check
  const unitsList = plta.units || [
    { id: 1, capacity: 61.5 },
    { id: 2, capacity: 61.5 }
  ];

  // Static Date for Live Update Widget
  const liveUpdateStr = "Live · Update 17 Feb 2025, 14:05 WIB";

  // Check if Wonogiri specifically is active to customize terms (e.g. Colo, HJV)
  const isWonogiri = plta.id === 'wonogiri';
  const awlrStationName = isWonogiri ? 'AWLR Sungai Keduang' : 'AWLR Stasiun Hulu';
  const hilirStationName = isWonogiri ? 'TMA Hilir Bendungan Wonogiri' : 'TMA Hilir Bendungan';
  const coloStationName = isWonogiri ? 'TMA Bendung Colo' : 'TMA Bendung Colo (PJT)';
  const secondaryValveName = isWonogiri ? 'Outflow HJV' : 'Outflow Hollow Jet';

  return (
    <div className="flex flex-col flex-1 gap-6 animate-in fade-in duration-500">
      
      {/* Top Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#0f172a] font-display text-2xl font-bold leading-tight">
            Telemetering — PLTA {plta.shortName}
          </h1>
          <p className="text-[#64748b] font-sans text-sm leading-normal">
            {plta.waduk} · {plta.location} · Data real-time telemetering
          </p>
        </div>

        {/* Live Status Widget (No Shadow!) */}
        <div className="flex w-fit h-10 shrink-0 items-center bg-white border border-[#e2e8f0] rounded-[10px] px-3.5 py-0 gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-[#334155] font-sans text-[13px] font-medium">
            {liveUpdateStr}
          </span>
        </div>
      </div>

      {/* 3-Column Layout Grid */}
      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Left Column (Width: 290px shrink-0) */}
        <div className="flex w-full xl:w-[290px] flex-col shrink-0 gap-4">
          
          {/* Card 1: RTOW Chart */}
          <div className="flex flex-col bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
            <div className="flex justify-between items-center border-b border-[#e2e8f0] px-4 py-3 bg-[#f8fafc]">
              <span className="text-[#0f172a] font-sans text-[13px] font-semibold">
                RTOW / Rencana Alokasi Air
              </span>
            </div>
            <div className="flex flex-col px-4 py-3 gap-2">
              <div className="w-full h-20">
                {/* SVG Mini line graph representing RTOW comparatives */}
                <svg viewBox="0 0 250 80" className="w-full h-full">
                  <polyline 
                    points="0,60 25,52 50,40 75,30 100,26 125,34 150,45 175,55 200,62 225,66 250,68" 
                    fill="none" 
                    stroke="#0891b2" 
                    strokeWidth="2" 
                  />
                  <polyline 
                    points="0,64 25,58 50,48 75,38 100,32 125,40 150,52 175,60 200,66 225,70 250,72" 
                    fill="none" 
                    stroke="#94a3b8" 
                    strokeWidth="1.5" 
                    strokeDasharray="4 3" 
                  />
                </svg>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-[3px] bg-[#0891b2] rounded-full"></div>
                  <span className="text-[#64748b] font-sans text-[11px]">Realisasi</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-[3px] bg-[#94a3b8] rounded-full"></div>
                  <span className="text-[#64748b] font-sans text-[11px]">Rencana RTOW</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Alokasi Air & Pintu Bendung */}
          <div className="flex flex-col bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
            <div className="flex border-b border-[#e2e8f0] px-4 py-3 bg-[#f8fafc]">
              <span className="text-[#0f172a] font-sans text-[13px] font-semibold">
                Alokasi Air dan Pintu Bendung
              </span>
            </div>
            <div className="flex flex-col px-4 py-2">
              <div className="flex justify-between items-center border-b border-[#f1f5f9] py-2 text-[12px]">
                <span className="text-[#64748b] font-sans">Rencana Alokasi Air</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[#0f172a] font-sans font-semibold">
                    {formatNumber(currentOutflow * 1.1, 1)}
                  </span>
                  <span className="text-[#94a3b8] font-sans text-[10px]">m³/s</span>
                </div>
              </div>

              {unitsList.map((unit) => (
                <div key={unit.id} className="flex justify-between items-center border-b border-[#f1f5f9] py-2 text-[12px]">
                  <span className="text-[#64748b] font-sans">Outflow Unit {unit.id}</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[#0f172a] font-sans font-semibold">
                      {formatNumber(currentOutflow / unitsList.length, 1)}
                    </span>
                    <span className="text-[#94a3b8] font-sans text-[10px]">m³/s</span>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center border-b border-[#f1f5f9] py-2 text-[12px]">
                <span className="text-[#64748b] font-sans">Outflow Spillway</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[#0f172a] font-sans font-semibold">
                    {formatNumber(plta.liveData.spillway || 0, 1)}
                  </span>
                  <span className="text-[#94a3b8] font-sans text-[10px]">m³/s</span>
                </div>
              </div>

              <div className="flex justify-between items-center border-b border-[#f1f5f9] py-2 text-[12px]">
                <span className="text-[#64748b] font-sans">{secondaryValveName}</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[#0f172a] font-sans font-semibold">
                    {formatNumber(isWonogiri ? 6.5 : 0.0, 1)}
                  </span>
                  <span className="text-[#94a3b8] font-sans text-[10px]">m³/s</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 text-[12px]">
                <span className="text-[#64748b] font-sans">Delta Head</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[#0f172a] font-sans font-semibold">
                    {formatNumber(deltaHead, 1)}
                  </span>
                  <span className="text-[#94a3b8] font-sans text-[10px]">m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Hidrologi Catchment Area */}
          <div className="flex flex-col bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
            <div className="flex border-b border-[#e2e8f0] px-4 py-3 bg-[#f8fafc]">
              <span className="text-[#0f172a] font-sans text-[13px] font-semibold">
                Hidrologi Catchment Area
              </span>
            </div>
            <div className="flex flex-col px-4 py-2">
              <div className="flex justify-between items-center border-b border-[#f1f5f9] py-2 text-[12px]">
                <span className="text-[#64748b] font-sans">Curah Hujan (ARR)</span>
                <span className="text-[#0f172a] font-sans font-semibold">
                  {formatNumber(currentARR, 1)} mm/hari
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-[#f1f5f9] py-2 text-[12px]">
                <span className="text-[#64748b] font-sans">{awlrStationName}</span>
                <span className="text-[#0f172a] font-sans font-semibold">1.82 m</span>
              </div>
              <div className="flex justify-between items-center py-2 text-[12px]">
                <span className="text-[#64748b] font-sans">Inflow Waduk</span>
                <span className="text-[#0f172a] font-sans font-semibold">
                  {formatNumber(currentInflow, 1)} m³/s
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Middle Column (Flex-1) */}
        <div className="flex-1 flex flex-col">
          
          {/* Schematic Dam Layout Graphic Card */}
          <div className="flex relative w-full min-h-[520px] flex-col border border-[#e2e8f0] rounded-xl overflow-hidden bg-slate-50">
            {/* Custom Vector Dam Schematic Background */}
            <div className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center opacity-70">
              <svg viewBox="0 0 800 500" className="w-full h-full" fill="none">
                {/* River/Water reservoir shape */}
                <path d="M 0,200 Q 150,140 300,160 T 550,150 T 800,200 L 800,500 L 0,500 Z" fill="#e0f2fe" />
                <path d="M 0,200 Q 150,140 300,160 T 550,150 T 800,200" stroke="#0ea5e9" strokeWidth="3" />
                
                {/* Secondary Water inlet */}
                <path d="M 120,500 C 130,420 180,360 280,320" stroke="#38bdf8" strokeWidth="12" strokeLinecap="round" />
                <path d="M 280,320 Q 300,310 320,320" stroke="#0ea5e9" strokeWidth="4" />
                
                {/* Dam walls / Structures outlines */}
                <rect x="520" y="80" width="30" height="340" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" rx="4" />
                <rect x="525" y="140" width="20" height="60" fill="#94a3b8" />
                <rect x="525" y="260" width="20" height="60" fill="#94a3b8" />
                
                {/* Powerhouse block */}
                <rect x="560" y="160" width="100" height="120" fill="#94a3b8" stroke="#64748b" strokeWidth="2" rx="6" />
                <rect x="580" y="180" width="60" height="30" fill="#cbd5e1" />
                <circle cx="610" cy="235" r="18" fill="#475569" />
                <circle cx="610" cy="235" r="6" fill="#1e293b" />
                
                {/* Tailrace channel to downstream */}
                <path d="M 660,220 C 720,220 750,260 800,280" stroke="#0284c7" strokeWidth="16" strokeLinecap="round" />
              </svg>
            </div>

            {/* Title Badge overlay (No Shadow!) */}
            <div className="flex absolute items-center left-3 bottom-3 bg-[#0f172a]/70 rounded-2xl px-3 py-1.5 gap-2 z-10">
              <span className="text-white font-sans text-[11px] leading-normal">
                Skema & Citra Udara · Dam {plta.shortName}
              </span>
            </div>

            {/* Positioned hotspots markers (Coordinates mapped realistic) */}
            {/* 1. PLTA Position Cyan */}
            <div className="flex absolute items-center left-[60%] top-[40%] gap-1.5 z-10 transition-transform hover:scale-105">
              <div className="size-3 bg-[#0891b2] rounded-full border-2 border-white animate-pulse"></div>
              <div className="bg-[#ffffffe6] text-[#0f172a] font-sans text-[11px] font-semibold rounded-[10px] px-2 py-0.5 border border-[#e2e8f0]">
                PLTA {plta.shortName}
              </div>
            </div>

            {/* 2. Spillway Position Amber */}
            <div className="flex absolute items-center left-[53%] top-[68%] gap-1.5 z-10 transition-transform hover:scale-105">
              <div className="size-3 bg-[#f59e0b] rounded-full border-2 border-white"></div>
              <div className="bg-[#ffffffe6] text-[#0f172a] font-sans text-[11px] font-semibold rounded-[10px] px-2 py-0.5 border border-[#e2e8f0]">
                Spillway
              </div>
            </div>

            {/* 3. Hollow Jet Valve / Pintu Penguras Position Purple */}
            <div className="flex absolute items-center left-[45%] top-[82%] gap-1.5 z-10 transition-transform hover:scale-105">
              <div className="size-3 bg-[#8b5cf6] rounded-full border-2 border-white"></div>
              <div className="bg-[#ffffffe6] text-[#0f172a] font-sans text-[11px] font-semibold rounded-[10px] px-2 py-0.5 border border-[#e2e8f0]">
                {isWonogiri ? 'Pintu HJV' : 'Pintu Penguras'}
              </div>
            </div>

            {/* 4. Waduk Position Green */}
            <div className="flex absolute items-center left-[28%] top-[25%] gap-1.5 z-10 transition-transform hover:scale-105">
              <div className="size-3 bg-[#22c55e] rounded-full border-2 border-white"></div>
              <div className="bg-[#ffffffe6] text-[#0f172a] font-sans text-[11px] font-semibold rounded-[10px] px-2 py-0.5 border border-[#e2e8f0]">
                {wadukName.split(' ')[0]} {plta.shortName}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Width: 320px shrink-0) */}
        <div className="flex w-full xl:w-[320px] flex-col shrink-0 gap-4">
          
          {/* Card 1: Kondisi Hilir Waduk */}
          <div className="flex w-full h-fit flex-col bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
            <div className="flex border-b border-[#e2e8f0] px-4 py-3 bg-[#f8fafc]">
              <span className="text-[#0f172a] font-sans text-[13px] font-semibold">
                Kondisi Hilir Waduk
              </span>
            </div>
            <div className="flex flex-col px-4 py-2">
              <div className="flex justify-between items-center border-b border-[#f1f5f9] py-2 text-[12px]">
                <span className="text-[#64748b] font-sans">{hilirStationName}</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[#0f172a] font-sans font-semibold">116.42</span>
                  <span className="text-[#94a3b8] font-sans text-[10px]">mdpl</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 text-[12px]">
                <span className="text-[#64748b] font-sans">{coloStationName}</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[#0f172a] font-sans font-semibold">108.15</span>
                  <span className="text-[#94a3b8] font-sans text-[10px]">mdpl</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Pembangkitan Energi Listrik */}
          <div className="flex w-full h-fit flex-col bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
            <div className="flex border-b border-[#e2e8f0] px-4 py-3 bg-[#f8fafc]">
              <span className="text-[#0f172a] font-sans text-[13px] font-semibold">
                Pembangkitan Energi Listrik
              </span>
            </div>
            <div className="flex flex-col px-4 py-3 gap-3">
              {unitsList.map((unit, index) => (
                <div key={unit.id} className="flex flex-col bg-[#f8fafc] rounded-xl p-3 gap-2">
                  <span className="text-[#0e7490] font-sans text-[12px] font-bold">
                    Unit {unit.id}
                  </span>
                  <div className="flex text-center justify-between">
                    <div className="flex flex-col items-start flex-1">
                      <span className="text-[#0f172a] font-sans text-[13px] font-semibold">
                        {formatNumber((plta.liveData.produksi || 0) / unitsList.length, 1)}
                      </span>
                      <span className="text-[#94a3b8] font-sans text-[9px] uppercase tracking-wider">MW</span>
                    </div>
                    <div className="flex flex-col items-center flex-1 border-l border-r border-[#e2e8f0]">
                      <span className="text-[#0f172a] font-sans text-[13px] font-semibold">
                        {formatNumber(currentOutflow / unitsList.length, 1)}
                      </span>
                      <span className="text-[#94a3b8] font-sans text-[9px] uppercase tracking-wider">Outflow</span>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-[#0f172a] font-sans text-[13px] font-semibold">
                        {formatNumber(1.8 + index * 0.05, 2)}
                      </span>
                      <span className="text-[#94a3b8] font-sans text-[9px] uppercase tracking-wider">SWC</span>
                    </div>
                    <div className="flex flex-col items-end flex-1 border-l border-[#e2e8f0]">
                      <span className="text-[#0f172a] font-sans text-[13px] font-semibold">
                        {85 + index * 2}%
                      </span>
                      <span className="text-[#94a3b8] font-sans text-[9px] uppercase tracking-wider">Efisiensi</span>
                    </div>
                  </div>
                </div>
              ))}
              <span className="text-[#94a3b8] font-sans text-[9px] italic leading-normal">
                ** rencana pengembangan selanjutnya untuk kalkulasi efisiensi air secara otomatis
              </span>
            </div>
          </div>

          {/* Card 3: Forecast Ketersediaan Energi Listrik */}
          <div className="flex w-full h-fit flex-col bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
            <div className="flex border-b border-[#e2e8f0] px-4 py-3 bg-[#f8fafc]">
              <span className="text-[#0f172a] font-sans text-[13px] font-semibold">
                Forecast Ketersediaan Energi Listrik
              </span>
            </div>
            <div className="flex flex-col px-4 py-2">
              <div className="flex justify-between items-center border-b border-[#f1f5f9] py-2 text-[12px]">
                <span className="text-[#64748b] font-sans">Ketersediaan Energi Listrik</span>
                <span className="text-[#0f172a] font-sans font-semibold">12.4 GWh</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#f1f5f9] py-2 text-[12px]">
                <span className="text-[#64748b] font-sans">Service Hour 1 Unit</span>
                <span className="text-[#0f172a] font-sans font-semibold">18 Jam</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#f1f5f9] py-2 text-[12px]">
                <span className="text-[#64748b] font-sans">Service Hour 2 Unit</span>
                <span className="text-[#0f172a] font-sans font-semibold">16 Jam</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#f1f5f9] py-2 text-[12px]">
                <span className="text-[#64748b] font-sans">Prediksi Inflow</span>
                <span className="text-[#0f172a] font-sans font-semibold">
                  {formatNumber(currentInflow * 0.95, 1)} m³/detik
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-[#f1f5f9] py-2 text-[12px]">
                <span className="text-[#64748b] font-sans">Prediksi Daya Mampu Produksi</span>
                <span className="text-[#0f172a] font-sans font-semibold">11.8 MW</span>
              </div>
              <div className="flex justify-between items-center py-2 text-[12px]">
                <span className="text-[#64748b] font-sans">Prediksi Titik Muka Air</span>
                <span className="text-[#0f172a] font-sans font-semibold">133.10 mdpl</span>
              </div>
            </div>
          </div>

          {/* Card 4: Kondisi Waduk Wonogiri (Cyan Highlight Card) */}
          <div className="flex w-full h-fit flex-col bg-[#ecfeff] border border-[#a5f3fc] rounded-xl overflow-hidden">
            <div className="flex border-b border-[#a5f3fc] px-4 py-3">
              <span className="text-[#0e7490] font-sans text-[13px] font-bold">
                Kondisi Waduk {plta.shortName}
              </span>
            </div>
            <div className="flex flex-col px-4 py-2">
              <div className="flex justify-between items-center border-b border-[#cffafe] py-2 text-[12px]">
                <span className="text-[#155e75] font-sans">Titik Muka Air Waduk</span>
                <span className="text-[#0e7490] font-sans font-bold">
                  {formatNumber(currentLevel, 2)} mdpl
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-[#cffafe] py-2 text-[12px]">
                <span className="text-[#155e75] font-sans">Volume Efektif *</span>
                <span className="text-[#0e7490] font-sans font-bold">
                  {formatNumber(volumeEfektif, 1)} (x 10⁶ m³)
                </span>
              </div>
              <div className="flex justify-between items-center py-2 text-[12px]">
                <span className="text-[#155e75] font-sans">Estimasi Ketersediaan Energi</span>
                <span className="text-[#0e7490] font-sans font-bold">
                  {formatNumber(availableEnergy, 1)} GWh
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Section: Informasi Pola Operasi */}
      <div className="flex flex-col gap-3 mt-2">
        <h3 className="text-[#0f172a] font-sans text-base font-bold">
          Informasi Pola Operasi dan Pintu-Pintu Bendung
        </h3>
        
        {/* Grid of 4 Operations cards with themed illustrations */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          
          {/* Operasi 1: Spillway */}
          <div className="flex h-fit flex-col bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
            {/* Spillway illustration */}
            <div className="w-full h-[120px] bg-sky-50 flex items-center justify-center border-b border-[#e2e8f0]">
              <svg viewBox="0 0 200 120" className="w-full h-full opacity-80">
                <path d="M 0,90 Q 50,90 80,70 T 120,40 T 170,40 L 200,40 L 200,120 L 0,120 Z" fill="#bae6fd" />
                <path d="M 80,70 L 80,120" stroke="#cbd5e1" strokeWidth="6" />
                <path d="M 120,40 L 120,120" stroke="#cbd5e1" strokeWidth="6" />
                <path d="M 0,90 Q 50,90 80,70 T 120,40 T 170,40" stroke="#0ea5e9" strokeWidth="2.5" fill="none" />
                <rect x="74" y="55" width="12" height="18" fill="#ef4444" rx="2" />
                <rect x="114" y="25" width="12" height="18" fill="#ef4444" rx="2" />
              </svg>
            </div>
            <div className="flex flex-col px-4 py-3 gap-1.5">
              <span className="text-[#0e7490] font-sans text-[13px] font-bold">Spillway</span>
              <p className="text-[#334155] font-sans text-[11px] leading-relaxed">
                Fungsi: melepaskan kelebihan debit saat elevasi waduk melampaui batas operasi.
              </p>
              <p className="text-[#64748b] font-sans text-[11px] leading-relaxed">
                Batasan Operasi: elevasi {formatNumber(targetLevel, 1)} mdpl
              </p>
              <p className="text-[#64748b] font-sans text-[11px] leading-relaxed">
                Pola Operasi: dibuka bertahap sesuai SOP penanggulangan banjir
              </p>
            </div>
          </div>

          {/* Operasi 2: Hollow Jet / Pintu Penguras */}
          <div className="flex h-fit flex-col bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
            {/* Valve illustration */}
            <div className="w-full h-[120px] bg-purple-50 flex items-center justify-center border-b border-[#e2e8f0]">
              <svg viewBox="0 0 200 120" className="w-full h-full opacity-80">
                <circle cx="100" cy="60" r="30" fill="#e9d5ff" stroke="#c084fc" strokeWidth="2" />
                <circle cx="100" cy="60" r="18" fill="#a855f7" />
                <line x1="100" y1="20" x2="100" y2="100" stroke="#7e22ce" strokeWidth="4" />
                <line x1="60" y1="60" x2="140" y2="60" stroke="#7e22ce" strokeWidth="4" />
              </svg>
            </div>
            <div className="flex flex-col px-4 py-3 gap-1.5">
              <span className="text-[#0e7490] font-sans text-[13px] font-bold">
                {isWonogiri ? 'Pintu HJV' : 'Pintu Penguras Utama'}
              </span>
              <p className="text-[#334155] font-sans text-[11px] leading-relaxed">
                Fungsi: menyalurkan debit air irigasi ke hilir sungai tanpa melalui unit turbin pembangkit.
              </p>
              <p className="text-[#64748b] font-sans text-[11px] leading-relaxed">
                Batasan Operasi: maks. bukaan 100% pada elevasi tertentu harian
              </p>
              <p className="text-[#64748b] font-sans text-[11px] leading-relaxed">
                Pola Operasi: mengikuti kebutuhan air irigasi hilir Colo / daerah irigasi
              </p>
            </div>
          </div>

          {/* Operasi 3: Pembangkitan Energi */}
          <div className="flex h-fit flex-col bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
            {/* Turbine Generator illustration */}
            <div className="w-full h-[120px] bg-emerald-50 flex items-center justify-center border-b border-[#e2e8f0]">
              <svg viewBox="0 0 200 120" className="w-full h-full opacity-80">
                <rect x="80" y="30" width="40" height="60" fill="#a7f3d0" stroke="#34d399" strokeWidth="2" rx="4" />
                <circle cx="100" cy="60" r="22" fill="#059669" />
                <line x1="70" y1="60" x2="130" y2="60" stroke="#047857" strokeWidth="3" />
                <line x1="100" y1="30" x2="100" y2="90" stroke="#047857" strokeWidth="3" />
                <circle cx="100" cy="60" r="8" fill="#10b981" />
              </svg>
            </div>
            <div className="flex flex-col px-4 py-3 gap-1.5">
              <span className="text-[#0e7490] font-sans text-[13px] font-bold">Pembangkitan Energi</span>
              <p className="text-[#334155] font-sans text-[11px] leading-relaxed">
                Fungsi: memanfaatkan debit outflow tampungan untuk produksi listrik 2 unit turbin.
              </p>
              <p className="text-[#64748b] font-sans text-[11px] leading-relaxed">
                Batasan Operasi: elevasi minimum operasi unit generator turbin harian
              </p>
              <p className="text-[#64748b] font-sans text-[11px] leading-relaxed">
                Pola Operasi: mengikuti rencana alokasi air harian PLN dan ketersediaan air
              </p>
            </div>
          </div>

          {/* Operasi 4: Pola Operasi Waduk */}
          <div className="flex h-fit flex-col bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
            {/* Reservoir illustration */}
            <div className="w-full h-[120px] bg-slate-50 flex items-center justify-center border-b border-[#e2e8f0]">
              <svg viewBox="0 0 200 120" className="w-full h-full opacity-80">
                <path d="M 10,90 Q 50,50 100,60 T 190,40 L 190,110 L 10,110 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
                <path d="M 10,70 Q 50,30 100,45 T 190,25" stroke="#3b82f6" strokeWidth="2" fill="none" />
                <circle cx="100" cy="45" r="4" fill="#3b82f6" />
                <line x1="100" y1="45" x2="100" y2="100" stroke="#cbd5e1" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="flex flex-col px-4 py-3 gap-1.5">
              <span className="text-[#0e7490] font-sans text-[13px] font-bold">Waduk {plta.shortName}</span>
              <p className="text-[#334155] font-sans text-[11px] leading-relaxed">
                Fungsi: melepaskan debit untuk irigasi Colo secara tetap dengan persediaan air el. 127.0 s.d 134.5 mdpl.
              </p>
              <p className="text-[#64748b] font-sans text-[11px] leading-relaxed">
                Elevasi Tampungan Banjir: 134,5 – 138,2 mdpl
              </p>
              <p className="text-[#64748b] font-sans text-[11px] leading-relaxed">
                Pola Operasi: diatur terpusat untuk keseimbangan hidrologi hulu-hilir Jawa Tengah
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
