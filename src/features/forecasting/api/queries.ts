import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ForecastQueryInput } from '../model';
import { forecastingRepository } from './repository';

const forecastQueryKeys = {
  all: ['forecasts'] as const,
  series: (input: ForecastQueryInput) => [...forecastQueryKeys.all, input] as const,
};

export function useForecastQuery(input: ForecastQueryInput) {
  return useQuery({
    queryKey: forecastQueryKeys.series(input),
    queryFn: ({ signal }) => forecastingRepository.getLatest(input, { signal }),
    enabled: Boolean(input.pltaId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useRunForecastMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ForecastQueryInput) => forecastingRepository.run(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: forecastQueryKeys.all }),
  });
}
