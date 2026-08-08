import { z } from 'zod';

const nullableNumberSchema = z.number().nullable().optional().default(null);
const nullableStringSchema = z.string().nullable().optional().default(null);

const apiDashboardStationMetricSchema = z.object({
  station: z.string(),
  label: z.string(),
  value: nullableNumberSchema,
  time: nullableStringSchema,
});

const apiDashboardMetricSchema = z.object({
  value: nullableNumberSchema,
  unit: nullableStringSchema,
  label: z.string(),
  time: nullableStringSchema,
  source: z.enum(['measured', 'derived', 'plan', 'constant']),
  stations: z.array(apiDashboardStationMetricSchema).nullable().optional().default(null),
});

const apiDashboardMetricGroupSchema = z.record(z.string(), apiDashboardMetricSchema);

const apiDailyHydrologySchema = z.object({
  tanggal: z.string(),
  constants: z.record(z.string(), z.unknown()).nullable().optional().default(null),
  hulu: apiDashboardMetricGroupSchema,
  dam: apiDashboardMetricGroupSchema,
  hilir: apiDashboardMetricGroupSchema,
  pending_formulas: z.array(z.string()).optional().default([]),
});

export const apiMonthlyHydrologySchema = z.object({
  id: z.string().uuid().nullable(),
  plta_id: z.string().uuid(),
  tahun: z.number(),
  bulan: z.number().min(1).max(12),
  prediksi_hidrologi: nullableStringSchema,
  aktual_hidrologi: nullableStringSchema,
  image_sifat_hujan: nullableStringSchema,
  image_curah_hujan: nullableStringSchema,
  prediksi_produksi_mwh: nullableNumberSchema,
  target_produksi_mwh: nullableNumberSchema,
  pencapaian_sd_prev_mwh: nullableNumberSchema,
  prediksi_pencapaian_sd_prev_mwh: nullableNumberSchema,
  target_pencapaian_sd_prev_mwh: nullableNumberSchema,
  prosentase_pencapaian: nullableNumberSchema,
});

export const apiPLTAHydrologyDashboardSchema = z.object({
  plta: z.object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
    constants: z.record(z.string(), z.unknown()).nullable().optional().default(null),
  }),
  monthly: apiMonthlyHydrologySchema.nullable(),
  daily: apiDailyHydrologySchema.nullable(),
});

export const apiMonthlyHydrologyPageSchema = z.object({
  items: z.array(apiMonthlyHydrologySchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  pages: z.number(),
});

export type ApiPLTAHydrologyDashboard = z.infer<
  typeof apiPLTAHydrologyDashboardSchema
>;
export type ApiMonthlyHydrology = z.infer<typeof apiMonthlyHydrologySchema>;
