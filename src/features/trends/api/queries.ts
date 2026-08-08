import { useQuery } from '@tanstack/react-query';
import type { TrendQueryInput } from '../model';
import { trendsRepository } from './repository';

const TREND_STALE_TIME = 60_000;

const trendQueryKeys = {
  all: ['trends'] as const,
  series: (input: TrendQueryInput) => [...trendQueryKeys.all, input] as const,
};

export function useTrendQuery(input: TrendQueryInput) {
  return useQuery({
    queryKey: trendQueryKeys.series(input),
    queryFn: ({ signal }) => trendsRepository.getSeries(input, { signal }),
    enabled: Boolean(input.pltaId && input.parameter && input.from && input.to),
    staleTime: TREND_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}
