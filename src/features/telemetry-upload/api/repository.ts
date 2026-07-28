import { httpTelemetryUploadRepository } from './http-telemetry-upload-repository';
import type { TelemetryUploadRepository } from './telemetry-upload-repository';

export const telemetryUploadRepository: TelemetryUploadRepository =
  httpTelemetryUploadRepository;
