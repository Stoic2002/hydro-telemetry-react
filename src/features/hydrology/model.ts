export type NullableMetric = number | null;

export interface DailyUpstreamHydrology {
  targetTma: NullableMetric;
  targetVolume: NullableMetric;
  reservoirVolume: NullableMetric;
  spillwayTmaLimit: NullableMetric;
  molTmaLimit: NullableMetric;
  reservoirTma: NullableMetric;
  reservoirTmaTime: string | null;
  inflow: NullableMetric;
  upstreamRainfall: NullableMetric;
  upstreamTurbidity: NullableMetric;
  effectiveVolumeToTarget: NullableMetric;
  effectiveVolumeToMol: NullableMetric;
  availableEnergyToTargetMwh: NullableMetric;
  availableEnergyToMolMwh: NullableMetric;
  fullLoadServiceHours: NullableMetric;
}

export interface DailyDamHydrology {
  plannedTurbineDischarge: NullableMetric;
  plannedSpillwayDischarge: NullableMetric;
  plannedHjvDischarge: NullableMetric;
  turbineDischargeT1: NullableMetric;
  turbineDischargeT2: NullableMetric;
  spillwayDischarge: NullableMetric;
  hjvDischarge: NullableMetric;
  deltaHeadCm: NullableMetric;
}

export interface DailyDownstreamHydrology {
  tailraceTma: NullableMetric;
  headM: NullableMetric;
  turbineEfficiency1: NullableMetric;
  turbineEfficiency2: NullableMetric;
  downstreamTurbidity: NullableMetric;
}

export interface DailyHydrology {
  date: string;
  upstream: DailyUpstreamHydrology;
  dam: DailyDamHydrology;
  downstream: DailyDownstreamHydrology;
  pendingFormulas: string[];
}

export interface PLTAHydrologyDashboard {
  pltaId: string;
  monthly: MonthlyHydrology | null;
  daily: DailyHydrology | null;
}

export interface MonthlyHydrology {
  id: string;
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
