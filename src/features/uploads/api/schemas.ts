import { z } from 'zod';

export const apiElevationPointSchema = z.object({
  id: z.string().uuid(),
  elevation: z.number(),
  volume: z.number(),
  area: z.number(),
});

export const apiElevationUploadResultSchema = z.object({
  id: z.string().uuid(),
  plta_id: z.string().uuid(),
  year: z.number().int(),
  status: z.string(),
  min_elevation: z.number(),
  max_elevation: z.number(),
  points: z.array(apiElevationPointSchema),
});

export const apiRTOWEntrySchema = z.object({
  id: z.string().uuid(),
  tanggal: z.string(),
  target_elevasi: z.number(),
});

export const apiRTOWUploadResultSchema = z.object({
  id: z.string().uuid(),
  plta_id: z.string().uuid(),
  tahun: z.number().int(),
  entries: z.array(apiRTOWEntrySchema),
});

export type ApiElevationUploadResult = z.infer<typeof apiElevationUploadResultSchema>;
export type ApiRTOWUploadResult = z.infer<typeof apiRTOWUploadResultSchema>;
