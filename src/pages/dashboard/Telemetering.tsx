import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  ImageOff,
  Info,
  LoaderCircle,
  MapPin,
  PencilLine,
  RefreshCw,
  Upload,
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import PlantSwitcher from '../../features/plta/components/PlantSwitcher';
import {
  useMonitoringStream,
  usePLTALatestQuery,
  type MonitoringConnectionStatus,
  type MonitoringParameter,
  type MonitoringParameterLatest,
} from '../../features/monitoring';
import {
  useActivePLTA,
  usePLTATagsQuery,
} from '../../features/plta/api/queries';
import { getDamImagery } from '../../features/plta/dam-imagery';
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
  uploadTarget?: DailyTelemetryUploadTarget;
}

interface MetricSection {
  title: string;
  rows: MetricRow[];
}

interface ZoneCardProps {
  title: string;
  subtitle: string;
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

function formatHydrologyTime(value: string | null): string | null {
  if (!value) return null;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
    timeZoneName: 'short',
  }).format(new Date(value));
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

function monitoringSource(
  reading: MonitoringParameterLatest | undefined,
  status: MonitoringConnectionStatus,
): string {
  if (!reading) return 'Dashboard API';

  const source = status === 'open' ? 'WebSocket' : 'Monitoring terakhir';
  const time = formatHydrologyTime(reading.time);
  return [source, reading.station || null, time].filter(Boolean).join(' · ');
}

function sumMetrics(values: NullableMetric[]): NullableMetric {
  const availableValues = values.filter((value): value is number => value !== null);
  if (availableValues.length === 0) return null;
  return availableValues.reduce((total, value) => total + value, 0);
}

