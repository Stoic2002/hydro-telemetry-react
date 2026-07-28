export const MONITORING_PARAMETERS = [
  'water_level',
  'reservoir',
  'volume_efektif',
  'total_outflow',
  'inflow',
  'wqms',
  'rainfall',
  'rainfall_forecast_bmkg',
  'rainfall_forecast_om',
  'beban',
  'inflow_sensor',
  'outflow_irigasi',
  'outflow_ddc',
  'outflow_spillway',
  'outflow_ddc_hours',
  'outflow_spillway_hours',
  'sediment_level',
  'water_depth',
  'outflow_hjv',
  'head',
  'delta_head',
  'turbine_efficiency',
  'plan_water_level',
  'plan_outflow_turbine',
  'plan_outflow_spillway',
  'plan_outflow_hjv',
  'plan_outflow_irigasi',
  'plan_outflow_ddc',
  'plan_outflow_ddc_hours',
  'plan_outflow_spillway_hours',
] as const;

export type MonitoringParameter = (typeof MONITORING_PARAMETERS)[number];

export interface MonitoringParameterLatest {
  parameter: MonitoringParameter;
  station: string;
  time: string | null;
  value: number | null;
  quality: string | null;
}

export interface PLTALatestMonitoring {
  pltaId: string;
  parameters: MonitoringParameterLatest[];
}

export type MonitoringScope =
  | { scope: 'plta'; id: string }
  | { scope: 'river-basin'; id: string };

export type MonitoringConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'reconnecting'
  | 'closed'
  | 'error';
