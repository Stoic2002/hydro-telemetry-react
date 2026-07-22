import type {
  CreateElevationInput,
  CreateRTOWInput,
  ElevationUploadResult,
  RTOWUploadResult,
} from '../model';

export interface UploadsRepository {
  createElevation(input: CreateElevationInput): Promise<ElevationUploadResult>;
  createRTOW(input: CreateRTOWInput): Promise<RTOWUploadResult>;
}