function metricRow(
  label: string,
  value: NullableMetric,
  unit: string,
  source: string,
  sourceType: Exclude<MetricSource, 'unavailable'>,
  maximumFractionDigits = 2,
  isLoading = false,
  uploadTarget?: DailyTelemetryUploadTarget,
): MetricRow {
  if (isLoading) {
    return {
      label,
      value: 'Memuat…',
      source: 'Mengambil data API',
      sourceType: 'api',
      uploadTarget,
    };
  }

  if (value === null) {
    return {
      label,
      value: 'N/A',
      source: 'Belum tersedia',
      sourceType: 'unavailable',
      uploadTarget,
    };
  }

  return {
    label,
    value: formatMetric(value, maximumFractionDigits),
    unit,
    source,
    sourceType,
    uploadTarget,
  };
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
  const style = value === 'Final' || value === 'Tersedia'
    ? 'bg-emerald-500'
    : value === 'Aktif' || value === 'Proses'
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
  selectedMonthIndex,
  records,
  isLoading,
  onSelectMonth,
}: {
  selectedMonthIndex: number;
  records: MonthlyHydrology[];
  isLoading: boolean;
  onSelectMonth: (index: number) => void;
}) {
  return (
    <div className="overflow-x-auto border-y border-[#e2e8f0]">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#f8fafc]">
            <th scope="col" className="w-[34%] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748b]">Bulan</th>
            <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748b]">Prediksi</th>
            <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748b]">Aktual</th>
          </tr>
        </thead>
        <tbody>
          {MONTHS.map((month, index) => {
            const isSelected = selectedMonthIndex === index;
            const record = records.find((item) => item.month === index + 1);
            const predictionStatus = isLoading
              ? 'Memuat'
              : record?.hydrologyPrediction
                ? 'Tersedia'
                : '—';
            const actualStatus = isLoading
              ? 'Memuat'
              : record?.hydrologyActual
                ? 'Tersedia'
                : '—';

            return (
              <tr key={month} className={`border-t border-[#e2e8f0] transition-colors ${isSelected ? 'bg-[#f0fdff]' : 'hover:bg-[#f8fafc]'}`}>
                <th scope="row" className={`p-0 text-left ${isSelected ? 'border-l-[3px] border-[#0891b2]' : ''}`}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onSelectMonth(index)}
                    className={`w-full px-4 py-3 text-left text-xs font-semibold ${isSelected ? 'text-[#0e7490]' : 'text-[#475569]'}`}
                  >
                    {month}
                  </button>
                </th>
                <td className="px-4 py-3"><StatusLabel value={predictionStatus} /></td>
                <td className="px-4 py-3"><StatusLabel value={actualStatus} /></td>
              </tr>
            );
          })}
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
          <div className="flex flex-col items-center gap-2 text-xs font-medium text-[#64748b]">
            <LoaderCircle size={22} className="animate-spin text-[#0891b2]" />
            Memuat gambar BMKG…
          </div>
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
  title,
  subtitle,
  sections,
  onUpload,
}: ZoneCardProps) {
  return (
    <article className="overflow-hidden border border-[#e2e8f0] bg-white">
      <div className="border-b border-[#e2e8f0] px-5 py-4">
        <h3 className="text-[15px] font-semibold text-[#0f172a]">{title}</h3>
        <p className="mt-0.5 text-xs text-[#94a3b8]">{subtitle}</p>
      </div>

      {sections.map((section) => (
        <section key={section.title}>
          <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-5 py-2.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">
              {section.title}
            </h4>
          </div>
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
                      Input data
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </article>
  );
}

function GenericHydrologySchematic({ plantName }: { plantName: string }) {
  return (
    <article className="overflow-hidden border border-[#e2e8f0] bg-white">
      <div className="flex flex-col justify-between gap-3 border-b border-[#e2e8f0] px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-[15px] font-semibold text-[#0f172a]">Skema Aliran Hidrologi</h3>
          <p className="mt-0.5 text-xs text-[#94a3b8]">
            Hubungan aliran dari catchment area hingga sisi hilir
          </p>
        </div>
        <span className="text-[11px] font-medium text-[#94a3b8]">Ilustrasi operasional</span>
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

interface HydrologySchematicProps {
  plant: Pick<Plant, 'code' | 'name'>;
  plantName: string;
}

function HydrologySchematic({ plant, plantName }: HydrologySchematicProps) {
  const imagery = getDamImagery(plant);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageLoadFailed = Boolean(imagery && failedImageUrl === imagery.imageUrl);

  if (!imagery || imageLoadFailed) {
    return <GenericHydrologySchematic plantName={plantName} />;
  }

  return (
    <article className="overflow-hidden border border-[#e2e8f0] bg-white">
      <div className="flex flex-col justify-between gap-3 border-b border-[#e2e8f0] px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-[15px] font-semibold text-[#0f172a]">Skema Aliran Hidrologi</h3>
          <p className="mt-0.5 text-xs text-[#94a3b8]">
            Referensi posisi waduk dan bendungan
          </p>
        </div>
        <span className="text-[11px] font-medium text-[#0e7490]">Citra satelit referensi</span>
      </div>

      <figure className="relative h-[400px] overflow-hidden bg-[#e2e8f0] sm:h-[500px]">
        <img
          src={imagery.imageUrl}
          alt={imagery.alt}
          loading="lazy"
          onError={() => setFailedImageUrl(imagery.imageUrl)}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#020617]/90 via-[#020617]/55 to-transparent px-5 pb-4 pt-20 text-white">
          <figcaption>
            <p className="text-sm font-semibold">{imagery.damName}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-white/75">
              <MapPin size={12} aria-hidden="true" />
              {imagery.location}
            </p>
            <p className="mt-1 text-[10px] text-white/60">{imagery.acquisitionLabel}</p>
          </figcaption>
          <a
            href={imagery.attributionUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[10px] text-white/60 transition-colors hover:text-white"
          >
            World Imagery — {imagery.attribution}
            <ExternalLink size={10} aria-hidden="true" />
          </a>
        </div>

        <a
          href={imagery.mapUrl}
          target="_blank"
          rel="noreferrer"
          className="absolute right-4 top-4 inline-flex items-center gap-1.5 bg-white/95 px-3 py-2 text-[11px] font-semibold text-[#0f172a] shadow-sm backdrop-blur transition-colors hover:bg-white"
        >
          Buka peta satelit
          <ExternalLink size={12} aria-hidden="true" />
        </a>
      </figure>
    </article>
  );
}

export default function Telemetering() {
  const { plant, plta, pltaId } = useActivePLTA();
  const operationYear = new Date().getFullYear();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(new Date().getMonth());
  const [isMonthlySheetOpen, setIsMonthlySheetOpen] = useState(false);
  const [imageUploadKind, setImageUploadKind] = useState<MonthlyHydrologyImageKind | null>(null);
  const [dailyUploadTarget, setDailyUploadTarget] =
    useState<DailyTelemetryUploadTarget | null>(null);
  const closeMonthlySheet = useCallback(() => setIsMonthlySheetOpen(false), []);
  const closeImageUploadSheet = useCallback(() => setImageUploadKind(null), []);
  const closeDailyUploadSheet = useCallback(() => setDailyUploadTarget(null), []);
  const selectedMonth = MONTHS[selectedMonthIndex];
  const selectedMonthNumber = selectedMonthIndex + 1;
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
  const reservoirTma = reservoirReading?.value
    ?? daily?.upstream.reservoirTma
    ?? null;
  const tailraceTma = tailraceReading?.value
    ?? daily?.downstream.tailraceTma
    ?? null;
  const turbineDischarge = turbineDischargeReading?.value
    ?? sumMetrics([
      daily?.dam.turbineDischargeT1 ?? null,
      daily?.dam.turbineDischargeT2 ?? null,
    ]);
  const isDailyLoading = dashboardQuery.isLoading;
  const reservoirTmaTime = formatHydrologyTime(
    daily?.upstream.reservoirTmaTime ?? null,
  );

  const forecast = useMemo(() => {
    const record = selectedMonthlyRecord;
    const apiSource = 'Hydrology API';

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
            : 'Dihitung server',
          sourceType: record?.achievementPercentage === null || record?.achievementPercentage === undefined
            ? 'unavailable'
            : 'formula',
        },
      ] satisfies MetricRow[],
    };
  }, [selectedMonth, selectedMonthlyRecord]);

  const upstreamSections = useMemo<MetricSection[]>(() => [
    {
      title: 'Batas operasi waduk',
      rows: [
        metricRow(
          'Target tinggi muka air waduk (TMA)',
          daily?.upstream.targetTma ?? null,
          'mdpl',
          dailyUploadTargets.targetTma
            ? 'Input manual · Dashboard API'
            : 'Dashboard API',
          'input',
          3,
          isDailyLoading,
          dailyUploadTargets.targetTma,
        ),
        metricRow('Target volume waduk', daily?.upstream.targetVolume ?? null, 'm³', 'Dashboard API', 'input', 2, isDailyLoading),
        metricRow('Volume waduk', daily?.upstream.reservoirVolume ?? null, 'm³', 'Dashboard API', 'formula', 2, isDailyLoading),
        metricRow('Batas tinggi muka air limpasan', daily?.upstream.spillwayTmaLimit ?? null, 'mdpl', 'Konstanta API', 'constant', 3, isDailyLoading),
        metricRow('Batas tinggi muka air MOL', daily?.upstream.molTmaLimit ?? null, 'mdpl', 'Konstanta API', 'constant', 3, isDailyLoading),
      ],
    },
    {
      title: 'Kondisi hulu',
      rows: [
        metricRow(
          'Tinggi muka air waduk',
          reservoirTma,
          'mdpl',
          reservoirReading
            ? monitoringSource(reservoirReading, monitoringStream.status)
            : reservoirTmaTime
              ? `Dashboard API · ${reservoirTmaTime}`
              : 'Dashboard API',
          'api',
          3,
          isDailyLoading,
        ),
        metricRow('Inflow waduk', daily?.upstream.inflow ?? null, 'm³/detik', 'Dashboard API', 'api', 2, isDailyLoading),
        metricRow('Curah hujan hulu', daily?.upstream.upstreamRainfall ?? null, 'mm/hari', 'Dashboard API', 'api', 2, isDailyLoading),
        metricRow('Turbidity air hulu', daily?.upstream.upstreamTurbidity ?? null, 'NTU', 'Dashboard API', 'api', 2, isDailyLoading),
        metricRow('Volume efektif terhadap target TMA', daily?.upstream.effectiveVolumeToTarget ?? null, 'm³', 'Hasil formula API', 'formula', 2, isDailyLoading),
        metricRow('Volume efektif terhadap TMA MOL', daily?.upstream.effectiveVolumeToMol ?? null, 'm³', 'Hasil formula API', 'formula', 2, isDailyLoading),
        metricRow('Ketersediaan energi terhadap target TMA', daily?.upstream.availableEnergyToTargetMwh ?? null, 'MWh', 'Hasil formula API', 'formula', 2, isDailyLoading),
        metricRow('Ketersediaan energi terhadap TMA MOL', daily?.upstream.availableEnergyToMolMwh ?? null, 'MWh', 'Hasil formula API', 'formula', 2, isDailyLoading),
        metricRow('Service hour pembangkit full load', daily?.upstream.fullLoadServiceHours ?? null, 'jam', 'Hasil formula API', 'formula', 2, isDailyLoading),
      ],
    },
  ], [
    daily,
    dailyUploadTargets.targetTma,
    isDailyLoading,
    monitoringStream.status,
    reservoirReading,
    reservoirTma,
    reservoirTmaTime,
  ]);

  const damSections = useMemo<MetricSection[]>(() => [
    {
      title: 'Rencana debit',
      rows: [
        metricRow(
          'Rencana debit turbin',
          daily?.dam.plannedTurbineDischarge ?? null,
          'm³/detik',
          dailyUploadTargets.plannedTurbineDischarge
            ? 'Input manual · Dashboard API'
            : 'Dashboard API',
          'input',
          2,
          isDailyLoading,
          dailyUploadTargets.plannedTurbineDischarge,
        ),
        metricRow(
          'Rencana debit spillway',
          daily?.dam.plannedSpillwayDischarge ?? null,
          'm³/detik',
          dailyUploadTargets.plannedSpillwayDischarge
            ? 'Input manual · Dashboard API'
            : 'Dashboard API',
          'input',
          2,
          isDailyLoading,
          dailyUploadTargets.plannedSpillwayDischarge,
        ),
        metricRow(
          'Rencana debit HJV',
          daily?.dam.plannedHjvDischarge ?? null,
          'm³/detik',
          dailyUploadTargets.plannedHjvDischarge
            ? 'Input manual · Dashboard API'
            : 'Dashboard API',
          'input',
          2,
          isDailyLoading,
          dailyUploadTargets.plannedHjvDischarge,
        ),
      ],
    },
    {
      title: 'Realisasi debit',
      rows: [
        metricRow(
          'Debit turbin',
          turbineDischarge,
          'm³/detik',
          turbineDischargeReading
            ? monitoringSource(turbineDischargeReading, monitoringStream.status)
            : 'Dashboard API · akumulasi T1 + T2',
          'api',
          2,
          isDailyLoading,
        ),
        metricRow('Debit turbin 1', daily?.dam.turbineDischargeT1 ?? null, 'm³/detik', 'Dashboard API', 'api', 2, isDailyLoading),
        metricRow('Debit turbin 2', daily?.dam.turbineDischargeT2 ?? null, 'm³/detik', 'Dashboard API', 'api', 2, isDailyLoading),
        metricRow(
          'Debit spillway',
          daily?.dam.spillwayDischarge ?? null,
          'm³/detik',
          dailyUploadTargets.spillwayDischarge
            ? 'Input manual · Dashboard API'
            : 'Dashboard API',
          dailyUploadTargets.spillwayDischarge ? 'input' : 'api',
          2,
          isDailyLoading,
          dailyUploadTargets.spillwayDischarge,
        ),
        metricRow(
          'Debit HJV',
          daily?.dam.hjvDischarge ?? null,
          'm³/detik',
          dailyUploadTargets.hjvDischarge
            ? 'Input manual · Dashboard API'
            : 'Dashboard API',
          dailyUploadTargets.hjvDischarge ? 'input' : 'api',
          2,
          isDailyLoading,
          dailyUploadTargets.hjvDischarge,
        ),
        metricRow('Delta head', daily?.dam.deltaHeadCm ?? null, 'cm', 'Hasil formula API', 'formula', 2, isDailyLoading),
      ],
    },
  ], [
    daily,
    dailyUploadTargets.hjvDischarge,
    dailyUploadTargets.plannedHjvDischarge,
    dailyUploadTargets.plannedSpillwayDischarge,
    dailyUploadTargets.plannedTurbineDischarge,
    dailyUploadTargets.spillwayDischarge,
    isDailyLoading,
    monitoringStream.status,
    turbineDischarge,
    turbineDischargeReading,
  ]);

  const downstreamSections = useMemo<MetricSection[]>(() => [
    {
      title: 'Kondisi hilir',
      rows: [
        metricRow(
          'Tinggi muka air tailrace',
          tailraceTma,
          'mdpl',
          tailraceReading
            ? monitoringSource(tailraceReading, monitoringStream.status)
            : 'Dashboard API',
          'api',
          3,
          isDailyLoading,
        ),
        metricRow('Tinggi jatuh air (head)', daily?.downstream.headM ?? null, 'm', 'Hasil formula API', 'formula', 2, isDailyLoading),
        metricRow('Efisiensi pemakaian air turbin 1', daily?.downstream.turbineEfficiency1 ?? null, '%', 'Hasil formula API', 'formula', 2, isDailyLoading),
        metricRow('Efisiensi pemakaian air turbin 2', daily?.downstream.turbineEfficiency2 ?? null, '%', 'Hasil formula API', 'formula', 2, isDailyLoading),
        metricRow('Turbidity air sisi hilir', daily?.downstream.downstreamTurbidity ?? null, 'NTU', 'Dashboard API', 'api', 2, isDailyLoading),
      ],
    },
  ], [
    daily,
    isDailyLoading,
    monitoringStream.status,
    tailraceReading,
    tailraceTma,
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="page-title">Telemetering</h1>
          <p className="page-description">
            Kondisi hidrologi bulanan dan harian PLTA {plta.shortName}
          </p>
        </div>
        <PlantSwitcher page="telemetering" />
      </header>

      <section className="border-t border-[#e2e8f0] pt-5">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0891b2]">Perencanaan operasi</p>
            <h2 className="mt-1 text-base font-semibold text-[#0f172a]">Kondisi Hidrologi Bulanan</h2>
            <p className="mt-0.5 text-xs text-[#64748b]">
              Pilih bulan untuk melihat status data, prediksi hidrologi, dan target produksi energi.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <span className="text-xs font-medium text-[#64748b]">Tahun operasi {operationYear}</span>
            <Button
              type="button"
              size="sm"
              leftIcon={<PencilLine size={15} />}
              disabled={monthlyQuery.isLoading}
              onClick={() => setIsMonthlySheetOpen(true)}
              className="h-9 whitespace-nowrap"
            >
              Input Data Bulanan
            </Button>
          </div>
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

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.8fr)]">
          <MonthlyTable
            selectedMonthIndex={selectedMonthIndex}
            records={monthlyRecords}
            isLoading={monthlyQuery.isLoading}
            onSelectMonth={setSelectedMonthIndex}
          />
          <div className="border-t border-[#e2e8f0] pt-5 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0891b2]">Outlook periode</p>
            <h2 className="mt-1 text-base font-semibold text-[#0f172a]">Ringkasan Prediksi {selectedMonth}</h2>
            <p className="mt-0.5 text-xs text-[#64748b]">Target produksi dan proyeksi energi pada periode terpilih.</p>
            <div className="mt-4">
              <ForecastDetail rows={forecast.rows} />
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-[#e2e8f0] pt-5">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0891b2]">Prakiraan cuaca</p>
            <h2 className="mt-1 text-base font-semibold text-[#0f172a]">Prakiraan Hujan</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0891b2]">Kondisi lapangan</p>
            <h2 className="mt-1 text-base font-semibold text-[#0f172a]">Kondisi Hidrologi Harian</h2>
            <p className="mt-0.5 text-xs text-[#64748b]">
              {daily
                ? `Parameter operasi ${formatHydrologyDate(daily.date)} dari sisi hulu, bendungan, hingga sisi hilir.`
                : 'Parameter operasi dari sisi hulu, bendungan, hingga sisi hilir.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium">
            <span className={monitoringStream.status === 'open' ? 'text-emerald-600' : 'text-amber-600'}>
              {monitoringStream.status === 'open' ? 'WebSocket aktif' : 'Fallback Dashboard API'}
            </span>
            <span className="text-[#0e7490]">Dashboard API</span>
            {(uploadTags?.length ?? 0) > 0 && (
              <span className="text-cyan-700">Input manual</span>
            )}
            <span className="text-[#64748b]">Data operasi</span>
            <span className="text-[#b45309]">Formula API</span>
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

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.9fr_0.9fr]">
          <ZoneCard
            title="Hulu"
            subtitle="Upstream dan kondisi tampungan"
            sections={upstreamSections}
            onUpload={setDailyUploadTarget}
          />
          <ZoneCard
            title="Dam / Bendungan"
            subtitle="Rencana dan realisasi pelepasan air"
            sections={damSections}
            onUpload={setDailyUploadTarget}
          />
          <ZoneCard
            title="Hilir"
            subtitle="Tailrace, downstream, dan efisiensi"
            sections={downstreamSections}
            onUpload={setDailyUploadTarget}
          />
        </div>

        <div className="mt-5">
          <HydrologySchematic plant={plant} plantName={plta.shortName} />
        </div>
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
          defaultDate={daily?.date ?? new Date().toISOString().slice(0, 10)}
          target={dailyUploadTarget}
          onClose={closeDailyUploadSheet}
        />
      )}
    </div>
  );
}
