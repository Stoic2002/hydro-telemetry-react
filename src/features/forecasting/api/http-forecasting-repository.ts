import { apiRequest, createApiResponseParser } from '../../../api/http';
import type {
  ForecastRunResult,
  ForecastSeries,
} from '../model';
import {
  apiForecastRunResultSchema,
  apiForecastSeriesSchema,
  type ApiForecastRunResult,
  type ApiForecastSeries,
} from './schemas';
import type { ForecastingRepository } from './forecasting-repository';

const parseSeries = createApiResponseParser(
  'Respons server tidak sesuai kontrak Forecasting',
);
const parseRunResult = createApiResponseParser(
  'Respons antrean Forecasting tidak sesuai kontrak',
);

function mapSeries(series: ApiForecastSeries): ForecastSeries {
  return {
    pltaId: series.plta_id,
    parameter: series.parameter,
    modelName: series.model_name,
    generatedAt: series.generated_at,
    unit: series.unit,
    label: series.label,
    accuracy: series.akurasi
      ? {
        skill: series.akurasi.skill,
        sampleCount: series.akurasi.n,
        windowDays: series.akurasi.jendela_hari,
        isPresentable: series.akurasi.layak_disajikan,
      }
      : null,
    points: series.points.map((point) => ({
      time: point.time,
      horizon: point.horizon,
      value: point.value,
      valueP10: point.value_p10,
      valueP90: point.value_p90,
    })),
  };
}

function mapRunResult(result: ApiForecastRunResult): ForecastRunResult {
  return { taskId: result.task_id, status: result.status };
}

export const httpForecastingRepository: ForecastingRepository = {
  async getLatest(input, options) {
    const endpoint = '/api/v1/forecasts';
    const payload = await apiRequest<unknown>(endpoint, {
      method: 'GET',
      cache: 'no-store',
      signal: options?.signal,
      query: {
        plta_id: input.pltaId,
        parameter: input.parameter,
        horizon: input.horizon,
      },
    });
    return mapSeries(parseSeries(payload, apiForecastSeriesSchema, endpoint));
  },

  async run(input) {
    const endpoint = '/api/v1/forecasts/run';
    const payload = await apiRequest<unknown>(endpoint, {
      method: 'POST',
      cache: 'no-store',
      json: {
        plta_id: input.pltaId,
        parameter: input.parameter,
        horizon: input.horizon,
      },
    });
    return mapRunResult(parseRunResult(payload, apiForecastRunResultSchema, endpoint));
  },
};
