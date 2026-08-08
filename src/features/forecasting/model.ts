export type ForecastParameter = 'inflow' | 'water_level';
export type ForecastHorizon = 24 | 168;

export interface ForecastAccuracySummary {
  skill: number | null;
  sampleCount: number;
  windowDays: number;
  isPresentable: boolean;
}

export interface ForecastPoint {
  time: string;
  horizon: number;
  value: number;
  valueP10: number | null;
  valueP90: number | null;
}

export interface ForecastSeries {
  pltaId: string;
  parameter: ForecastParameter;
  modelName: string;
  generatedAt: string | null;
  unit: string | null;
  label: string | null;
  accuracy: ForecastAccuracySummary | null;
  points: ForecastPoint[];
}

export interface ForecastQueryInput {
  pltaId: string;
  parameter: ForecastParameter;
  horizon: ForecastHorizon;
}

export interface ForecastRunResult {
  taskId: string;
  status: string;
}
