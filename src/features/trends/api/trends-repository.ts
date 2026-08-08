import type { TrendQueryInput, TrendSeries } from '../model';

export interface TrendRequestOptions {
  signal?: AbortSignal;
}

export interface TrendsRepository {
  getSeries(
    input: TrendQueryInput,
    options?: TrendRequestOptions,
  ): Promise<TrendSeries>;
}
