import { useMemo, type ReactNode } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Minus,
  RefreshCw,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Select from '../../components/atoms/Select';
import Skeleton from '../../components/atoms/Skeleton';
import PlantSwitcher from '../../features/plta/components/PlantSwitcher';
import {
  useActivePLTA,
  usePLTATagsQuery,
} from '../../features/plta/api/queries';
import {
  useTrendQuery,
  type TrendResolution,
  type TrendSeries,
} from '../../features/trends';
import { formatNumber } from '../../shared/utils/number';

interface TrendCardProps {
  title: string;
  subtitle: string;
  unit: string;
  color: string;
  chartType?: 'line' | 'bar';
  series?: TrendSeries;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

interface TrendChartDatum {
  time: string;
  value: number;
}

interface TrendTooltipEntry {
  value?: unknown;
  payload?: TrendChartDatum;
}

interface TrendTooltipProps {
  active?: boolean;
  payload?: TrendTooltipEntry[];
  label?: ReactNode;
  unit: string;
  color: string;
}

const TREND_PERIODS = [
  '24 Jam Terakhir',
  '7 Hari Terakhir',
  '30 Hari Terakhir',
] as const;

const TREND_COLORS = ['#0891b2', '#2563eb', '#7c3aed', '#0e7490', '#d97706', '#059669'];

type TrendPeriod = (typeof TREND_PERIODS)[number];

function isTrendPeriod(value: string | null): value is TrendPeriod {
  return TREND_PERIODS.some((period) => period === value);
}

function formatParameterLabel(parameter: string): string {
  return parameter
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toLocaleUpperCase('id-ID'));
}

function periodConfig(period: TrendPeriod): { durationMs: number; resolution: TrendResolution } {
  if (period === '24 Jam Terakhir') {
    return { durationMs: 24 * 60 * 60 * 1_000, resolution: '1h' };
  }
  if (period === '7 Hari Terakhir') {
    return { durationMs: 7 * 24 * 60 * 60 * 1_000, resolution: '1h' };
  }
  return { durationMs: 30 * 24 * 60 * 60 * 1_000, resolution: '1d' };
}

function formatPointTime(value: string | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

function formatAxisTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

function TrendTooltip({ active, payload, unit, color }: TrendTooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point || typeof point.value !== 'number') return null;

  return (
    <div className="min-w-44 rounded-xl border border-slate-700/80 bg-slate-950/95 p-3 text-white shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-300">
        <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
        {formatPointTime(point.time)}
      </div>
      <p className="mt-2 text-lg font-bold tracking-tight">
        {formatNumber(point.value, 2)}
        <span className="ml-1.5 text-xs font-medium text-slate-400">{unit}</span>
      </p>
    </div>
  );
}

