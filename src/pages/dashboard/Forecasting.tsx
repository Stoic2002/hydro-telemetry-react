import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Select from '../../components/atoms/Select';
import Skeleton from '../../components/atoms/Skeleton';
import {
  FORECASTING_PLTA_ID,
  FORECASTING_PLTA_NAME,
  useForecastQuery,
  type ForecastHorizon,
  type ForecastParameter,
} from '../../features/forecasting';
import { useTrendQuery } from '../../features/trends';
import { formatNumber } from '../../shared/utils/number';

interface ForecastChartDatum {
  time: string;
  actual?: number;
  forecast?: number;
  bandBase?: number;
  bandRange?: number;
  p10?: number;
  p90?: number;
}

interface ForecastTooltipEntry {
  payload?: ForecastChartDatum;
}

interface ForecastTooltipProps {
  active?: boolean;
  payload?: ForecastTooltipEntry[];
  unit: string;
}

const PARAMETER_OPTIONS: Array<{ value: ForecastParameter; label: string }> = [
  { value: 'inflow', label: 'Inflow' },
  { value: 'water_level', label: 'TMA Waduk' },
];

const HORIZON_OPTIONS: Array<{ value: ForecastHorizon; label: string }> = [
  { value: 24, label: '24 Jam' },
  { value: 168, label: '7 Hari' },
];

function normalizeUnit(unit: string | null | undefined): string {
  if (!unit) return '';
  return unit.replace('m3/', 'm³/');
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

function formatAxisTime(value: string, horizon: ForecastHorizon): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', horizon === 24
    ? { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }
    : { day: '2-digit', month: 'short', timeZone: 'Asia/Jakarta' }).format(date);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Data Forecasting belum dapat dimuat.';
}

