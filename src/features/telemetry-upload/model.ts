import type { MonitoringParameter } from '../monitoring';
import type { PlantTag } from '../plta/model';

export interface TelemetryUploadPoint {
  time: string;
  value: number;
}

export interface UploadTelemetryPointsInput {
  pltaId: string;
  parameter: MonitoringParameter;
  station: string;
  points: TelemetryUploadPoint[];
}

export interface UploadTelemetryExcelInput {
  pltaId: string;
  parameter: MonitoringParameter;
  station: string;
  file: File;
}

export interface TelemetryUploadResult {
  pltaId: string;
  parameter: MonitoringParameter;
  pointsUpserted: number;
  filename: string | null;
}

export interface DailyTelemetryUploadTarget {
  label: string;
  parameter: MonitoringParameter;
  unit: string;
  tags: PlantTag[];
}
