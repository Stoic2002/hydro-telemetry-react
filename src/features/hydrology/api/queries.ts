import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  MonthlyHydrologyImageKind,
  UpsertMonthlyHydrologyInput,
  UploadMonthlyHydrologyImageInput,
} from '../model';
import { hydrologyRepository } from './repository';

const HYDROLOGY_STALE_TIME = 60_000;

export const hydrologyQueryKeys = {
  all: ['hydrology'] as const,
  dashboardRoot: (pltaId: string) => (
    [...hydrologyQueryKeys.all, 'dashboard', pltaId] as const
  ),
  dashboard: (pltaId: string, date?: string) => (
    [...hydrologyQueryKeys.dashboardRoot(pltaId), date ?? 'today'] as const
  ),
  monthly: (pltaId: string, year: number) => (
    [...hydrologyQueryKeys.all, 'monthly', pltaId, year] as const
  ),
  monthlyImage: (
    pltaId: string,
    year: number,
    month: number,
    kind: MonthlyHydrologyImageKind,
  ) => (
    [...hydrologyQueryKeys.monthly(pltaId, year), 'image', month, kind] as const
  ),
};

export function usePLTAHydrologyDashboardQuery(pltaId: string, date?: string) {
  return useQuery({
    queryKey: hydrologyQueryKeys.dashboard(pltaId, date),
    queryFn: ({ signal }) => hydrologyRepository.getPLTADashboard(pltaId, date, { signal }),
    enabled: Boolean(pltaId),
    staleTime: HYDROLOGY_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useMonthlyHydrologyQuery(pltaId: string, year: number) {
  return useQuery({
    queryKey: hydrologyQueryKeys.monthly(pltaId, year),
    queryFn: ({ signal }) => hydrologyRepository.listMonthly(pltaId, year, { signal }),
    enabled: Boolean(pltaId),
    staleTime: HYDROLOGY_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useMonthlyHydrologyImageQuery(
  pltaId: string,
  year: number,
  month: number,
  kind: MonthlyHydrologyImageKind,
  enabled: boolean,
) {
  return useQuery({
    queryKey: hydrologyQueryKeys.monthlyImage(pltaId, year, month, kind),
    queryFn: ({ signal }) => (
      hydrologyRepository.getMonthlyImage(pltaId, year, month, kind, { signal })
    ),
    enabled: enabled && Boolean(pltaId),
    staleTime: HYDROLOGY_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useUpsertMonthlyHydrologyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertMonthlyHydrologyInput) => (
      hydrologyRepository.upsertMonthly(input)
    ),
    onSuccess: async (record) => {
      await queryClient.invalidateQueries({
        queryKey: hydrologyQueryKeys.monthly(record.pltaId, record.year),
      });
      await queryClient.invalidateQueries({
        queryKey: hydrologyQueryKeys.dashboardRoot(record.pltaId),
      });
    },
  });
}

export function useUploadMonthlyHydrologyImageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UploadMonthlyHydrologyImageInput) => (
      hydrologyRepository.uploadMonthlyImage(input)
    ),
    onSuccess: async (record, input) => {
      await queryClient.invalidateQueries({
        queryKey: hydrologyQueryKeys.monthly(record.pltaId, record.year),
      });
      await queryClient.invalidateQueries({
        queryKey: hydrologyQueryKeys.dashboardRoot(record.pltaId),
      });
      await queryClient.invalidateQueries({
        queryKey: hydrologyQueryKeys.monthlyImage(
          input.pltaId,
          input.year,
          input.month,
          input.kind,
        ),
      });
    },
  });
}