function ForecastTooltip({ active, payload, unit }: ForecastTooltipProps) {
  const point = payload?.find((entry) => entry.payload)?.payload;
  if (!active || !point) return null;

  const values = [
    { label: 'Aktual', value: point.actual, className: 'text-slate-300' },
    { label: 'Prediksi P50', value: point.forecast, className: 'text-cyan-300' },
    { label: 'P10', value: point.p10, className: 'text-slate-400' },
    { label: 'P90', value: point.p90, className: 'text-slate-400' },
  ].filter((item) => item.value !== undefined);

  return (
    <div className="min-w-48 rounded-xl border border-slate-700 bg-slate-950/95 p-3 text-white shadow-xl">
      <p className="text-[11px] font-medium text-slate-300">{formatDateTime(point.time)}</p>
      <div className="mt-2 space-y-1.5">
        {values.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-5 text-xs">
            <span className="text-slate-400">{item.label}</span>
            <span className={`font-semibold ${item.className}`}>
              {formatNumber(item.value ?? 0, 2)} {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Forecasting() {
  const pltaId = FORECASTING_PLTA_ID;
  const [parameter, setParameter] = useState<ForecastParameter>('inflow');
  const [horizon, setHorizon] = useState<ForecastHorizon>(24);
  const forecastInput = { pltaId, parameter, horizon };
  const forecastQuery = useForecastQuery(forecastInput);

  const actualRange = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - horizon * 60 * 60 * 1_000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [horizon]);

  const actualQuery = useTrendQuery({
    pltaId,
    parameter,
    ...actualRange,
    resolution: '1h',
    aggregation: 'avg',
  });

  const series = forecastQuery.data;
  const unit = normalizeUnit(series?.unit);
  const points = series?.points ?? [];
  const peakPoint = points.reduce((peak, point) => (
    !peak || point.value > peak.value ? point : peak
  ), points[0]);
  const minimumPoint = points.reduce((minimum, point) => (
    !minimum || point.value < minimum.value ? point : minimum
  ), points[0]);
  const average = points.length > 0
    ? points.reduce((total, point) => total + point.value, 0) / points.length
    : null;

  const chartData = useMemo(() => {
    const merged = new Map<string, ForecastChartDatum>();
    for (const point of actualQuery.data?.points ?? []) {
      merged.set(point.time, { time: point.time, actual: point.value });
    }
    for (const point of series?.points ?? []) {
      const current = merged.get(point.time) ?? { time: point.time };
      current.forecast = point.value;
      if (point.valueP10 !== null && point.valueP90 !== null) {
        current.bandBase = point.valueP10;
        current.bandRange = Math.max(0, point.valueP90 - point.valueP10);
        current.p10 = point.valueP10;
        current.p90 = point.valueP90;
      }
      merged.set(point.time, current);
    }
    return [...merged.values()].sort(
      (left, right) => new Date(left.time).getTime() - new Date(right.time).getTime(),
    );
  }, [actualQuery.data?.points, series?.points]);

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500">
      <header>
        <div>
          <h1 className="page-title">Forecasting</h1>
          <p className="page-description">Prediksi ML terbaru untuk PLTA {FORECASTING_PLTA_NAME}</p>
        </div>
      </header>

      <section className="flex flex-col gap-4 border-y border-slate-200 py-4 sm:flex-row sm:items-end">
        <Select
          label="Parameter"
          value={parameter}
          onChange={(event) => setParameter(event.target.value as ForecastParameter)}
          options={PARAMETER_OPTIONS}
          className="w-full sm:max-w-xs"
        />
        <Select
          label="Horizon"
          value={horizon}
          onChange={(event) => setHorizon(Number(event.target.value) as ForecastHorizon)}
          options={HORIZON_OPTIONS}
          className="w-full sm:max-w-xs"
        />
      </section>

      {forecastQuery.isLoading ? (
        <div className="flex flex-col gap-5" role="status" aria-label="Memuat Forecasting">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => <Skeleton key={`forecast-kpi-${index}`} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-[430px] rounded-xl" />
          <span className="sr-only">Memuat Forecasting...</span>
        </div>
      ) : forecastQuery.isError ? (
        <section className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-xl border border-red-100 bg-white px-6 text-center">
          <AlertTriangle size={22} className="text-red-500" />
          <p className="text-sm font-semibold text-red-600">{errorMessage(forecastQuery.error)}</p>
          <button type="button" onClick={() => void forecastQuery.refetch()} className="cursor-pointer text-xs font-semibold text-cyan-700 hover:text-cyan-800">Coba lagi</button>
        </section>
      ) : (
        <>
          {series?.accuracy && !series.accuracy.isPresentable && (
            <div className="flex items-start gap-2 border-y border-amber-200 bg-amber-50/60 px-4 py-3 text-xs leading-5 text-amber-800">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              Akurasi prediksi saat ini belum layak disajikan sebagai acuan tunggal. Gunakan bersama data aktual dan pertimbangan operator.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Prediksi awal',
                value: points[0] ? formatNumber(points[0].value, 2) : 'N/A',
                detail: points[0] ? formatDateTime(points[0].time) : 'Belum ada data',
              },
              {
                label: 'Prediksi maksimum',
                value: peakPoint ? formatNumber(peakPoint.value, 2) : 'N/A',
                detail: peakPoint ? formatDateTime(peakPoint.time) : 'Belum ada data',
              },
              {
                label: 'Prediksi minimum',
                value: minimumPoint ? formatNumber(minimumPoint.value, 2) : 'N/A',
                detail: minimumPoint ? formatDateTime(minimumPoint.time) : 'Belum ada data',
              },
              {
                label: 'Rata-rata',
                value: average === null ? 'N/A' : formatNumber(average, 2),
                detail: `${points.length} titik · horizon ${horizon} jam`,
              },
            ].map((item) => (
              <article key={item.label} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {item.value}
                  {item.value !== 'N/A' && <span className="ml-1 text-xs font-medium text-slate-400">{unit}</span>}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">{item.detail}</p>
              </article>
            ))}
          </div>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-base font-semibold text-slate-900">{series?.label ?? PARAMETER_OPTIONS.find((item) => item.value === parameter)?.label}</h2>
                <p className="mt-1 text-xs text-slate-500">Aktual historis dan prediksi P50 dari model terbaru.</p>
              </div>
              <div className="text-left text-[11px] text-slate-400 sm:text-right">
                <p className="font-medium text-slate-500">{series?.modelName}</p>
                <p className="mt-1">Dibuat {formatDateTime(series?.generatedAt)}</p>
              </div>
            </div>

            <div className="px-2 pb-3 pt-5 sm:px-5">
              <ResponsiveContainer width="100%" height={360}>
                <ComposedChart data={chartData} margin={{ top: 12, right: 18, bottom: 10, left: 0 }} accessibilityLayer>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 6" />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    minTickGap={42}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(value: string) => formatAxisTime(value, horizon)}
                    dy={9}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={58}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(value: number) => formatNumber(value, Math.abs(value) >= 100 ? 0 : 1)}
                  />
                  <Tooltip content={<ForecastTooltip unit={unit} />} />
                  <Area type="monotone" dataKey="bandBase" stackId="confidence" stroke="none" fill="transparent" isAnimationActive={false} />
                  <Area type="monotone" dataKey="bandRange" stackId="confidence" stroke="none" fill="#67e8f9" fillOpacity={0.28} isAnimationActive={false} />
                  <Line type="monotone" dataKey="actual" name="Aktual" stroke="#64748b" strokeWidth={2.25} dot={false} connectNulls={false} />
                  <Line type="monotone" dataKey="forecast" name="Prediksi P50" stroke="#0891b2" strokeWidth={2.75} dot={false} activeDot={{ r: 5 }} connectNulls={false} />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 px-2 pt-3 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-slate-500" />Aktual</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-cyan-700" />Prediksi P50</span>
                {points.some((point) => point.valueP10 !== null && point.valueP90 !== null) && (
                  <span className="inline-flex items-center gap-1.5"><span className="size-3 bg-cyan-200/70" />Rentang P10–P90</span>
                )}
              </div>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                {series?.accuracy?.isPresentable ? (
                  <CheckCircle2 size={18} className="text-emerald-600" />
                ) : (
                  <AlertTriangle size={18} className="text-amber-600" />
                )}
                <h2 className="text-sm font-semibold text-slate-900">Kelayakan Prediksi</h2>
              </div>
              <div className="mt-4 divide-y divide-slate-100 text-sm">
                <div className="flex justify-between gap-4 py-3"><span className="text-slate-500">Status</span><span className={`font-semibold ${series?.accuracy?.isPresentable ? 'text-emerald-600' : 'text-amber-600'}`}>{series?.accuracy?.isPresentable ? 'Layak' : 'Perlu kehati-hatian'}</span></div>
                <div className="flex justify-between gap-4 py-3"><span className="text-slate-500">Skill</span><span className="font-semibold text-slate-800">{series?.accuracy?.skill === null || series?.accuracy?.skill === undefined ? 'N/A' : formatNumber(series.accuracy.skill, 2)}</span></div>
                <div className="flex justify-between gap-4 py-3"><span className="text-slate-500">Sampel</span><span className="font-semibold text-slate-800">{series?.accuracy?.sampleCount ?? 0}</span></div>
                <div className="flex justify-between gap-4 py-3"><span className="text-slate-500">Jendela</span><span className="font-semibold text-slate-800">{series?.accuracy?.windowDays ?? 0} hari</span></div>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-sm font-semibold text-slate-900">Detail Prediksi</h2>
                <p className="mt-1 text-xs text-slate-500">P50 adalah nilai utama; P10–P90 ditampilkan bila model menyediakannya.</p>
              </div>
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full min-w-[620px] border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-[0.06em] text-slate-500">
                    <tr><th className="px-5 py-3 font-semibold">Waktu</th><th className="px-4 py-3 text-right font-semibold">P50</th><th className="px-4 py-3 text-right font-semibold">P10</th><th className="px-5 py-3 text-right font-semibold">P90</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {points.map((point) => (
                      <tr key={point.time} className="text-sm text-slate-600 hover:bg-slate-50/70">
                        <td className="px-5 py-3">{formatDateTime(point.time)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatNumber(point.value, 2)} {unit}</td>
                        <td className="px-4 py-3 text-right">{point.valueP10 === null ? '—' : `${formatNumber(point.valueP10, 2)} ${unit}`}</td>
                        <td className="px-5 py-3 text-right">{point.valueP90 === null ? '—' : `${formatNumber(point.valueP90, 2)} ${unit}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
