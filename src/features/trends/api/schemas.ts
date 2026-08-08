import { z } from 'zod';

const apiTrendPointSchema = z.object({
  time: z.string(),
  value: z.number(),
  quality: z.string().optional().default('good'),
  quality_murni: z.boolean().optional().default(true),
});

export const apiTrendSeriesSchema = z.object({
  plta_id: z.string().uuid(),
  parameter: z.string().min(1),
  station: z.string().nullable().optional().default(null),
  resolution: z.string(),
  points: z.array(apiTrendPointSchema),
});

export type ApiTrendSeries = z.infer<typeof apiTrendSeriesSchema>;
