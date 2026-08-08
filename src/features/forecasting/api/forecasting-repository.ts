import type {
  ForecastQueryInput,
  ForecastRunResult,
  ForecastSeries,
} from '../model';

export interface ForecastingRepository {
  getLatest(input: ForecastQueryInput, options?: { signal?: AbortSignal }): Promise<ForecastSeries>;
  run(input: ForecastQueryInput): Promise<ForecastRunResult>;
}
