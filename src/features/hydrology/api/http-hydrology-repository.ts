import { ApiError, apiRequest } from '../../../api/http';
import type {
  DailyHydrology,
  MonthlyHydrology,
  PLTAHydrologyDashboard,
} from '../model';
import type { HydrologyRepository } from './hydrology-repository';
import {
  apiMonthlyHydrologySchema,
  apiMonthlyHydrologyPageSchema,
  apiPLTAHydrologyDashboardSchema,
  type ApiMonthlyHydrology,
  type ApiPLTAHydrologyDashboard,
} from './schemas';

interface SafeParseSchema<T> {
  safeParse(value: unknown):
    | { success: true; data: T }
    | { success: false; error: { flatten: () => unknown } };
}

function parseResponse<T>(
  payload: unknown,
  schema: SafeParseSchema<T>,
  endpoint: string,
): T {
  const result = schema.safeParse(payload);
  if (result.success) return result.data;

  throw new ApiError('Respons server tidak sesuai kontrak data hidrologi', {
    status: 502,
    statusText: 'Invalid API Response',
    details: result.error.flatten(),
    url: endpoint,
  });
}

function mapDailyHydrology(
  daily: NonNullable<ApiPLTAHydrologyDashboard['daily']>,
): DailyHydrology {
  return {
    date: daily.tanggal,
    upstream: {
      targetTma: daily.hulu.target_tma,
      targetVolume: daily.hulu.volume_target,
      reservoirVolume: daily.hulu.volume_waduk,
      spillwayTmaLimit: daily.hulu.batas_tma_limpas,
      molTmaLimit: daily.hulu.batas_tma_mol,
      reservoirTma: daily.hulu.tma_waduk,
      reservoirTmaTime: daily.hulu.tma_waduk_time,
      inflow: daily.hulu.inflow,
      upstreamRainfall: daily.hulu.curah_hujan_hulu,
      upstreamTurbidity: daily.hulu.turbidity_hulu,
      effectiveVolumeToTarget: daily.hulu.volume_efektif_thd_target,
      effectiveVolumeToMol: daily.hulu.volume_efektif_thd_mol,
      availableEnergyToTargetMwh: daily.hulu.ketersediaan_energi_thd_target_mwh,
      availableEnergyToMolMwh: daily.hulu.ketersediaan_energi_thd_mol_mwh,
      fullLoadServiceHours: daily.hulu.service_hour_full_load_jam,
    },
    dam: {
      plannedTurbineDischarge: daily.dam.rencana_debit_turbin,
      plannedSpillwayDischarge: daily.dam.rencana_debit_spillway,
      plannedHjvDischarge: daily.dam.rencana_debit_hjv,
      turbineDischargeT1: daily.dam.debit_turbin_t1,
      turbineDischargeT2: daily.dam.debit_turbin_t2,
      spillwayDischarge: daily.dam.debit_spillway,
      hjvDischarge: daily.dam.debit_hjv,
      deltaHeadCm: daily.dam.delta_head_cm,
    },
    downstream: {
      tailraceTma: daily.hilir.tma_tailrace,
      headM: daily.hilir.head_m,
      turbineEfficiency1: daily.hilir.eff_turbin_1,
      turbineEfficiency2: daily.hilir.eff_turbin_2,
      downstreamTurbidity: daily.hilir.turbidity_hilir,
    },
    pendingFormulas: daily.pending_formulas,
  };
}

function mapDashboard(
  dashboard: ApiPLTAHydrologyDashboard,
): PLTAHydrologyDashboard {
  return {
    pltaId: dashboard.plta.id,
    monthly: dashboard.monthly ? mapMonthly(dashboard.monthly) : null,
    daily: dashboard.daily ? mapDailyHydrology(dashboard.daily) : null,
  };
}

