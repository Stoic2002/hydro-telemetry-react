import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ImageOff,
  Info,
  PencilLine,
  RefreshCw,
  Upload,
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Skeleton from '../../components/atoms/Skeleton';
import PlantSwitcher from '../../features/plta/components/PlantSwitcher';
import {
  useMonitoringStream,
  usePLTALatestQuery,
  type MonitoringParameter,
  type MonitoringParameterLatest,
} from '../../features/monitoring';
import {
  useActivePLTA,
  usePLTATagsQuery,
} from '../../features/plta/api/queries';
import {
  getDamImagery,
  type HydrologyZone,
} from '../../features/plta/dam-imagery';
import SatelliteHydrologyMap from '../../features/plta/components/SatelliteHydrologyMap';
import type { Plant, PlantTag } from '../../features/plta/model';
import {
  useMonthlyHydrologyImageQuery,
  useMonthlyHydrologyQuery,
  usePLTAHydrologyDashboardQuery,
} from '../../features/hydrology/api/queries';
import { getHydrologyErrorMessage } from '../../features/hydrology/error';
import MonthlyHydrologySheet from '../../features/hydrology/components/MonthlyHydrologySheet';
import HydrologyImageUploadSheet from '../../features/hydrology/components/HydrologyImageUploadSheet';
import type {
  DashboardMetric,
  DashboardMetricGroup,
  MonthlyHydrology,
  MonthlyHydrologyImageKind,
  NullableMetric,
} from '../../features/hydrology/model';
import TelemetryUploadSheet from '../../features/telemetry-upload/components/TelemetryUploadSheet';
import type { DailyTelemetryUploadTarget } from '../../features/telemetry-upload/model';

const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

type MetricSource = 'api' | 'formula' | 'input' | 'unavailable' | 'constant';

interface MetricRow {
  label: string;
  value: string;
  unit?: string;
  source: string;
  sourceType: MetricSource;
  hasData?: boolean;
  uploadTarget?: DailyTelemetryUploadTarget;
}

interface MetricSection {
  title: string;
  rows: MetricRow[];
}

interface ZoneCardProps {
  cardRef?: RefObject<HTMLElement | null>;
  isHighlighted?: boolean;
  onHighlightChange?: (isHighlighted: boolean) => void;
  title: string;
  subtitle?: string;
  sections: MetricSection[];
  onUpload?: (target: DailyTelemetryUploadTarget) => void;
}

const sourceClasses: Record<MetricSource, string> = {
  api: 'text-[#0e7490]',
  formula: 'text-[#b45309]',
  input: 'text-[#64748b]',
  unavailable: 'text-[#dc2626]',
  constant: 'text-[#94a3b8]',
};

function formatMetric(value: NullableMetric, maximumFractionDigits = 2): string {
  if (value === null || !Number.isFinite(value)) return 'N/A';

  return value.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

function formatHydrologyDate(value: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function monitoringTimestamp(reading: MonitoringParameterLatest): number {
  if (!reading.time) return 0;
  const timestamp = new Date(reading.time).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function latestMonitoringParameter(
  parameters: MonitoringParameterLatest[],
  parameterName: MonitoringParameter,
  stationKeywords: string[] = [],
  allowAnyStation = false,
): MonitoringParameterLatest | undefined {
  const candidates = parameters.filter(
    (parameter) => parameter.parameter === parameterName
      && parameter.value !== null,
  );
  const preferredCandidates = stationKeywords.length > 0
    ? candidates.filter((parameter) => {
      const station = parameter.station.toLocaleLowerCase();
      return stationKeywords.some((keyword) => station.includes(keyword));
    })
    : candidates;
  const pool = preferredCandidates.length > 0
    ? preferredCandidates
    : allowAnyStation
      ? candidates
      : [];

  return pool.reduce<MonitoringParameterLatest | undefined>(
    (latest, candidate) => (
      !latest || monitoringTimestamp(candidate) > monitoringTimestamp(latest)
        ? candidate
        : latest
    ),
    undefined,
  );
}

function monitoringSource(reading: MonitoringParameterLatest | undefined): string {
  return reading ? 'Realtime' : 'Belum tersedia';
}

const dashboardSourceType: Record<DashboardMetric['source'], Exclude<MetricSource, 'unavailable'>> = {
  measured: 'api',
  derived: 'formula',
  plan: 'input',
  constant: 'constant',
};

const dashboardSourceLabel: Record<DashboardMetric['source'], string> = {
  measured: 'Realtime',
  derived: 'Formulasi',
  plan: 'Rencana',
  constant: 'Konstanta',
};

function dashboardMetricRow(
  key: string,
  metric: DashboardMetric | undefined,
  isLoading: boolean,
  uploadTarget?: DailyTelemetryUploadTarget,
  override?: { value: NullableMetric; source: string },
): MetricRow {
  if (isLoading) {
    return {
      label: metric?.label ?? key,
      value: 'Memuat…',
      source: 'Memuat',
      sourceType: 'api',
      hasData: false,
      uploadTarget,
    };
  }

  if (!metric || (override?.value ?? metric.value) === null) {
    return {
      label: metric?.label ?? key,
      value: 'N/A',
      source: 'Belum tersedia',
      sourceType: 'unavailable',
      hasData: false,
      uploadTarget,
    };
  }

  const source = override?.source ?? dashboardSourceLabel[metric.source];

  return {
    label: metric.label,
    value: formatMetric(override?.value ?? metric.value),
    unit: metric.unit ?? undefined,
    source,
    sourceType: override ? 'api' : dashboardSourceType[metric.source],
    hasData: true,
    uploadTarget,
  };
}

function dashboardMetricRows(
  group: DashboardMetricGroup | undefined,
  isLoading: boolean,
  uploadTargets: Record<string, DailyTelemetryUploadTarget | undefined> = {},
  overrides: Record<string, { value: NullableMetric; source: string } | undefined> = {},
  preferredKeys: string[] = [],
): MetricRow[] {
  const priority = new Map(preferredKeys.map((key, index) => [key, index]));
  const entries = Object.entries(group ?? {}).sort(([firstKey], [secondKey]) => {
    const firstPriority = priority.get(firstKey) ?? Number.MAX_SAFE_INTEGER;
    const secondPriority = priority.get(secondKey) ?? Number.MAX_SAFE_INTEGER;
    return firstPriority - secondPriority;
  });
  if (entries.length === 0) {
    return [dashboardMetricRow('Parameter dashboard', undefined, isLoading)];
  }

  return entries.map(([key, metric]) => dashboardMetricRow(
    key,
    metric,
    isLoading,
    uploadTargets[key],
    overrides[key],
  ));
}

function currentWibDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(new Date());
}

function buildUploadTarget(
  tags: PlantTag[],
  parameter: MonitoringParameter,
  label: string,
  unit: string,
): DailyTelemetryUploadTarget | undefined {
  const matchingTags = tags.filter((tag) => (
    tag.parameter === parameter
    && tag.protocol === 'upload'
    && tag.enabled
  ));

  if (matchingTags.length === 0) return undefined;

  return {
    label,
    parameter,
    unit,
    tags: matchingTags,
  };
}

function useObjectUrl(blob: Blob | undefined): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    let nextObjectUrl: string | null = null;
    const updateTimer = window.setTimeout(() => {
      nextObjectUrl = blob ? URL.createObjectURL(blob) : null;
      setObjectUrl(nextObjectUrl);
    }, 0);

    return () => {
      window.clearTimeout(updateTimer);
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [blob]);

  return objectUrl;
}

function StatusLabel({ value }: { value: string }) {
  const normalizedValue = value.toLocaleLowerCase('id-ID');
  const style = normalizedValue.includes('normal')
    ? 'bg-emerald-500'
    : normalizedValue.includes('basah')
      ? 'bg-cyan-500'
      : normalizedValue.includes('kering')
        ? 'bg-amber-500'
        : 'bg-slate-300';

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-slate-600">
      <span className={`size-1.5 rounded-full ${style}`} />
      {value}
    </span>
  );
}

