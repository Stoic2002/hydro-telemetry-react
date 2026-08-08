import type {
  ElevationUploadResult,
  UploadElevationExcelInput,
} from '../model';

export interface UploadsRepository {
  uploadElevationExcel(input: UploadElevationExcelInput): Promise<ElevationUploadResult>;
}
