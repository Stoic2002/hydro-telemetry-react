import type {
  DashboardMetric,
  DashboardMetricGroup,
  MonthlyHydrology,
  NullableMetric,
} from '../../../features/hydrology/model';
import type {
  MonitoringParameter,
  MonitoringParameterLatest,
} from '../../../features/monitoring';
import type { PlantTag } from '../../../features/plta/model';
import type { DailyTelemetryUploadTarget } from '../../../features/telemetry-upload/model';

export const MONTHS = [
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

export type MetricSource = 'api' | 'formula' | 'input' | 'unavailable' | 'constant';

export interface MetricRow {
  label: string;
  value: string;
  unit?: string;
  source: string;
  sourceType: MetricSource;
  hasData?: boolean;
  uploadTarget?: DailyTelemetryUploadTarget;
}

export interface MetricSection {
  title: string;
  rows: MetricRow[];
}

export function formatHydrologyMetric(
  value: NullableMetric,
  maximumFractionDigits = 2,
): string {
  if (value === null || !Number.isFinite(value)) return 'N/A';

  return value.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

export function formatHydrologyDate(value: string): string {
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

export function latestMonitoringParameter(
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

export function monitoringSource(
  reading: MonitoringParameterLatest | undefined,
): string {
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

export function dashboardMetricRow(
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

  return {
    label: metric.label,
    value: formatHydrologyMetric(override?.value ?? metric.value),
    unit: metric.unit ?? undefined,
    source: override?.source ?? dashboardSourceLabel[metric.source],
    sourceType: override ? 'api' : dashboardSourceType[metric.source],
    hasData: true,
    uploadTarget,
  };
}

export function dashboardMetricRows(
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

export function currentWibDate(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

export function buildUploadTarget(
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

function monthlyMetricRow(
  label: string,
  value: NullableMetric,
  sourceType: Exclude<MetricSource, 'unavailable'>,
  unit: string,
  maximumFractionDigits = 2,
  availableSource = 'Data bulanan',
): MetricRow {
  const isAvailable = value !== null && Number.isFinite(value);

  return {
    label,
    value: formatHydrologyMetric(value, maximumFractionDigits),
    unit: isAvailable ? unit : undefined,
    source: isAvailable ? availableSource : 'Belum tersedia',
    sourceType: isAvailable ? sourceType : 'unavailable',
  };
}

export function buildMonthlyForecastRows(
  record: MonthlyHydrology | undefined,
  monthLabel: string,
): MetricRow[] {
  const apiSource = 'Data bulanan';

  return [
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
    monthlyMetricRow(
      `Prediksi kemampuan produksi energi ${monthLabel}`,
      record?.predictedProductionMwh ?? null,
      'api',
      'MWh',
    ),
    monthlyMetricRow(
      `Target produksi energi listrik ${monthLabel}`,
      record?.targetProductionMwh ?? null,
      'input',
      'MWh',
    ),
    monthlyMetricRow(
      'Pencapaian energi s.d. bulan sebelumnya',
      record?.previousAchievementMwh ?? null,
      'api',
      'MWh',
    ),
    monthlyMetricRow(
      `Prediksi pencapaian energi s.d. ${monthLabel}`,
      record?.predictedPreviousAchievementMwh ?? null,
      'api',
      'MWh',
    ),
    monthlyMetricRow(
      `Target pencapaian energi s.d. ${monthLabel}`,
      record?.targetPreviousAchievementMwh ?? null,
      'input',
      'MWh',
    ),
    monthlyMetricRow(
      'Persentase pencapaian',
      record?.achievementPercentage ?? null,
      'formula',
      '%',
      1,
      'Formulasi',
    ),
  ];
}

