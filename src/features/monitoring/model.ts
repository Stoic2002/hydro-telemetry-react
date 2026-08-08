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
  'turbidity',
  'ph',
  'outflow_irigasi',
  'outflow_ddc',
  'outflow_spillway',
  'outflow_trash',
  'outflow_pdam',
  'outflow_sluice',
  'outflow_flushing',
  'outflow_ddc_hours',
  'outflow_spillway_hours',
  'sediment_level',
  'water_depth',
  'outflow_hjv',
  'head',
  'delta_head',
  'air_temperature',
  'air_humidity',
  'guide_vane_position',
  'swc_actual',
  'plan_water_level',
  'plan_outflow_turbine',
  'plan_outflow_spillway',
  'plan_outflow_hjv',
  'plan_outflow_trash',
  'plan_outflow_pdam',
  'plan_outflow_sluice',
  'plan_outflow_flushing',
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

export type MonitoringConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'reconnecting'
  | 'closed'
  | 'error';
