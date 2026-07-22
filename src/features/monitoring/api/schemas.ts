import { z } from 'zod';
import { MONITORING_PARAMETERS } from '../model';

export const monitoringParameterSchema = z.enum(MONITORING_PARAMETERS);

export const apiMonitoringParameterLatestSchema = z.object({
  parameter: monitoringParameterSchema,
  station: z.string().optional().default(''),
  time: z.string().nullable().optional().default(null),
  value: z.number().nullable().optional().default(null),
  quality: z.string().nullable().optional().default(null),
});

export const apiPLTALatestMonitoringSchema = z.object({
  plta_id: z.string().uuid(),
  parameters: z.array(apiMonitoringParameterLatestSchema),
});

export const apiMonitoringEventSchema = apiMonitoringParameterLatestSchema.extend({
  plta_id: z.string().uuid(),
});

export const apiRiverBasinLatestMonitoringSchema = z.array(
  apiPLTALatestMonitoringSchema,
);

export type ApiMonitoringParameterLatest = z.infer<
  typeof apiMonitoringParameterLatestSchema
>;
export type ApiPLTALatestMonitoring = z.infer<
  typeof apiPLTALatestMonitoringSchema
>;
export type ApiMonitoringEvent = z.infer<typeof apiMonitoringEventSchema>;
