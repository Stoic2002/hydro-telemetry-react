import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hydrologyQueryKeys } from '../../hydrology/api/queries';
import type {
  UploadTelemetryExcelInput,
  UploadTelemetryPointsInput,
} from '../model';
import { telemetryUploadRepository } from './repository';

function useRefreshHydrologyDashboard() {
  const queryClient = useQueryClient();

  return async (pltaId: string) => {
    await queryClient.invalidateQueries({
      queryKey: hydrologyQueryKeys.dashboardRoot(pltaId),
    });
  };
}

export function useUploadTelemetryPointsMutation() {
  const refreshDashboard = useRefreshHydrologyDashboard();

  return useMutation({
    mutationFn: (input: UploadTelemetryPointsInput) => (
      telemetryUploadRepository.uploadPoints(input)
    ),
    onSuccess: async (result) => refreshDashboard(result.pltaId),
  });
}

export function useUploadTelemetryExcelMutation() {
  const refreshDashboard = useRefreshHydrologyDashboard();

  return useMutation({
    mutationFn: (input: UploadTelemetryExcelInput) => (
      telemetryUploadRepository.uploadExcel(input)
    ),
    onSuccess: async (result) => refreshDashboard(result.pltaId),
  });
}
