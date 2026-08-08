export type TrendAggregation = 'avg' | 'sum';
export type TrendResolution = 'raw' | '5m' | '1h' | '1d';

export interface TrendQueryInput {
  pltaId: string;
  parameter: string;
  from: string;
  to: string;
  resolution: TrendResolution;
  station?: string;
  aggregation?: TrendAggregation;
}

export interface TrendPoint {
  time: string;
  value: number;
  quality: string;
  pureQuality: boolean;
}

export interface TrendSeries {
  pltaId: string;
  parameter: string;
  station: string | null;
  resolution: string;
  points: TrendPoint[];
}
