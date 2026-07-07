import { useState, useMemo } from 'react';
import { usePLTAStore } from '../../store/plta-store';
import { pltaData } from '../../data/plta-data';
import { useNotificationStore } from '../../store/notification-store';
import { formatNumber } from '../../utils/formatters';
import { Eye, Download, ChevronDown, ChevronUp } from 'lucide-react';

interface ReportRow {
  date: string;
  average: number;
  min: number;
  max: number;
  source: string;
}

export default function Reports() {
  const { selectedPLTAId } = usePLTAStore();
  const { addToast } = useNotificationStore();
  const plta = pltaData.find((p) => p.id === selectedPLTAId) || pltaData[0];

  // States
  const [parameter, setParameter] = useState<'inflow' | 'waterLevel' | 'outflow' | 'produksi'>('inflow');
  const [year, setYear] = useState('2025');
  const [month, setMonth] = useState('Februari');
  const [showAllRows, setShowAllRows] = useState(false);

  // Parameter Display mapping
  const paramInfo = {
    inflow: { label: 'Inflow (Tahun + Bulan)', unit: 'm³/s', columnName: 'Inflow Rata-Rata', baseVal: plta.liveData.inflow },
    waterLevel: { label: 'TMA / Elevasi (Tahun + Bulan)', unit: 'mdpl', columnName: 'TMA Rata-Rata', baseVal: plta.liveData.waterLevel },
    outflow: { label: 'Outflow (Tahun + Bulan)', unit: 'm³/s', columnName: 'Outflow Rata-Rata', baseVal: plta.liveData.outflow },
    produksi: { label: 'Produksi Listrik (Tahun + Bulan)', unit: 'MW', columnName: 'Produksi Rata-Rata', baseVal: plta.liveData.produksi || 0 },
  };

  // Generate 28 mock rows of data based on selected PLTA & Parameter
  const reportData = useMemo<ReportRow[]>(() => {
    const data: ReportRow[] = [];
    const base = paramInfo[parameter].baseVal;
    
    // Seeded random helper based on date index to keep data consistent between renders
    const getSeededRandom = (seed: number) => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    for (let day = 1; day <= 28; day++) {
      const rand = getSeededRandom(day + (parameter === 'inflow' ? 10 : 20));
      const avgVal = base - (base * 0.1) + (rand * (base * 0.2));
      const minVal = avgVal - (avgVal * 0.15 * rand);
      const maxVal = avgVal + (avgVal * 0.15 * (1 - rand));

      data.push({
        date: `${day.toString().padStart(2, '0')} Feb ${year}`,
        average: avgVal,
        min: minVal,
        max: maxVal,
        source: 'Telemetri',
      });
    }
    return data;
  }, [plta.id, parameter, year]);

  // Calculate totals/averages
  const summaryStats = useMemo(() => {
    const total = reportData.reduce((acc, row) => acc + row.average, 0);
    const avg = total / reportData.length;
    const min = Math.min(...reportData.map((row) => row.min));
    const max = Math.max(...reportData.map((row) => row.max));
    return { avg, min, max };
  }, [reportData]);

  const handleExportCSV = () => {
    addToast({ type: 'success', message: `Laporan ${paramInfo[parameter].columnName} ${month} ${year} sedang diunduh` });
  };

  const handleShowData = () => {
    addToast({ type: 'info', message: `Menampilkan data ${paramInfo[parameter].columnName}` });
  };

  const displayedRows = showAllRows ? reportData : reportData.slice(0, 7);

  return (
    <div className="flex flex-col flex-1 gap-6 animate-in fade-in duration-500">
      {/* Header Info */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[#0f172a] font-display text-2xl font-bold leading-normal">
          Laporan
        </h1>
        <p className="text-[#64748b] font-sans text-sm leading-normal">
          Buka atau unduh data historis PLTA {plta.name} berdasarkan parameter dan periode
        </p>
      </div>

      {/* Filter Row Panel (No Shadow!) */}
      <div className="flex flex-col lg:flex-row lg:items-end bg-white border border-[#e2e8f0] rounded-xl p-5 gap-4">
        <div className="flex flex-col sm:flex-row flex-1 gap-3">
          {/* Parameter Select */}
          <div className="flex flex-col flex-1 gap-1.5">
            <span className="text-[#64748b] font-sans text-xs font-medium leading-normal">
              Parameter
            </span>
            <select
              value={parameter}
              onChange={(e) => setParameter(e.target.value as any)}
              className="h-10 w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 text-[#334155] font-sans text-[13px] font-medium focus:outline-none focus:border-[#0891b2]"
            >
              <option value="inflow">Inflow (Tahun + Bulan)</option>
              <option value="waterLevel">TMA / Elevasi (Tahun + Bulan)</option>
              <option value="outflow">Outflow (Tahun + Bulan)</option>
              <option value="produksi">Produksi Listrik (Tahun + Bulan)</option>
            </select>
          </div>

          {/* Year Select */}
          <div className="flex flex-col w-full sm:w-[140px] shrink-0 gap-1.5">
            <span className="text-[#64748b] font-sans text-xs font-medium leading-normal">
              Tahun
            </span>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="h-10 w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 text-[#334155] font-sans text-[13px] font-medium focus:outline-none focus:border-[#0891b2]"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>

          {/* Month Select */}
          <div className="flex flex-col w-full sm:w-[160px] shrink-0 gap-1.5">
            <span className="text-[#64748b] font-sans text-xs font-medium leading-normal">
              Bulan
            </span>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-10 w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 text-[#334155] font-sans text-[13px] font-medium focus:outline-none focus:border-[#0891b2]"
            >
              <option value="Januari">Januari</option>
              <option value="Februari">Februari</option>
              <option value="Maret">Maret</option>
              <option value="April">April</option>
              <option value="Mei">Mei</option>
              <option value="Juni">Juni</option>
              <option value="Juli">Juli</option>
              <option value="Agustus">Agustus</option>
              <option value="September">September</option>
              <option value="Oktober">Oktober</option>
              <option value="November">November</option>
              <option value="Desember">Desember</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex shrink-0 gap-2.5">
          <button
            onClick={handleShowData}
            className="flex h-10 items-center justify-center bg-[#0891b2] hover:bg-[#0e7490] text-white font-sans text-[13px] font-semibold rounded-lg px-[18px] py-0 gap-2 border-0 cursor-pointer transition-colors"
          >
            <Eye size={16} />
            <span>Tampilkan</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex h-10 items-center justify-center bg-white border border-[#0891b2] text-[#0891b2] hover:bg-[#ecfeff] font-sans text-[13px] font-semibold rounded-lg px-[18px] py-0 gap-2 cursor-pointer transition-colors"
          >
            <Download size={16} />
            <span>Unduh CSV</span>
          </button>
        </div>
      </div>

      {/* Data Table Card (No Shadow!) */}
      <div className="flex h-fit flex-col bg-white border border-[#e2e8f0] rounded-xl p-6 gap-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-[#0f172a] font-sans text-base font-semibold">
              Data {paramInfo[parameter].columnName.split(' ')[0]} — PLTA {plta.shortName}
            </h3>
            <p className="text-[#94a3b8] font-sans text-xs leading-normal">
              Periode {month} {year} · rata-rata harian ({paramInfo[parameter].unit})
            </p>
          </div>
          <span className="text-[#94a3b8] font-sans text-xs leading-normal">
            Menampilkan {displayedRows.length} dari {reportData.length} baris
          </span>
        </div>

        {/* Data Table */}
        <div className="flex w-full flex-col overflow-x-auto">
          {/* Table Header Row */}
          <div className="flex h-[38px] items-center bg-[#f8fafc] rounded-lg px-3.5 py-0 gap-2 min-w-[600px]">
            <div className="text-[#64748b] font-sans text-[11px] font-semibold uppercase tracking-[0.55px] flex-1">
              Tanggal
            </div>
            <div className="w-[160px] text-[#64748b] font-sans text-[11px] font-semibold uppercase tracking-[0.55px] text-right">
              {paramInfo[parameter].columnName}
            </div>
            <div className="w-[130px] text-[#64748b] font-sans text-[11px] font-semibold uppercase tracking-[0.55px] text-right">
              Min
            </div>
            <div className="w-[130px] text-[#64748b] font-sans text-[11px] font-semibold uppercase tracking-[0.55px] text-right">
              Max
            </div>
            <div className="w-[140px] text-[#64748b] font-sans text-[11px] font-semibold uppercase tracking-[0.55px] text-right">
              Sumber
            </div>
          </div>

          {/* Table Body rows */}
          <div className="flex flex-col min-w-[600px] divide-y divide-[#f1f5f9]">
            {displayedRows.map((row, idx) => (
              <div key={idx} className="flex h-11 items-center px-3.5 py-0 gap-2 hover:bg-slate-50/50 transition-colors">
                <div className="text-[#334155] font-sans text-[13px] font-medium flex-1">
                  {row.date}
                </div>
                <div className="w-[160px] text-[#0891b2] font-sans text-[13px] font-semibold text-right">
                  {formatNumber(row.average, parameter === 'waterLevel' ? 2 : 1)}
                </div>
                <div className="w-[130px] text-[#64748b] font-sans text-[13px] text-right">
                  {formatNumber(row.min, parameter === 'waterLevel' ? 2 : 1)}
                </div>
                <div className="w-[130px] text-[#64748b] font-sans text-[13px] text-right">
                  {formatNumber(row.max, parameter === 'waterLevel' ? 2 : 1)}
                </div>
                <div className="w-[140px] text-[#64748b] font-sans text-[13px] text-right">
                  {row.source}
                </div>
              </div>
            ))}
          </div>

          {/* Table Footer Summary Row */}
          <div className="flex h-11 items-center bg-[#f8fafc] border-t border-[#e2e8f0] rounded-b-lg px-3.5 py-0 gap-2 min-w-[600px] font-bold text-slate-800">
            <div className="text-slate-500 uppercase text-[10px] tracking-widest flex-1">
              Rata-rata Periode
            </div>
            <div className="w-[160px] font-mono text-right text-[13px]">
              {formatNumber(summaryStats.avg, parameter === 'waterLevel' ? 2 : 1)}
            </div>
            <div className="w-[130px] font-mono text-right text-[13px] text-[#64748b]">
              {formatNumber(summaryStats.min, parameter === 'waterLevel' ? 2 : 1)}
            </div>
            <div className="w-[130px] font-mono text-right text-[13px] text-[#64748b]">
              {formatNumber(summaryStats.max, parameter === 'waterLevel' ? 2 : 1)}
            </div>
            <div className="w-[140px] text-right text-xs text-slate-400 font-normal">
              Sistem
            </div>
          </div>
        </div>

        {/* Toggle Load More Button */}
        <div className="flex justify-center border-t border-[#f1f5f9] pt-3.5 mt-1">
          <button
            onClick={() => setShowAllRows(!showAllRows)}
            className="flex items-center gap-2 text-sm font-bold text-[#0891b2] hover:text-[#0e7490] transition-colors border-0 bg-transparent cursor-pointer uppercase tracking-wider select-none"
          >
            <span>{showAllRows ? 'Sembunyikan Data' : 'Tampilkan Lebih Banyak'}</span>
            {showAllRows ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
