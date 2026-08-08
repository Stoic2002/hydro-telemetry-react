import { z } from 'zod';

const apiElevationPointSchema = z.object({
  id: z.string().uuid(),
  elevation: z.number(),
  volume: z.number(),
  area: z.number(),
});

export const apiElevationUploadResultSchema = z.object({
  id: z.string().uuid(),
  plta_id: z.string().uuid(),
  year: z.number().int(),
  status: z.enum(['draft', 'published']),
  min_elevation: z.number().nullable(),
  max_elevation: z.number().nullable(),
  points: z.array(apiElevationPointSchema),
});

export type ApiElevationUploadResult = z.infer<typeof apiElevationUploadResultSchema>;
