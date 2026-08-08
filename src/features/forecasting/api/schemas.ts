import { z } from 'zod';

export const apiForecastSeriesSchema = z.object({
  plta_id: z.string().uuid(),
  parameter: z.enum(['inflow', 'water_level']),
  model_name: z.string(),
  generated_at: z.string().nullable().optional().default(null),
  unit: z.string().nullable().optional().default(null),
  label: z.string().nullable().optional().default(null),
  akurasi: z.object({
    skill: z.number().nullable().optional().default(null),
    n: z.number().int().nonnegative().optional().default(0),
    jendela_hari: z.number().int().nonnegative().optional().default(3),
    layak_disajikan: z.boolean().optional().default(true),
  }).nullable().optional().default(null),
  points: z.array(z.object({
    time: z.string(),
    horizon: z.number().int(),
    value: z.number(),
    value_p10: z.number().nullable().optional().default(null),
    value_p90: z.number().nullable().optional().default(null),
  })),
});

export const apiForecastRunResultSchema = z.object({
  task_id: z.string(),
  status: z.string(),
});

export type ApiForecastSeries = z.infer<typeof apiForecastSeriesSchema>;
export type ApiForecastRunResult = z.infer<typeof apiForecastRunResultSchema>;
