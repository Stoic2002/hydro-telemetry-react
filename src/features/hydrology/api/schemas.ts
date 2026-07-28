import { z } from 'zod';

const nullableNumberSchema = z.number().nullable().optional().default(null);
const nullableStringSchema = z.string().nullable().optional().default(null);

const apiDailyUpstreamSchema = z.object({
  target_tma: nullableNumberSchema,
  volume_target: nullableNumberSchema,
  volume_waduk: nullableNumberSchema,
  batas_tma_limpas: nullableNumberSchema,
  batas_tma_mol: nullableNumberSchema,
  tma_waduk: nullableNumberSchema,
  tma_waduk_time: nullableStringSchema,
  inflow: nullableNumberSchema,
  curah_hujan_hulu: nullableNumberSchema,
  turbidity_hulu: nullableNumberSchema,
  volume_efektif_thd_target: nullableNumberSchema,
  volume_efektif_thd_mol: nullableNumberSchema,
  ketersediaan_energi_thd_target_mwh: nullableNumberSchema,
  ketersediaan_energi_thd_mol_mwh: nullableNumberSchema,
  service_hour_full_load_jam: nullableNumberSchema,
});

const apiDailyDamSchema = z.object({
  rencana_debit_turbin: nullableNumberSchema,
  rencana_debit_spillway: nullableNumberSchema,
  rencana_debit_hjv: nullableNumberSchema,
  debit_turbin_t1: nullableNumberSchema,
  debit_turbin_t2: nullableNumberSchema,
  debit_spillway: nullableNumberSchema,
  debit_hjv: nullableNumberSchema,
  delta_head_cm: nullableNumberSchema,
});

const apiDailyDownstreamSchema = z.object({
  tma_tailrace: nullableNumberSchema,
  head_m: nullableNumberSchema,
  eff_turbin_1: nullableNumberSchema,
  eff_turbin_2: nullableNumberSchema,
  turbidity_hilir: nullableNumberSchema,
});

const apiDailyHydrologySchema = z.object({
  tanggal: z.string(),
  hulu: apiDailyUpstreamSchema,
  dam: apiDailyDamSchema,
  hilir: apiDailyDownstreamSchema,
  pending_formulas: z.array(z.string()).optional().default([]),
});

export const apiMonthlyHydrologySchema = z.object({
  id: z.string().uuid(),
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
    constants: z.unknown().nullable().optional(),
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
