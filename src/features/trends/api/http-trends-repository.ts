import { apiRequest, createApiResponseParser } from '../../../api/http';
import type { TrendSeries } from '../model';
import { apiTrendSeriesSchema, type ApiTrendSeries } from './schemas';
import type { TrendsRepository } from './trends-repository';

const parseResponse = createApiResponseParser(
  'Respons server tidak sesuai kontrak data tren',
);

/**
 * Batas kewajaran numerik, bukan batas domain. Tidak ada besaran di dashboard ini
 * — m³/s, m, mm, MWh, % — yang secara fisik menyentuh satu triliun. Nilai sebesar
 * itu selalu berarti perhitungan di sisi server yang meledak (mis. pembagian
 * dengan angka mendekati nol), dan satu titik semacam itu cukup untuk membuat
 * seluruh sumbu Y tidak terbaca.
 */
const IMPLAUSIBLE_VALUE_THRESHOLD = 1e12;

export function isPlausibleReading(value: number): boolean {
  return Number.isFinite(value) && Math.abs(value) < IMPLAUSIBLE_VALUE_THRESHOLD;
}

function mapSeries(series: ApiTrendSeries): TrendSeries {
  const plausiblePoints = series.points.filter((point) => isPlausibleReading(point.value));

  return {
    pltaId: series.plta_id,
    parameter: series.parameter,
    station: series.station,
    resolution: series.resolution,
    points: plausiblePoints.map((point) => ({
      time: point.time,
      value: point.value,
      quality: point.quality,
      pureQuality: point.quality_murni,
    })),
    discardedPoints: series.points.length - plausiblePoints.length,
  };
}

export const httpTrendsRepository: TrendsRepository = {
  async getSeries(input, options) {
    const endpoint = '/api/v1/trends';
    const payload = await apiRequest<unknown>(endpoint, {
      method: 'GET',
      cache: 'no-store',
      signal: options?.signal,
      query: {
        plta_id: input.pltaId,
        parameter: input.parameter,
        from: input.from,
        to: input.to,
        resolution: input.resolution,
        station: input.station,
        agg: input.aggregation ?? 'avg',
      },
    });

    return mapSeries(parseResponse(payload, apiTrendSeriesSchema, endpoint));
  },
};
