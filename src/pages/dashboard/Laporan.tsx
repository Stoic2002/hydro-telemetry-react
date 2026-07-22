import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useActivePLTA } from '../../features/plta/api/queries';
import { useNotificationStore } from '../../store/notification-store';
import { formatNumber } from '../../utils/formatters';
import { Eye, Download, ChevronDown, ChevronUp } from 'lucide-react';
import PlantSwitcher from '../../features/plta/components/PlantSwitcher';
import Select from '../../components/atoms/Select';

interface ReportRow {
  date: string;
  average: number;
  min: number;
  max: number;
  source: string;
}

const REPORT_PARAMETERS = ['inflow', 'waterLevel', 'outflow', 'produksi'] as const;
const REPORT_YEARS = ['2025', '2026'] as const;
const REPORT_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const;

type ReportParameter = (typeof REPORT_PARAMETERS)[number];
type ReportMonth = (typeof REPORT_MONTHS)[number];

const MONTH_INDEX: Record<ReportMonth, number> = {
  Januari: 0,
  Februari: 1,
  Maret: 2,
  April: 3,
  Mei: 4,
  Juni: 5,
  Juli: 6,
  Agustus: 7,
  September: 8,
  Oktober: 9,
  November: 10,
  Desember: 11,
};

const MONTH_SHORT: Record<ReportMonth, string> = {
  Januari: 'Jan',
  Februari: 'Feb',
  Maret: 'Mar',
  April: 'Apr',
  Mei: 'Mei',
  Juni: 'Jun',
  Juli: 'Jul',
  Agustus: 'Agu',
  September: 'Sep',
  Oktober: 'Okt',
  November: 'Nov',
  Desember: 'Des',
};

function isReportParameter(value: string | null): value is ReportParameter {
  return REPORT_PARAMETERS.some((parameter) => parameter === value);
}

function isReportYear(value: string | null): value is (typeof REPORT_YEARS)[number] {
  return REPORT_YEARS.some((year) => year === value);
}

function isReportMonth(value: string | null): value is ReportMonth {
  return REPORT_MONTHS.some((month) => month === value);
}

const reportFilterSchema = z.object({
  parameter: z.enum(REPORT_PARAMETERS),
  year: z.enum(REPORT_YEARS),
  month: z.enum(REPORT_MONTHS),
});

type ReportFilterValues = z.infer<typeof reportFilterSchema>;

