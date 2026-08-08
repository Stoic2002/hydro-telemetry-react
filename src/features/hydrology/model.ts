export type NullableMetric = number | null;

export type DashboardMetricSource = 'measured' | 'derived' | 'plan' | 'constant';

export interface DashboardStationMetric {
  station: string;
  label: string;
  value: NullableMetric;
  time: string | null;
}

export interface DashboardMetric {
  value: NullableMetric;
  unit: string | null;
  label: string;
  time: string | null;
  source: DashboardMetricSource;
  stations: DashboardStationMetric[] | null;
}

export type DashboardMetricGroup = Record<string, DashboardMetric>;

export interface DailyHydrology {
  date: string;
  constants: Record<string, unknown> | null;
  upstream: DashboardMetricGroup;
  dam: DashboardMetricGroup;
  downstream: DashboardMetricGroup;
  pendingFormulas: string[];
}

export interface PLTAHydrologyDashboard {
  pltaId: string;
  pltaCode: string;
  pltaName: string;
  constants: Record<string, unknown> | null;
  monthly: MonthlyHydrology | null;
  daily: DailyHydrology | null;
}

export interface MonthlyHydrology {
  id: string | null;
  pltaId: string;
  year: number;
  month: number;
  hydrologyPrediction: string | null;
  hydrologyActual: string | null;
  rainfallCharacteristicImage: string | null;
  rainfallImage: string | null;
  predictedProductionMwh: NullableMetric;
  targetProductionMwh: NullableMetric;
  previousAchievementMwh: NullableMetric;
  predictedPreviousAchievementMwh: NullableMetric;
  targetPreviousAchievementMwh: NullableMetric;
  achievementPercentage: NullableMetric;
}

export type MonthlyHydrologyImageKind = 'sifat_hujan' | 'curah_hujan';

export interface UpsertMonthlyHydrologyInput {
  pltaId: string;
  year: number;
  month: number;
  hydrologyPrediction?: string;
  hydrologyActual?: string;
  predictedProductionMwh?: number;
  targetProductionMwh?: number;
  previousAchievementMwh?: number;
  predictedPreviousAchievementMwh?: number;
  targetPreviousAchievementMwh?: number;
}

export interface UploadMonthlyHydrologyImageInput {
  pltaId: string;
  year: number;
  month: number;
  kind: MonthlyHydrologyImageKind;
  file: File;
}
