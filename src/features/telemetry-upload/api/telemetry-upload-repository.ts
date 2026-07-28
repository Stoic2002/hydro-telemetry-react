import type {
  TelemetryUploadResult,
  UploadTelemetryExcelInput,
  UploadTelemetryPointsInput,
} from '../model';

export interface TelemetryUploadRepository {
  uploadPoints(
    input: UploadTelemetryPointsInput,
  ): Promise<TelemetryUploadResult>;
  uploadExcel(
    input: UploadTelemetryExcelInput,
  ): Promise<TelemetryUploadResult>;
}