export default function Reports() {
  const { addToast } = useNotificationStore();
  const { plta } = useActivePLTA();
  const [searchParams, setSearchParams] = useSearchParams();

  const parameterParam = searchParams.get('parameter');
  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month');
  const parameter = isReportParameter(parameterParam) ? parameterParam : 'inflow';
  const year = isReportYear(yearParam) ? yearParam : REPORT_YEARS[0];
  const month = isReportMonth(monthParam) ? monthParam : 'Februari';
  const [showAllRows, setShowAllRows] = useState(false);
  const { register, handleSubmit } = useForm<ReportFilterValues>({
    resolver: zodResolver(reportFilterSchema),
    values: { parameter, year, month },
  });

  // Parameter Display mapping
  const paramInfo = {
    inflow: { label: 'Inflow (Tahun + Bulan)', unit: 'm³/s', columnName: 'Inflow Rata-Rata', baseVal: plta.liveData.inflow },
    waterLevel: { label: 'TMA / Elevasi (Tahun + Bulan)', unit: 'mdpl', columnName: 'TMA Rata-Rata', baseVal: plta.liveData.waterLevel },
    outflow: { label: 'Outflow (Tahun + Bulan)', unit: 'm³/s', columnName: 'Outflow Rata-Rata', baseVal: plta.liveData.outflow },
    produksi: { label: 'Produksi Listrik (Tahun + Bulan)', unit: 'MW', columnName: 'Produksi Rata-Rata', baseVal: plta.liveData.produksi || 0 },
  };

  const baseValue = paramInfo[parameter].baseVal;

  // Generate deterministic mock rows based on the selected period and parameter.
  const reportData = useMemo<ReportRow[]>(() => {
    const data: ReportRow[] = [];
    const selectedMonthIndex = MONTH_INDEX[month];
    const daysInMonth = new Date(Number(year), selectedMonthIndex + 1, 0).getDate();
    
    // Seeded random helper based on date index to keep data consistent between renders
    const getSeededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    for (let day = 1; day <= daysInMonth; day++) {
      const rand = getSeededRandom(day + (parameter === 'inflow' ? 10 : 20));
      const avgVal = baseValue - (baseValue * 0.1) + (rand * (baseValue * 0.2));
      const minVal = avgVal - (avgVal * 0.15 * rand);
      const maxVal = avgVal + (avgVal * 0.15 * (1 - rand));

      data.push({
        date: `${day.toString().padStart(2, '0')} ${MONTH_SHORT[month]} ${year}`,
        average: avgVal,
        min: minVal,
        max: maxVal,
        source: 'Telemetri',
      });
    }
    return data;
  }, [baseValue, month, parameter, year]);

  // Calculate totals/averages
  const summaryStats = useMemo(() => {
    const total = reportData.reduce((acc, row) => acc + row.average, 0);
    const avg = total / reportData.length;
    const min = Math.min(...reportData.map((row) => row.min));
    const max = Math.max(...reportData.map((row) => row.max));
    return { avg, min, max };
  }, [reportData]);

  const handleExportCSV = () => {
    addToast({ type: 'info', message: 'Ekspor CSV akan tersedia setelah data laporan siap' });
  };

  const applyFilters = (values: ReportFilterValues) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set('parameter', values.parameter);
      nextParams.set('year', values.year);
      nextParams.set('month', values.month);
      return nextParams;
    });
    setShowAllRows(false);
    addToast({ type: 'info', message: `Menampilkan data ${paramInfo[values.parameter].columnName}` });
  };

  const displayedRows = showAllRows ? reportData : reportData.slice(0, 7);

  return (
    <div className="flex flex-col flex-1 gap-6 animate-in fade-in duration-500">
      {/* Header Info */}
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="page-title">
            Laporan
          </h1>
          <p className="page-description">
            Buka atau unduh data historis PLTA {plta.name} berdasarkan parameter dan periode
          </p>
        </div>
        <PlantSwitcher page="laporan" />
      </div>

      {/* Filter Row Panel (No Shadow!) */}
      <form onSubmit={handleSubmit(applyFilters)} className="flex flex-col lg:flex-row lg:items-end bg-white border border-[#e2e8f0] rounded-xl p-5 gap-4">
        <div className="flex flex-col sm:flex-row flex-1 gap-3">
          {/* Parameter Select */}
          <Select
            label="Parameter"
            {...register('parameter')}
            options={[
              { value: 'inflow', label: 'Inflow (Tahun + Bulan)' },
              { value: 'waterLevel', label: 'TMA / Elevasi (Tahun + Bulan)' },
              { value: 'outflow', label: 'Outflow (Tahun + Bulan)' },
              { value: 'produksi', label: 'Produksi Listrik (Tahun + Bulan)' },
            ]}
          />

          {/* Year Select */}
          <Select
            label="Tahun"
            {...register('year')}
            className="w-full shrink-0 sm:w-[140px]"
            options={REPORT_YEARS.map((year) => ({ value: year, label: year }))}
          />

          {/* Month Select */}
          <Select
            label="Bulan"
            {...register('month')}
            className="w-full shrink-0 sm:w-[160px]"
            options={REPORT_MONTHS.map((month) => ({ value: month, label: month }))}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex shrink-0 gap-2.5">
          <button
            type="submit"
            className="flex h-11 items-center justify-center bg-[#0891b2] hover:bg-[#0e7490] text-white font-sans text-[13px] font-semibold rounded-xl px-[18px] py-0 gap-2 border-0 cursor-pointer transition-colors"
          >
            <Eye size={16} />
            <span>Tampilkan</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex h-11 items-center justify-center bg-white border border-[#0891b2] text-[#0891b2] hover:bg-[#ecfeff] font-sans text-[13px] font-semibold rounded-xl px-[18px] py-0 gap-2 cursor-pointer transition-colors"
          >
            <Download size={16} />
            <span>Unduh CSV</span>
          </button>
        </div>
      </form>

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
