import { useMutation } from '@tanstack/react-query';
import type { UploadElevationExcelInput } from '../model';
import { uploadsRepository } from './repository';

export function useUploadElevationExcelMutation() {
  return useMutation({
    mutationFn: (input: UploadElevationExcelInput) => uploadsRepository.uploadElevationExcel(input),
  });
}
