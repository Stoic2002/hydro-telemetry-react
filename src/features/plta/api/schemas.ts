import { z } from 'zod';

export const plantTagProtocolSchema = z.enum([
  'opcua',
  'modbus',
  'sql',
  'rest',
  'upload',
]);

export const apiRiverBasinSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional().default(null),
  id: z.string().uuid(),
});

export const apiPlantSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  ws_id: z.string().uuid(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  capacity_mw: z.number().nullable().optional().default(null),
  description: z.string().nullable().optional().default(null),
  is_active: z.boolean(),
  beban_to_outflow_num: z.number(),
  beban_to_outflow_den: z.number(),
  constants: z
    .record(z.string(), z.unknown())
    .nullable()
    .optional()
    .transform((value) => value ?? {}),
  id: z.string().uuid(),
});

export const apiPlantTagSchema = z.object({
  plta_id: z.string().uuid(),
  parameter: z.string().min(1),
  station: z.string(),
  protocol: plantTagProtocolSchema,
  address: z.string(),
  http_headers: z.record(z.string(), z.string()).nullable().optional().default(null),
  value_path: z.string().nullable().optional().default(null),
  timestamp_path: z.string().nullable().optional().default(null),
  scale: z.number(),
  offset: z.number(),
  unit: z
    .string()
    .nullable()
    .optional()
    .transform((value) => value ?? ''),
  enabled: z.boolean(),
  id: z.string().uuid(),
});

function paginatedSchema<TSchema extends z.ZodType>(itemSchema: TSchema) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().nonnegative(),
    limit: z.number().int().nonnegative(),
    pages: z.number().int().nonnegative(),
  });
}

export const paginatedRiverBasinsSchema = paginatedSchema(apiRiverBasinSchema);
export const paginatedPlantsSchema = paginatedSchema(apiPlantSchema);
export const paginatedPlantTagsSchema = paginatedSchema(apiPlantTagSchema);

export type ApiRiverBasin = z.infer<typeof apiRiverBasinSchema>;
export type ApiPlant = z.infer<typeof apiPlantSchema>;
export type ApiPlantTag = z.infer<typeof apiPlantTagSchema>;
