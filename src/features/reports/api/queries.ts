import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateReportInput, ReportListParams } from '../model';
import { reportsRepository } from './repository';

const reportQueryKeys = {
  all: ['reports'] as const,
  lists: () => [...reportQueryKeys.all, 'list'] as const,
  list: (params: ReportListParams) => [...reportQueryKeys.lists(), params] as const,
  detail: (reportId: string) => [...reportQueryKeys.all, 'detail', reportId] as const,
};

export function useReportsQuery(params: ReportListParams) {
  return useQuery({
    queryKey: reportQueryKeys.list(params),
    queryFn: ({ signal }) => reportsRepository.list(params, { signal }),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => query.state.data?.items.some(
      (report) => report.status === 'pending' || report.status === 'processing',
    ) ? 3_000 : false,
    refetchOnWindowFocus: false,
  });
}

export function useCreateReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReportInput) => reportsRepository.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reportQueryKeys.lists() });
    },
  });
}

export function useDownloadReportMutation() {
  return useMutation({
    mutationFn: (reportId: string) => reportsRepository.download(reportId),
  });
}
