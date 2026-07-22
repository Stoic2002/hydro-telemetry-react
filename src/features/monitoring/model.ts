export const MONITORING_PARAMETERS = [
  'water_level',
  'reservoir',
  'volume_efektif',
  'total_outflow',
  'inflow',
  'wqms',
  'rainfall',
  'beban',
  'inflow_sensor',
  'outflow_irigasi',
  'outflow_ddc',
  'outflow_spillway',
  'sediment_level',
  'water_depth',
  'outflow_hjv',
  'head',
  'delta_head',
  'turbine_efficiency',
  'plan_outflow_turbine',
  'plan_outflow_spillway',
  'plan_outflow_hjv',
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