function TrendCard({
  title,
  subtitle,
  unit,
  color,
  chartType = 'line',
  series,
  isLoading,
  isError,
  onRetry,
}: TrendCardProps) {
  const points = series?.points ?? [];
  const chartData: TrendChartDatum[] = points.map((point) => ({
    time: point.time,
    value: point.value,
  }));
  const values = points.map((point) => point.value);
  const latest = points.at(-1);
  const first = points.at(0);
  const averageValue = values.length > 0
    ? values.reduce((total, value) => total + value, 0) / values.length
    : 0;
  const minimumValue = values.length > 0 ? Math.min(...values) : 0;
  const maximumValue = values.length > 0 ? Math.max(...values) : 0;
  const changeValue = latest && first ? latest.value - first.value : 0;
  const valueRange = maximumValue - minimumValue;
  const domainPadding = Math.max(
    valueRange * 0.12,
    Math.abs(maximumValue) * 0.05,
    0.01,
  );
  const yDomain: [number, number] = [
    minimumValue >= 0 ? Math.max(0, minimumValue - domainPadding) : minimumValue - domainPadding,
    maximumValue + domainPadding,
  ];
  const gradientId = `trend-fill-${title.toLocaleLowerCase('id-ID').replace(/[^a-z0-9]+/g, '-')}`;
  const ChangeIcon = changeValue > 0
    ? ArrowUpRight
    : changeValue < 0
      ? ArrowDownRight
      : Minus;
  const changeClass = changeValue > 0
    ? 'text-emerald-600'
    : changeValue < 0
      ? 'text-amber-600'
      : 'text-slate-500';

  const commonChartElements = (
    <>
      <CartesianGrid
        vertical={false}
        stroke="#e2e8f0"
        strokeDasharray="4 6"
        strokeOpacity={0.9}
      />
      <XAxis
        dataKey="time"
        axisLine={false}
        tickLine={false}
        minTickGap={46}
        tick={{ fill: '#64748b', fontSize: 11 }}
        tickFormatter={(value: string) => formatAxisTime(value)}
        dy={10}
      />
      <YAxis
        axisLine={false}
        tickLine={false}
        width={54}
        domain={yDomain}
        tick={{ fill: '#64748b', fontSize: 11 }}
        tickFormatter={(value: number) => formatNumber(value, Math.abs(value) >= 100 ? 0 : 1)}
      />
      <Tooltip
        cursor={chartType === 'bar'
          ? { fill: `${color}0d` }
          : { stroke: color, strokeWidth: 1.5, strokeDasharray: '5 5' }}
        content={<TrendTooltip unit={unit} color={color} />}
      />
      <ReferenceLine
        y={averageValue}
        stroke="#94a3b8"
        strokeDasharray="5 5"
        strokeOpacity={0.7}
        label={{
          value: 'Rata-rata',
          position: 'insideTopRight',
          fill: '#94a3b8',
          fontSize: 10,
        }}
      />
    </>
  );

  return (
    <article className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-base font-semibold text-[#0f172a]">{title}</h2>
            <p className="mt-1 text-xs text-[#64748b]">{subtitle}</p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-[11px] font-medium text-slate-400">Nilai terkini</p>
            <p className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900">
              {latest ? formatNumber(latest.value, 2) : 'N/A'}
              <span className="ml-1.5 text-xs font-medium text-slate-400">{unit}</span>
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              {latest ? formatPointTime(latest.time) : 'Belum ada data'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div role="status" aria-label="Memuat grafik tren" className="mt-5">
            <div className="grid grid-cols-2 border-y border-slate-100 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={`trend-stat-loading-${index}`} className="px-3 py-3 sm:px-4">
                  <Skeleton className="h-2.5 w-16 rounded" />
                  <Skeleton className="mt-2 h-4 w-24 max-w-full rounded" />
                </div>
              ))}
            </div>
            <Skeleton className="mt-5 h-[330px] rounded-md" />
            <span className="sr-only">Memuat grafik tren...</span>
          </div>
        ) : isError ? (
          <div className="mt-5 flex h-[390px] flex-col items-center justify-center gap-3 border-y border-red-100 bg-red-50/40 text-center text-xs text-red-600">
            <span>Data tren belum dapat dimuat.</span>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex cursor-pointer items-center gap-1 font-semibold hover:text-red-700"
            >
              <RefreshCw size={13} /> Coba lagi
            </button>
          </div>
        ) : points.length === 0 ? (
          <div className="mt-5 flex h-[390px] items-center justify-center border-y border-slate-100 bg-slate-50/40 text-xs text-slate-400">
            Belum ada titik data pada periode ini.
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-2 border-y border-slate-100 lg:grid-cols-4">
              {[
                { label: 'Rata-rata', value: averageValue },
                { label: 'Minimum', value: minimumValue },
                { label: 'Maksimum', value: maximumValue },
              ].map((statistic) => (
                <div
                  key={statistic.label}
                  className="border-slate-100 px-3 py-3 even:border-l lg:border-l lg:first:border-l-0 sm:px-4"
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.05em] text-slate-400">
                    {statistic.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 sm:text-base">
                    {formatNumber(statistic.value, 2)}
                    <span className="ml-1 text-[10px] font-semibold text-slate-400">{unit}</span>
                  </p>
                </div>
              ))}
              <div className="border-l border-slate-100 px-3 py-3 sm:px-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.05em] text-slate-400">
                  Perubahan periode
                </p>
                <p className={`mt-1 flex items-center gap-1 text-sm font-semibold sm:text-base ${changeClass}`}>
                  <ChangeIcon size={16} aria-hidden="true" />
                  {changeValue > 0 ? '+' : ''}
                  {formatNumber(changeValue, 2)}
                  <span className="text-[10px] font-semibold text-slate-400">{unit}</span>
                </p>
              </div>
            </div>

            <div
              className="mt-5 pt-1"
              role="img"
              aria-label={`Grafik ${title} dengan tooltip nilai per waktu`}
            >
              <ResponsiveContainer width="100%" height={330}>
                {chartType === 'bar' ? (
                  <BarChart
                    data={chartData}
                    margin={{ top: 18, right: 18, bottom: 12, left: 0 }}
                    accessibilityLayer
                  >
                    {commonChartElements}
                    <Bar
                      dataKey="value"
                      name={title}
                      fill={color}
                      fillOpacity={0.82}
                      maxBarSize={32}
                      radius={[7, 7, 2, 2]}
                      activeBar={{ fill: color, fillOpacity: 1 }}
                      animationDuration={600}
                    />
                  </BarChart>
                ) : (
                  <AreaChart
                    data={chartData}
                    margin={{ top: 18, right: 18, bottom: 12, left: 0 }}
                    accessibilityLayer
                  >
                    <defs>
                      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="65%" stopColor={color} stopOpacity={0.08} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    {commonChartElements}
                    <Area
                      type="monotone"
                      dataKey="value"
                      name={title}
                      stroke={color}
                      strokeWidth={3}
                      fill={`url(#${gradientId})`}
                      dot={points.length <= 32
                        ? {
                          r: 3,
                          fill: '#ffffff',
                          stroke: color,
                          strokeWidth: 2,
                        }
                        : false}
                      activeDot={{
                        r: 6,
                        fill: '#ffffff',
                        stroke: color,
                        strokeWidth: 3,
                      }}
                      animationDuration={650}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
              <div className="flex flex-col justify-between gap-1 border-t border-slate-100 pt-3 text-[10px] text-slate-400 sm:flex-row sm:items-center">
                <span>Arahkan kursor ke grafik untuk melihat detail nilai.</span>
                <span>
                  {points.length.toLocaleString('id-ID')} titik · resolusi {series?.resolution} · agregasi lintas stasiun
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

export default function Trends() {
  const { plta, pltaId } = useActivePLTA();
  const [searchParams, setSearchParams] = useSearchParams();
  const periodParam = searchParams.get('period');
  const parameterParam = searchParams.get('parameter');
  const period = isTrendPeriod(periodParam) ? periodParam : TREND_PERIODS[0];
  const tagsQuery = usePLTATagsQuery(pltaId, {
    page: 1,
    limit: 200,
    enabled: true,
  });
  const parameterOptions = useMemo(() => {
    if (tagsQuery.isPlaceholderData) return [];

    const options = new Map<string, { value: string; label: string; unit: string; stations: Set<string> }>();
    for (const tag of tagsQuery.data?.items ?? []) {
      const value = tag.parameter.trim();
      if (!value) continue;
      const existing = options.get(value) ?? {
        value,
        label: formatParameterLabel(value),
        unit: tag.unit.trim(),
        stations: new Set<string>(),
      };
      if (!existing.unit && tag.unit.trim()) existing.unit = tag.unit.trim();
      if (tag.station.trim()) existing.stations.add(tag.station.trim());
      options.set(value, existing);
    }

    return [...options.values()]
      .sort((left, right) => left.label.localeCompare(right.label, 'id-ID'))
      .map((option, index) => {
        const isRainfall = option.value.includes('rainfall');
        const isAccumulated = isRainfall || option.value === 'total_outflow';
        return {
          ...option,
          subtitle: option.stations.size > 0
            ? `${option.stations.size} stasiun aktif`
            : 'Tag aktif PLTA',
          color: TREND_COLORS[index % TREND_COLORS.length],
          aggregation: isAccumulated ? 'sum' as const : 'avg' as const,
          chartType: isRainfall ? 'bar' as const : 'line' as const,
        };
      });
  }, [tagsQuery.data?.items, tagsQuery.isPlaceholderData]);
  const parameterConfig = parameterOptions.find((item) => item.value === parameterParam)
    ?? parameterOptions[0]
    ?? {
      value: '',
      label: 'Parameter',
      subtitle: 'Menunggu tag aktif PLTA',
      unit: '',
      color: TREND_COLORS[0],
      aggregation: 'avg' as const,
      chartType: 'line' as const,
    };
  const parameter = parameterConfig.value;

  const timeRange = useMemo(() => {
    const to = new Date();
    const config = periodConfig(period);
    const from = new Date(to.getTime() - config.durationMs);
    return { from: from.toISOString(), to: to.toISOString(), resolution: config.resolution };
  }, [period]);

  const trendQuery = useTrendQuery({
    pltaId,
    parameter: parameterConfig.value,
    ...timeRange,
    aggregation: parameterConfig.aggregation,
  });

  const setFilter = (key: 'parameter' | 'period', value: string) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set(key, value);
      return nextParams;
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <h1 className="page-title">Tren & Grafik</h1>
          <p className="page-description">
            Pilih satu parameter untuk melihat tren data PLTA {plta.shortName}
          </p>
        </div>
        <PlantSwitcher page="trends" />
      </header>

      <section className="flex flex-col gap-4 border-y border-[#e2e8f0] py-4 sm:flex-row sm:items-end">
        <label className="flex w-full flex-col gap-1.5 sm:max-w-xs">
          <span className="text-xs font-semibold text-[#475569]">Parameter grafik</span>
          <Select
            aria-label="Parameter grafik"
            value={parameter}
            disabled={tagsQuery.isLoading || tagsQuery.isPlaceholderData || parameterOptions.length === 0}
            onChange={(event) => setFilter('parameter', event.target.value)}
            className="w-full"
            options={parameterOptions.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
          />
        </label>
        <label className="flex w-full flex-col gap-1.5 sm:max-w-xs">
          <span className="text-xs font-semibold text-[#475569]">Periode</span>
          <Select
            aria-label="Periode tren"
            value={period}
            onChange={(event) => setFilter('period', event.target.value)}
            leadingIcon={<Calendar />}
            className="w-full"
            options={TREND_PERIODS.map((item) => ({ value: item, label: item }))}
          />
        </label>
      </section>

      {!tagsQuery.isLoading && !tagsQuery.isPlaceholderData && !tagsQuery.isError && parameterOptions.length === 0 ? (
        <div className="flex min-h-72 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-center text-sm text-slate-500">
          Belum ada tag aktif untuk PLTA ini.
        </div>
      ) : (
        <TrendCard
          title={parameterConfig.label}
          subtitle={parameterConfig.subtitle}
          unit={parameterConfig.unit}
          color={parameterConfig.color}
          chartType={parameterConfig.chartType}
          series={trendQuery.data}
          isLoading={tagsQuery.isLoading || tagsQuery.isPlaceholderData || trendQuery.isLoading}
          isError={tagsQuery.isError || trendQuery.isError}
          onRetry={() => {
            if (tagsQuery.isError) void tagsQuery.refetch();
            if (trendQuery.isError) void trendQuery.refetch();
          }}
        />
      )}
    </div>
  );
}