function MonthlyTable({
  currentMonthIndex,
  records,
  isLoading,
}: {
  currentMonthIndex: number;
  records: MonthlyHydrology[];
  isLoading: boolean;
}) {
  const monthlyEntries = MONTHS.map((month, index) => {
    const record = records.find((item) => item.month === index + 1);

    return {
      month,
      index,
      predictionStatus: isLoading
        ? 'Memuat'
        : record?.hydrologyPrediction || '—',
      actualStatus: isLoading
        ? 'Memuat'
        : record?.hydrologyActual || '—',
    };
  });
  const statusRows = [
    {
      label: 'Prediksi',
      getValue: (entry: (typeof monthlyEntries)[number]) => entry.predictionStatus,
    },
    {
      label: 'Aktual',
      getValue: (entry: (typeof monthlyEntries)[number]) => entry.actualStatus,
    },
  ];

  return (
    <div className="overflow-x-auto border-y border-[#e2e8f0]">
      <table className="w-full min-w-[1120px] table-fixed border-collapse">
        <thead>
          <tr className="bg-[#f8fafc]">
            <th
              scope="col"
              className="sticky left-0 z-20 w-[136px] bg-[#f8fafc] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748b]"
            >
              Status
            </th>
            {monthlyEntries.map(({ month, index }) => {
              const isCurrentMonth = currentMonthIndex === index;

              return (
                <th
                  key={month}
                  scope="col"
                  title={isCurrentMonth ? `${month} · bulan berjalan` : month}
                  className={`border-l border-[#e2e8f0] px-2 py-3 text-center text-xs font-semibold ${
                    isCurrentMonth ? 'bg-cyan-50 text-[#0e7490]' : 'text-[#64748b]'
                  }`}
                >
                  {month.slice(0, 3)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {statusRows.map((row) => (
            <tr key={row.label} className="border-t border-[#e2e8f0]">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-white px-4 py-3 text-left text-xs font-semibold text-[#475569]"
              >
                {row.label}
              </th>
              {monthlyEntries.map((entry) => {
                const isCurrentMonth = currentMonthIndex === entry.index;

                return (
                  <td
                    key={entry.month}
                    className={`border-l border-[#e2e8f0] px-2 py-3 text-center ${
                      isCurrentMonth ? 'bg-[#f0fdff]' : 'bg-white'
                    }`}
                  >
                    <StatusLabel value={row.getValue(entry)} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ForecastMapCard({
  title,
  subtitle,
  imageUrl,
  isLoading,
  isError,
  onUpload,
}: {
  title: string;
  subtitle: string;
  imageUrl: string | null;
  isLoading: boolean;
  isError: boolean;
  onUpload?: () => void;
}) {
  const canUpload = Boolean(onUpload) && !isLoading && !imageUrl;
  const content = (
    <>
      <div className="border-b border-[#e2e8f0] px-4 py-3">
        <h3 className="text-sm font-semibold text-[#0f172a]">{title}</h3>
        <p className="mt-0.5 text-xs text-[#94a3b8]">{subtitle}</p>
      </div>
      <div className="flex h-[220px] items-center justify-center bg-[#f8fafc]">
        {isLoading ? (
          <Skeleton className="size-full rounded-none" />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="size-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <ImageOff size={24} className={isError ? 'text-red-400' : 'text-slate-300'} />
            <p className={`text-xs font-medium ${isError ? 'text-red-500' : 'text-slate-400'}`}>
              {isError ? 'Gambar gagal dimuat' : 'Gambar belum tersedia'}
            </p>
            {canUpload && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700">
                <Upload size={13} />
                Klik untuk unggah
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-[#e2e8f0] px-4 py-2.5 text-[11px]">
        <span className="text-[#64748b]">Sumber gambar BMKG</span>
        <span className="font-medium text-[#0e7490]">
          {imageUrl ? 'Tersedia' : canUpload ? 'Siap diunggah' : 'Belum tersedia'}
        </span>
      </div>
    </>
  );

  if (canUpload && onUpload) {
    return (
      <button
        type="button"
        onClick={onUpload}
        aria-label={`Unggah ${title}`}
        className="overflow-hidden border border-[#e2e8f0] bg-white text-left transition-colors hover:border-cyan-300 hover:bg-cyan-50/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
      >
        {content}
      </button>
    );
  }

  return (
    <article className="overflow-hidden border border-[#e2e8f0] bg-white">
      {content}
    </article>
  );
}

function ForecastDetail({ rows }: { rows: MetricRow[] }) {
  return (
    <article className="overflow-hidden border border-[#e2e8f0] bg-white">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 bg-[#f8fafc] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">
        <span>Parameter</span>
        <span>Nilai</span>
      </div>
      <div className="divide-y divide-[#f1f5f9] px-4">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-medium leading-5 text-[#475569]">{row.label}</p>
              <p className={`mt-0.5 text-[11px] font-medium ${sourceClasses[row.sourceType]}`}>
                {row.source}
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-[#0f172a]">{row.value}</span>
              {row.unit && <span className="ml-1 text-[10px] text-[#94a3b8]">{row.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function ZoneCard({
  cardRef,
  isHighlighted = false,
  onHighlightChange,
  title,
  subtitle,
  sections,
  onUpload,
}: ZoneCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const compactRowLimit = 5;
  const rowCount = sections.reduce((total, section) => total + section.rows.length, 0);
  const visibleSections = sections.map((section, sectionIndex) => {
    const precedingRowCount = sections
      .slice(0, sectionIndex)
      .reduce((total, precedingSection) => total + precedingSection.rows.length, 0);
    const remainingVisibleRows = Math.max(0, compactRowLimit - precedingRowCount);
    const rows = isExpanded
      ? section.rows
      : section.rows.slice(0, remainingVisibleRows);
    return { ...section, rows };
  });
  const canToggle = rowCount > compactRowLimit;

  return (
    <article
      ref={cardRef}
      tabIndex={-1}
      onPointerEnter={() => onHighlightChange?.(true)}
      onPointerLeave={() => onHighlightChange?.(false)}
      onFocusCapture={() => onHighlightChange?.(true)}
      onBlurCapture={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        onHighlightChange?.(false);
      }}
      className={`overflow-hidden border bg-white outline-none transition-[border-color,box-shadow] duration-200 ${
        isHighlighted
          ? 'border-cyan-400 shadow-[0_0_0_3px_rgba(34,211,238,0.14)]'
          : 'border-[#e2e8f0]'
      }`}
    >
      <div className="border-b border-[#e2e8f0] px-5 py-4">
        <h3 className="text-[15px] font-semibold text-[#0f172a]">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-[#94a3b8]">{subtitle}</p>}
      </div>

      {visibleSections.map((section) => (
        <section key={section.title}>
          {visibleSections.length > 1 && (
            <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-5 py-2.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">
                {section.title}
              </h4>
            </div>
          )}
          <div className="divide-y divide-[#f1f5f9] px-5">
            {section.rows.map((row) => (
              <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium leading-5 text-[#475569]">{row.label}</p>
                  <p className={`mt-0.5 text-[11px] font-medium ${sourceClasses[row.sourceType]}`}>
                    {row.source}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 whitespace-nowrap text-right">
                  <div>
                    <span className={`text-sm font-semibold ${
                      row.sourceType === 'unavailable' ? 'text-[#dc2626]' : 'text-[#0f172a]'
                    }`}>
                      {row.value}
                    </span>
                    {row.unit && <span className="ml-1 text-[10px] text-[#94a3b8]">{row.unit}</span>}
                  </div>
                  {row.uploadTarget && onUpload && (
                    <button
                      type="button"
                      onClick={() => onUpload(row.uploadTarget!)}
                      className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-cyan-700 transition-colors hover:text-cyan-800"
                    >
                      <Upload size={12} />
                      {row.hasData ? 'Edit data' : 'Input data'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
      {canToggle && (
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          aria-expanded={isExpanded}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 border-t border-[#e2e8f0] bg-[#f8fafc] px-4 py-2.5 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-50 hover:text-cyan-800"
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {isExpanded ? 'Ringkas parameter' : `Lihat semua (${rowCount})`}
        </button>
      )}
    </article>
  );
}

function GenericHydrologySchematic({ plantName }: { plantName: string }) {
  return (
    <article className="overflow-hidden border border-[#e2e8f0] bg-white">
      <div className="border-b border-[#e2e8f0] px-5 py-4">
        <h3 className="text-[15px] font-semibold text-[#0f172a]">Skema Hidrologi</h3>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[860px] p-5">
          <svg
            viewBox="0 0 1040 280"
            className="h-[280px] w-full"
            role="img"
            aria-label={`Skema aliran hidrologi PLTA ${plantName}`}
          >
            <defs>
              <pattern id="schematic-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M24 0H0V24" fill="none" stroke="#e2e8f0" strokeWidth="1" />
              </pattern>
              <marker id="schematic-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                <path d="M0 0V6L9 3Z" fill="#0891b2" />
              </marker>
            </defs>

            <rect width="1040" height="280" rx="10" fill="#f8fafc" />
            <rect width="1040" height="280" rx="10" fill="url(#schematic-grid)" />

            <path
              d="M106 168H266C322 168 342 207 408 207H483"
              fill="none"
              markerEnd="url(#schematic-arrow)"
              stroke="#0891b2"
              strokeLinecap="round"
              strokeWidth="8"
            />
            <path
              d="M560 207H659"
              fill="none"
              markerEnd="url(#schematic-arrow)"
              stroke="#0891b2"
              strokeLinecap="round"
              strokeWidth="8"
            />
            <path
              d="M744 207H939"
              fill="none"
              markerEnd="url(#schematic-arrow)"
              stroke="#0891b2"
              strokeLinecap="round"
              strokeWidth="8"
            />

            <g>
              <rect x="45" y="87" width="150" height="82" rx="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
              <text x="120" y="117" textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="700">HULU</text>
              <text x="120" y="140" textAnchor="middle" fill="#64748b" fontSize="11">Catchment & inflow</text>
            </g>

            <g>
              <path
                d="M290 109C328 83 368 84 402 101C438 119 464 96 503 107V205H290Z"
                fill="#cffafe"
                stroke="#0891b2"
                strokeWidth="2"
              />
              <text x="397" y="145" textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="700">WADUK</text>
              <text x="397" y="167" textAnchor="middle" fill="#64748b" fontSize="11">{plantName}</text>
            </g>

            <g>
              <path d="M518 72H552L573 220H532Z" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" />
              <text x="546" y="51" textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="700">DAM</text>
              <text x="546" y="239" textAnchor="middle" fill="#64748b" fontSize="11">Spillway</text>
            </g>

            <g>
              <rect x="630" y="106" width="145" height="100" rx="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
              <circle cx="702" cy="143" r="18" fill="#ecfeff" stroke="#0891b2" strokeWidth="2" />
              <path d="M702 129V157M688 143H716" stroke="#0891b2" strokeWidth="2" />
              <text x="702" y="182" textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="700">POWERHOUSE</text>
            </g>

            <g>
              <rect x="845" y="87" width="150" height="82" rx="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
              <text x="920" y="117" textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="700">HILIR</text>
              <text x="920" y="140" textAnchor="middle" fill="#64748b" fontSize="11">Tailrace & downstream</text>
            </g>

            <text x="221" y="157" textAnchor="middle" fill="#64748b" fontSize="10">Inflow</text>
            <text x="610" y="196" textAnchor="middle" fill="#64748b" fontSize="10">Debit turbin</text>
            <text x="806" y="196" textAnchor="middle" fill="#64748b" fontSize="10">Outflow</text>
          </svg>
        </div>
      </div>
    </article>
  );
}

interface HydrologySpatialLayoutProps {
  plant: Pick<Plant, 'code' | 'name'>;
  plantName: string;
  upstreamSections: MetricSection[];
  damSections: MetricSection[];
  downstreamSections: MetricSection[];
  onUpload: (target: DailyTelemetryUploadTarget) => void;
}

interface HydrologyConnectorPath {
  zone: HydrologyZone;
  path: string;
  endX: number;
  endY: number;
}

interface HydrologyConnectorLayout {
  width: number;
  height: number;
  paths: HydrologyConnectorPath[];
}

const hydrologyZones: HydrologyZone[] = ['upstream', 'dam', 'downstream'];

const hydrologyConnectorColors: Record<HydrologyZone, string> = {
  upstream: '#22d3ee',
  dam: '#f59e0b',
  downstream: '#34d399',
};

function HydrologyConnectorOverlay({
  activeZone,
  layout,
}: {
  activeZone: HydrologyZone | null;
  layout: HydrologyConnectorLayout | null;
}) {
  if (!layout || layout.paths.length === 0) return null;

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 hidden h-full w-full overflow-visible xl:block"
    >
      {layout.paths.map((connector) => {
        const color = hydrologyConnectorColors[connector.zone];
        const isActive = activeZone === connector.zone;
        const isMuted = activeZone !== null && !isActive;

        return (
          <g key={connector.zone}>
            <path
              d={connector.path}
              fill="none"
              stroke="#ffffff"
              strokeOpacity={isMuted ? 0.28 : 0.82}
              strokeWidth={isActive ? 7 : 6}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={connector.path}
              fill="none"
              stroke={color}
              strokeDasharray={isActive ? undefined : '7 7'}
              strokeLinecap="round"
              strokeOpacity={isMuted ? 0.2 : isActive ? 1 : 0.72}
              strokeWidth={isActive ? 3 : 2}
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={connector.endX}
              cy={connector.endY}
              r={isActive ? 6 : 4.5}
              fill={color}
              stroke="#ffffff"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              opacity={isMuted ? 0.28 : 1}
            />
          </g>
        );
      })}
    </svg>
  );
}

function HydrologySpatialLayout({
  plant,
  plantName,
  upstreamSections,
  damSections,
  downstreamSections,
  onUpload,
}: HydrologySpatialLayoutProps) {
  const imagery = getDamImagery(plant);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageLoadFailed = Boolean(imagery && failedImageUrl === imagery.imageUrl);
  const [activeZone, setActiveZone] = useState<HydrologyZone | null>(null);
  const [connectorLayout, setConnectorLayout] =
    useState<HydrologyConnectorLayout | null>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<HTMLElement | null>(null);
  const upstreamCardRef = useRef<HTMLElement | null>(null);
  const damCardRef = useRef<HTMLElement | null>(null);
  const downstreamCardRef = useRef<HTMLElement | null>(null);
  const spatialImageUrl = imagery && !imageLoadFailed ? imagery.imageUrl : null;

  const getCardElement = useCallback((zone: HydrologyZone): HTMLElement | null => {
    if (zone === 'upstream') return upstreamCardRef.current;
    if (zone === 'dam') return damCardRef.current;
    return downstreamCardRef.current;
  }, []);

  const selectZone = useCallback((zone: HydrologyZone) => {
    setActiveZone(zone);
    const card = getCardElement(zone);

    card?.focus({ preventScroll: true });
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [getCardElement]);

  useEffect(() => {
    if (!spatialImageUrl) return undefined;

    const layoutElement = layoutRef.current;
    const mapElement = mapRef.current;

    if (!layoutElement || !mapElement) return undefined;

    let animationFrame = 0;

    const measure = () => {
      const layoutRect = layoutElement.getBoundingClientRect();
      const paths: HydrologyConnectorPath[] = [];

      hydrologyZones.forEach((zone) => {
        const anchor = mapElement.querySelector<SVGCircleElement>(
          `[data-hydrology-anchor-point="${zone}"]`,
        );
        const card = getCardElement(zone);

        if (!anchor || !card) return;

        const anchorRect = anchor.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const startX = cardRect.left + (cardRect.width / 2) - layoutRect.left;
        const startY = cardRect.bottom - layoutRect.top;
        const endX = anchorRect.left + (anchorRect.width / 2) - layoutRect.left;
        const endY = anchorRect.top + (anchorRect.height / 2) - layoutRect.top;
        const verticalDistance = Math.max(1, endY - startY);
        const controlY = startY + Math.max(52, verticalDistance * 0.48);
        const round = (value: number) => Math.round(value * 100) / 100;

        paths.push({
          zone,
          path: [
            `M ${round(startX)} ${round(startY)}`,
            `C ${round(startX)} ${round(controlY)}`,
            `${round(endX)} ${round(controlY)}`,
            `${round(endX)} ${round(endY)}`,
          ].join(' '),
          endX: round(endX),
          endY: round(endY),
        });
      });

      setConnectorLayout({
        width: Math.max(1, Math.round(layoutRect.width)),
        height: Math.max(1, Math.round(layoutRect.height)),
        paths,
      });
    };

    const scheduleMeasure = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(measure);
    };

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(layoutElement);
    resizeObserver.observe(mapElement);
    hydrologyZones.forEach((zone) => {
      const card = getCardElement(zone);
      if (card) resizeObserver.observe(card);
    });
    window.addEventListener('resize', scheduleMeasure);
    scheduleMeasure();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', scheduleMeasure);
      resizeObserver.disconnect();
    };
  }, [getCardElement, spatialImageUrl]);

  const renderCards = (className: string) => (
    <div className={className}>
      <ZoneCard
        cardRef={upstreamCardRef}
        isHighlighted={activeZone === 'upstream'}
        onHighlightChange={(isHighlighted) => (
          setActiveZone((current) => (
            isHighlighted ? 'upstream' : current === 'upstream' ? null : current
          ))
        )}
        title="Hulu"
        sections={upstreamSections}
        onUpload={onUpload}
      />
      <ZoneCard
        cardRef={damCardRef}
        isHighlighted={activeZone === 'dam'}
        onHighlightChange={(isHighlighted) => (
          setActiveZone((current) => (
            isHighlighted ? 'dam' : current === 'dam' ? null : current
          ))
        )}
        title="Bendungan"
        sections={damSections}
        onUpload={onUpload}
      />
      <ZoneCard
        cardRef={downstreamCardRef}
        isHighlighted={activeZone === 'downstream'}
        onHighlightChange={(isHighlighted) => (
          setActiveZone((current) => (
            isHighlighted ? 'downstream' : current === 'downstream' ? null : current
          ))
        )}
        title="Hilir"
        sections={downstreamSections}
        onUpload={onUpload}
      />
    </div>
  );

  if (!imagery || imageLoadFailed) {
    return (
      <>
        {renderCards('relative z-30 mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.9fr_0.9fr]')}
        <div className="mt-5">
          <GenericHydrologySchematic plantName={plantName} />
        </div>
      </>
    );
  }

  return (
    <div ref={layoutRef} className="relative">
      {renderCards('relative z-30 grid gap-5 xl:grid-cols-[1.15fr_0.9fr_0.9fr]')}
      <HydrologyConnectorOverlay
        activeZone={activeZone}
        layout={connectorLayout}
      />
      <div className="mt-5 xl:mt-16">
        <SatelliteHydrologyMap
          imagery={imagery}
          activeZone={activeZone}
          mapRef={mapRef}
          onActiveZoneChange={setActiveZone}
          onImageError={() => setFailedImageUrl(imagery.imageUrl)}
          onZoneSelect={selectZone}
        />
      </div>
    </div>
  );
}

export default function Telemetering() {
  const { plant, plta, pltaId } = useActivePLTA();
  const operationYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  const [isMonthlySheetOpen, setIsMonthlySheetOpen] = useState(false);
  const [imageUploadKind, setImageUploadKind] = useState<MonthlyHydrologyImageKind | null>(null);
  const [dailyUploadTarget, setDailyUploadTarget] =
    useState<DailyTelemetryUploadTarget | null>(null);
  const closeMonthlySheet = useCallback(() => setIsMonthlySheetOpen(false), []);
  const closeImageUploadSheet = useCallback(() => setImageUploadKind(null), []);
  const closeDailyUploadSheet = useCallback(() => setDailyUploadTarget(null), []);
  const selectedMonth = MONTHS[currentMonthIndex];
  const selectedMonthNumber = currentMonthIndex + 1;
  const dashboardQuery = usePLTAHydrologyDashboardQuery(pltaId);
  const monthlyQuery = useMonthlyHydrologyQuery(pltaId, operationYear);
  const uploadTagsQuery = usePLTATagsQuery(pltaId, {
    page: 1,
    limit: 200,
    protocol: 'upload',
    enabled: true,
  });
  const monitoringQuery = usePLTALatestQuery(pltaId, false);
  const monitoringStream = useMonitoringStream({
    scope: 'plta',
    id: pltaId,
    bootstrapLatest: false,
  });
  const monthlyRecords = useMemo(() => {
    const records = monthlyQuery.data ?? [];
    const dashboardMonthly = dashboardQuery.data?.monthly;

    if (!dashboardMonthly || dashboardMonthly.year !== operationYear) {
      return records;
    }

    return [
      dashboardMonthly,
      ...records.filter((record) => record.month !== dashboardMonthly.month),
    ];
  }, [dashboardQuery.data?.monthly, monthlyQuery.data, operationYear]);
  const selectedMonthlyRecord = monthlyRecords.find(
    (item) => item.month === selectedMonthNumber,
  );
  const rainfallImageQuery = useMonthlyHydrologyImageQuery(
    pltaId,
    operationYear,
    selectedMonthNumber,
    'curah_hujan',
    Boolean(selectedMonthlyRecord?.rainfallImage),
  );
  const rainfallCharacteristicImageQuery = useMonthlyHydrologyImageQuery(
    pltaId,
    operationYear,
    selectedMonthNumber,
    'sifat_hujan',
    Boolean(selectedMonthlyRecord?.rainfallCharacteristicImage),
  );
  const rainfallImageUrl = useObjectUrl(rainfallImageQuery.data);
  const rainfallCharacteristicImageUrl = useObjectUrl(
    rainfallCharacteristicImageQuery.data,
  );
  const daily = dashboardQuery.data?.daily ?? null;
  const uploadTags = uploadTagsQuery.isPlaceholderData
    ? undefined
    : uploadTagsQuery.data?.items;
  const dailyUploadTargets = useMemo(() => ({
    targetTma: buildUploadTarget(
      uploadTags ?? [],
      'plan_water_level',
      'Target tinggi muka air waduk (TMA)',
      'mdpl',
    ),
    plannedTurbineDischarge: buildUploadTarget(
      uploadTags ?? [],
      'plan_outflow_turbine',
      'Rencana debit turbin',
      'm³/detik',
    ),
    plannedSpillwayDischarge: buildUploadTarget(
      uploadTags ?? [],
      'plan_outflow_spillway',
      'Rencana debit spillway',
      'm³/detik',
    ),
    plannedHjvDischarge: buildUploadTarget(
      uploadTags ?? [],
      'plan_outflow_hjv',
      'Rencana debit HJV',
      'm³/detik',
    ),
    spillwayDischarge: buildUploadTarget(
      uploadTags ?? [],
      'outflow_spillway',
      'Debit spillway',
      'm³/detik',
    ),
    hjvDischarge: buildUploadTarget(
      uploadTags ?? [],
      'outflow_hjv',
      'Debit HJV',
      'm³/detik',
    ),
  }), [uploadTags]);
  const monitoringParameters = monitoringQuery.data?.parameters ?? [];
  const reservoirReading = latestMonitoringParameter(
    monitoringParameters,
    'reservoir',
    [],
    true,
  );
  const tailraceReading = latestMonitoringParameter(
    monitoringParameters,
    'water_level',
    ['tailrace', 'trailrace', 'hilir', 'downstream'],
  );
  const turbineDischargeReading = latestMonitoringParameter(
    monitoringParameters,
    'total_outflow',
    ['turbin', 'turbine', 'powerhouse', 'unit'],
    true,
  );
  const isDailyLoading = dashboardQuery.isLoading;
  const reservoirOverride = useMemo(() => reservoirReading?.value === undefined
    ? undefined
    : {
      value: reservoirReading.value,
      source: monitoringSource(reservoirReading),
    }, [reservoirReading]);
  const tailraceOverride = useMemo(() => tailraceReading?.value === undefined
    ? undefined
    : {
      value: tailraceReading.value,
      source: monitoringSource(tailraceReading),
    }, [tailraceReading]);
  const turbineDischargeOverride = useMemo(() => turbineDischargeReading?.value === undefined
    ? undefined
    : {
      value: turbineDischargeReading.value,
      source: monitoringSource(turbineDischargeReading),
    }, [turbineDischargeReading]);

  const forecast = useMemo(() => {
    const record = selectedMonthlyRecord;
    const apiSource = 'Data bulanan';

    return {
      rows: [
        {
          label: 'Prediksi hidrologi',
          value: record?.hydrologyPrediction || 'N/A',
          source: record?.hydrologyPrediction ? apiSource : 'Belum tersedia',
          sourceType: record?.hydrologyPrediction ? 'api' : 'unavailable',
        },
        {
          label: 'Aktual hidrologi',
          value: record?.hydrologyActual || 'N/A',
          source: record?.hydrologyActual ? apiSource : 'Belum tersedia',
          sourceType: record?.hydrologyActual ? 'api' : 'unavailable',
        },
        {
          label: `Prediksi kemampuan produksi energi ${selectedMonth}`,
          value: formatMetric(record?.predictedProductionMwh ?? null),
          unit: record?.predictedProductionMwh === null || record?.predictedProductionMwh === undefined
            ? undefined
            : 'MWh',
          source: record?.predictedProductionMwh === null || record?.predictedProductionMwh === undefined
            ? 'Belum tersedia'
            : apiSource,
          sourceType: record?.predictedProductionMwh === null || record?.predictedProductionMwh === undefined
            ? 'unavailable'
            : 'api',
        },
        {
          label: `Target produksi energi listrik ${selectedMonth}`,
          value: formatMetric(record?.targetProductionMwh ?? null),
          unit: record?.targetProductionMwh === null || record?.targetProductionMwh === undefined
            ? undefined
            : 'MWh',
          source: record?.targetProductionMwh === null || record?.targetProductionMwh === undefined
            ? 'Belum tersedia'
            : apiSource,
          sourceType: record?.targetProductionMwh === null || record?.targetProductionMwh === undefined
            ? 'unavailable'
            : 'input',
        },
        {
          label: 'Pencapaian energi s.d. bulan sebelumnya',
          value: formatMetric(record?.previousAchievementMwh ?? null),
          unit: record?.previousAchievementMwh === null || record?.previousAchievementMwh === undefined
            ? undefined
            : 'MWh',
          source: record?.previousAchievementMwh === null || record?.previousAchievementMwh === undefined
            ? 'Belum tersedia'
            : apiSource,
          sourceType: record?.previousAchievementMwh === null || record?.previousAchievementMwh === undefined
            ? 'unavailable'
            : 'api',
        },
        {
          label: `Prediksi pencapaian energi s.d. ${selectedMonth}`,
          value: formatMetric(record?.predictedPreviousAchievementMwh ?? null),
          unit: record?.predictedPreviousAchievementMwh === null
            || record?.predictedPreviousAchievementMwh === undefined
            ? undefined
            : 'MWh',
          source: record?.predictedPreviousAchievementMwh === null
            || record?.predictedPreviousAchievementMwh === undefined
            ? 'Belum tersedia'
            : apiSource,
          sourceType: record?.predictedPreviousAchievementMwh === null
            || record?.predictedPreviousAchievementMwh === undefined
            ? 'unavailable'
            : 'api',
        },
        {
          label: `Target pencapaian energi s.d. ${selectedMonth}`,
          value: formatMetric(record?.targetPreviousAchievementMwh ?? null),
          unit: record?.targetPreviousAchievementMwh === null
            || record?.targetPreviousAchievementMwh === undefined
            ? undefined
            : 'MWh',
          source: record?.targetPreviousAchievementMwh === null
            || record?.targetPreviousAchievementMwh === undefined
            ? 'Belum tersedia'
            : apiSource,
          sourceType: record?.targetPreviousAchievementMwh === null
            || record?.targetPreviousAchievementMwh === undefined
            ? 'unavailable'
            : 'input',
        },
        {
          label: 'Persentase pencapaian',
          value: formatMetric(record?.achievementPercentage ?? null, 1),
          unit: record?.achievementPercentage === null || record?.achievementPercentage === undefined
            ? undefined
            : '%',
          source: record?.achievementPercentage === null || record?.achievementPercentage === undefined
            ? 'Belum tersedia'
            : 'Formulasi',
          sourceType: record?.achievementPercentage === null || record?.achievementPercentage === undefined
            ? 'unavailable'
            : 'formula',
        },
      ] satisfies MetricRow[],
    };
  }, [selectedMonth, selectedMonthlyRecord]);

  const upstreamSections = useMemo<MetricSection[]>(() => [{
    title: 'Parameter hulu',
    rows: dashboardMetricRows(
      daily?.upstream,
      isDailyLoading,
      { target_tma: dailyUploadTargets.targetTma },
      { tma_waduk: reservoirOverride },
      ['target_tma', 'tma_waduk', 'inflow', 'curah_hujan', 'volume_waduk'],
    ),
  }], [
    daily?.upstream,
    dailyUploadTargets.targetTma,
    isDailyLoading,
    reservoirOverride,
  ]);

  const damSections = useMemo<MetricSection[]>(() => [{
    title: 'Parameter bendungan dan pelepasan',
    rows: dashboardMetricRows(
      daily?.dam,
      isDailyLoading,
      {
        rencana_debit_turbin_unit_1: dailyUploadTargets.plannedTurbineDischarge,
        rencana_debit_turbin_unit_2: dailyUploadTargets.plannedTurbineDischarge,
        rencana_debit_turbin_unit_3: dailyUploadTargets.plannedTurbineDischarge,
        rencana_debit_turbin_unit_4: dailyUploadTargets.plannedTurbineDischarge,
        rencana_debit_spillway: dailyUploadTargets.plannedSpillwayDischarge,
        rencana_debit_hjv: dailyUploadTargets.plannedHjvDischarge,
        debit_spillway: dailyUploadTargets.spillwayDischarge,
        debit_hjv: dailyUploadTargets.hjvDischarge,
      },
      { debit_turbin_total: turbineDischargeOverride },
      ['debit_turbin_total', 'debit_spillway', 'debit_irigasi', 'debit_ddc', 'delta_head'],
    ),
  }], [
    daily?.dam,
    dailyUploadTargets.hjvDischarge,
    dailyUploadTargets.plannedHjvDischarge,
    dailyUploadTargets.plannedSpillwayDischarge,
    dailyUploadTargets.plannedTurbineDischarge,
    dailyUploadTargets.spillwayDischarge,
    isDailyLoading,
    turbineDischargeOverride,
  ]);

  const downstreamSections = useMemo<MetricSection[]>(() => [{
    title: 'Parameter hilir',
    rows: dashboardMetricRows(
      daily?.downstream,
      isDailyLoading,
      {},
      { tma_tailrace: tailraceOverride },
      ['tma_tailrace', 'head', 'swc_unit_1', 'turbidity_hilir', 'ph_hilir'],
    ),
  }], [
    daily?.downstream,
    isDailyLoading,
    tailraceOverride,
  ]);
  return (
    <div className="flex flex-1 flex-col gap-5 animate-in fade-in duration-500">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <h1 className="page-title">Telemetering</h1>
        <PlantSwitcher page="telemetering" />
      </header>

      <section className="border-t border-[#e2e8f0] pt-5">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <h2 className="text-base font-semibold text-[#0f172a]">Hidrologi Bulanan</h2>
          <span className="text-xs font-medium text-[#64748b]">{operationYear}</span>
        </div>

        {monthlyQuery.isError && (
          <div className="mb-4 flex flex-col gap-3 border-y border-red-100 bg-red-50/50 px-4 py-3 text-xs text-red-600 sm:flex-row sm:items-center sm:justify-between">
            <span>{getHydrologyErrorMessage(monthlyQuery.error)}</span>
            <button
              type="button"
              onClick={() => void monthlyQuery.refetch()}
              className="inline-flex cursor-pointer items-center gap-1.5 self-start font-semibold hover:text-red-700"
            >
              <RefreshCw size={13} />
              Coba lagi
            </button>
          </div>
        )}

        <MonthlyTable
          currentMonthIndex={currentMonthIndex}
          records={monthlyRecords}
          isLoading={monthlyQuery.isLoading}
        />

        <div className="mt-5 border-t border-[#e2e8f0] pt-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(380px,0.9fr)_minmax(0,1.1fr)]">
            <div>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <h2 className="text-base font-semibold text-[#0f172a]">Ringkasan {selectedMonth}</h2>
                </div>
                <Button
                  type="button"
                  size="sm"
                  leftIcon={<PencilLine size={15} />}
                  disabled={monthlyQuery.isLoading}
                  onClick={() => setIsMonthlySheetOpen(true)}
                  className="h-9 shrink-0 whitespace-nowrap"
                >
                  Input Data Bulanan
                </Button>
              </div>
              <div className="mt-4">
                <ForecastDetail rows={forecast.rows} />
              </div>
            </div>
            <div className="border-t border-[#e2e8f0] pt-5 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-[#0f172a]">Prakiraan Hujan</h3>
              </div>
              <div className="grid gap-4">
                <ForecastMapCard
                  title="Prakiraan Curah Hujan"
                  subtitle={`${selectedMonth} ${operationYear}`}
                  imageUrl={rainfallImageUrl}
                  isLoading={rainfallImageQuery.isLoading}
                  isError={rainfallImageQuery.isError}
                  onUpload={!monthlyQuery.isLoading && !selectedMonthlyRecord?.rainfallImage
                    ? () => setImageUploadKind('curah_hujan')
                    : undefined}
                />
                <ForecastMapCard
                  title="Prakiraan Sifat Hujan"
                  subtitle="Terhadap kondisi klimatologis"
                  imageUrl={rainfallCharacteristicImageUrl}
                  isLoading={rainfallCharacteristicImageQuery.isLoading}
                  isError={rainfallCharacteristicImageQuery.isError}
                  onUpload={!monthlyQuery.isLoading && !selectedMonthlyRecord?.rainfallCharacteristicImage
                    ? () => setImageUploadKind('sifat_hujan')
                    : undefined}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-start gap-2 border-y border-[#e2e8f0] py-3">
        <Info size={14} className="mt-0.5 shrink-0 text-[#64748b]" />
        <p className="text-xs leading-5 text-[#64748b]">
          Prediksi hidrologi belum mempertimbangkan kebutuhan alokasi air, kesiapan unit
          pembangkit, dan kebutuhan sistem kelistrikan.
        </p>
      </div>

      <section className="border-t border-[#e2e8f0] pt-5">
        <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-base font-semibold text-[#0f172a]">Hidrologi Harian</h2>
            {daily && (
              <p className="mt-1 text-xs text-[#64748b]">{formatHydrologyDate(daily.date)}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium">
            <span className={monitoringStream.status === 'open' ? 'text-emerald-600' : 'text-amber-600'}>
              {monitoringStream.status === 'open' ? 'Realtime aktif' : 'Realtime belum aktif'}
            </span>
            {(uploadTags?.length ?? 0) > 0 && (
              <span className="text-cyan-700">Input</span>
            )}
            <span className="text-[#b45309]">Formulasi</span>
            <span className="text-[#94a3b8]">Konstanta</span>
            <span className="inline-flex items-center gap-1 text-[#dc2626]">
              <AlertTriangle size={11} />
              Belum tersedia
            </span>
            {(monitoringStream.status === 'error' || monitoringStream.status === 'closed') && (
              <button
                type="button"
                onClick={monitoringStream.reconnect}
                className="inline-flex cursor-pointer items-center gap-1 text-red-600 hover:text-red-700"
              >
                <RefreshCw size={11} />
                Hubungkan ulang
              </button>
            )}
          </div>
        </div>

        {dashboardQuery.isError && (
          <div className="mb-5 flex flex-col gap-3 border-y border-red-100 bg-red-50/50 px-4 py-3 text-xs text-red-600 sm:flex-row sm:items-center sm:justify-between">
            <span>{getHydrologyErrorMessage(dashboardQuery.error)}</span>
            <button
              type="button"
              onClick={() => void dashboardQuery.refetch()}
              className="inline-flex cursor-pointer items-center gap-1.5 self-start font-semibold hover:text-red-700"
            >
              <RefreshCw size={13} />
              Coba lagi
            </button>
          </div>
        )}

        {uploadTagsQuery.isError && (
          <div className="mb-5 flex flex-col gap-3 border-y border-amber-100 bg-amber-50/60 px-4 py-3 text-xs text-amber-700 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Katalog input manual belum dapat dimuat. Data monitoring tetap tersedia.
            </span>
            <button
              type="button"
              onClick={() => void uploadTagsQuery.refetch()}
              className="inline-flex cursor-pointer items-center gap-1.5 self-start font-semibold hover:text-amber-800"
            >
              <RefreshCw size={13} />
              Coba lagi
            </button>
          </div>
        )}

        {daily && daily.pendingFormulas.length > 0 && (
          <div className="mb-5 flex items-start gap-2 border-y border-amber-100 bg-amber-50/60 px-4 py-3">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-xs leading-5 text-amber-700">
              {daily.pendingFormulas.length} formula masih menunggu data:
              {' '}
              {daily.pendingFormulas.join(', ')}
            </p>
          </div>
        )}

        <HydrologySpatialLayout
          plant={plant}
          plantName={plta.shortName}
          upstreamSections={upstreamSections}
          damSections={damSections}
          downstreamSections={downstreamSections}
          onUpload={setDailyUploadTarget}
        />
      </section>

      {isMonthlySheetOpen && (
        <MonthlyHydrologySheet
          isOpen
          pltaId={pltaId}
          plantName={plta.shortName}
          year={operationYear}
          month={selectedMonthNumber}
          monthLabel={selectedMonth}
          record={selectedMonthlyRecord}
          onClose={closeMonthlySheet}
        />
      )}

      {imageUploadKind && (
        <HydrologyImageUploadSheet
          isOpen
          pltaId={pltaId}
          plantName={plta.shortName}
          year={operationYear}
          month={selectedMonthNumber}
          monthLabel={selectedMonth}
          kind={imageUploadKind}
          onClose={closeImageUploadSheet}
        />
      )}

      {dailyUploadTarget && (
        <TelemetryUploadSheet
          isOpen
          pltaId={pltaId}
          plantName={plta.shortName}
          defaultDate={daily?.date ?? currentWibDate()}
          target={dailyUploadTarget}
          onClose={closeDailyUploadSheet}
        />
      )}
    </div>
  );
}
