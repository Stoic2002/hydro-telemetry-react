import { apiRequest, createApiResponseParser } from '../../../api/http';
import type { TrendSeries } from '../model';
import { apiTrendSeriesSchema, type ApiTrendSeries } from './schemas';
import type { TrendsRepository } from './trends-repository';

const parseResponse = createApiResponseParser(
  'Respons server tidak sesuai kontrak data tren',
);

function mapSeries(series: ApiTrendSeries): TrendSeries {
  return {
    pltaId: series.plta_id,
    parameter: series.parameter,
    station: series.station,
    resolution: series.resolution,
    points: series.points.map((point) => ({
      time: point.time,
      value: point.value,
      quality: point.quality,
      pureQuality: point.quality_murni,
    })),
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
