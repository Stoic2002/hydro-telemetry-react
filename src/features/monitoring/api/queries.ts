import { useQuery } from '@tanstack/react-query';
import { monitoringRepository } from './repository';

const MONITORING_STALE_TIME = 15_000;

export const monitoringQueryKeys = {
  all: ['monitoring'] as const,
  latest: () => [...monitoringQueryKeys.all, 'latest'] as const,
  pltaLatest: (pltaId: string) => (
    [...monitoringQueryKeys.latest(), 'plta', pltaId] as const
  ),
  riverBasinLatest: (wsId: string) => (
    [...monitoringQueryKeys.latest(), 'river-basin', wsId] as const
  ),
};

export function usePLTALatestQuery(pltaId: string, enabled = true) {
  return useQuery({
    queryKey: monitoringQueryKeys.pltaLatest(pltaId),
    queryFn: ({ signal }) => (
      monitoringRepository.getLatestByPLTA(pltaId, { signal })
    ),
    enabled: enabled && Boolean(pltaId),
    staleTime: MONITORING_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useRiverBasinLatestQuery(wsId: string, enabled = true) {
  return useQuery({
    queryKey: monitoringQueryKeys.riverBasinLatest(wsId),
    queryFn: ({ signal }) => (
      monitoringRepository.getLatestByRiverBasin(wsId, { signal })
    ),
    enabled: enabled && Boolean(wsId),
    staleTime: MONITORING_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}