function mapMonthly(item: ApiMonthlyHydrology): MonthlyHydrology {
  return {
    id: item.id,
    pltaId: item.plta_id,
    year: item.tahun,
    month: item.bulan,
    hydrologyPrediction: item.prediksi_hidrologi,
    hydrologyActual: item.aktual_hidrologi,
    rainfallCharacteristicImage: item.image_sifat_hujan,
    rainfallImage: item.image_curah_hujan,
    predictedProductionMwh: item.prediksi_produksi_mwh,
    targetProductionMwh: item.target_produksi_mwh,
    previousAchievementMwh: item.pencapaian_sd_prev_mwh,
    predictedPreviousAchievementMwh: item.prediksi_pencapaian_sd_prev_mwh,
    targetPreviousAchievementMwh: item.target_pencapaian_sd_prev_mwh,
    achievementPercentage: item.prosentase_pencapaian,
  };
}

export const httpHydrologyRepository: HydrologyRepository = {
  async getPLTADashboard(pltaId, options) {
    const endpoint = `/api/v1/dashboard/plta/${encodeURIComponent(pltaId)}`;
    const payload = await apiRequest<unknown>(endpoint, {
      method: 'GET',
      cache: 'no-store',
      signal: options?.signal,
    });

    return mapDashboard(
      parseResponse(payload, apiPLTAHydrologyDashboardSchema, endpoint),
    );
  },

  async listMonthly(pltaId, year, options) {
    const endpoint = '/api/v1/hydrology/monthly';
    const payload = await apiRequest<unknown>(endpoint, {
      method: 'GET',
      cache: 'no-store',
      signal: options?.signal,
      query: {
        plta_id: pltaId,
        tahun: year,
        page: 1,
        limit: 12,
      },
    });
    const page = parseResponse(payload, apiMonthlyHydrologyPageSchema, endpoint);

    return page.items.map(mapMonthly);
  },

  async getMonthlyImage(pltaId, year, month, kind, options) {
    const endpoint = '/api/v1/hydrology/monthly/image';
    const payload = await apiRequest<Blob>(endpoint, {
      method: 'GET',
      cache: 'no-store',
      signal: options?.signal,
      headers: { Accept: 'image/*' },
      query: {
        plta_id: pltaId,
        tahun: year,
        bulan: month,
        jenis: kind,
      },
    });

    if (!(payload instanceof Blob)) {
      throw new ApiError('Respons gambar hidrologi tidak valid', {
        status: 502,
        statusText: 'Invalid API Response',
        url: endpoint,
      });
    }

    return payload;
  },

  async upsertMonthly(input) {
    const endpoint = '/api/v1/hydrology/monthly';
    const payload = await apiRequest<unknown>(endpoint, {
      method: 'PUT',
      json: {
        plta_id: input.pltaId,
        tahun: input.year,
        bulan: input.month,
        prediksi_hidrologi: input.hydrologyPrediction,
        aktual_hidrologi: input.hydrologyActual,
        prediksi_produksi_mwh: input.predictedProductionMwh,
        target_produksi_mwh: input.targetProductionMwh,
        pencapaian_sd_prev_mwh: input.previousAchievementMwh,
        prediksi_pencapaian_sd_prev_mwh: input.predictedPreviousAchievementMwh,
        target_pencapaian_sd_prev_mwh: input.targetPreviousAchievementMwh,
      },
    });

    return mapMonthly(
      parseResponse(payload, apiMonthlyHydrologySchema, endpoint),
    );
  },

  async uploadMonthlyImage(input) {
    const endpoint = '/api/v1/hydrology/monthly/image';
    const formData = new FormData();
    formData.set('plta_id', input.pltaId);
    formData.set('tahun', String(input.year));
    formData.set('bulan', String(input.month));
    formData.set('jenis', input.kind);
    formData.set('file', input.file);

    const payload = await apiRequest<unknown>(endpoint, {
      method: 'POST',
      body: formData,
    });

    return mapMonthly(
      parseResponse(payload, apiMonthlyHydrologySchema, endpoint),
    );
  },
};
