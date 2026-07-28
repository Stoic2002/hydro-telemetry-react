import { ApiError, apiRequest } from '../../../api/http';
import type { TelemetryUploadResult } from '../model';
import type { TelemetryUploadRepository } from './telemetry-upload-repository';
import {
  apiTelemetryUploadResultSchema,
  type ApiTelemetryUploadResult,
} from './schemas';

function parseResponse(
  payload: unknown,
  endpoint: string,
): ApiTelemetryUploadResult {
  const result = apiTelemetryUploadResultSchema.safeParse(payload);
  if (result.success) return result.data;

  throw new ApiError('Respons server tidak sesuai kontrak upload telemetri', {
    status: 502,
    statusText: 'Invalid API Response',
    details: result.error.flatten(),
    url: endpoint,
  });
}

function mapResult(result: ApiTelemetryUploadResult): TelemetryUploadResult {
  return {
    pltaId: result.plta_id,
    parameter: result.parameter,
    pointsUpserted: result.points_upserted,
    filename: result.filename,
  };
}

export const httpTelemetryUploadRepository: TelemetryUploadRepository = {
  async uploadPoints(input) {
    const endpoint = '/api/v1/telemetry/upload';
    const payload = await apiRequest<unknown>(endpoint, {
      method: 'POST',
      json: {
        plta_id: input.pltaId,
        parameter: input.parameter,
        station: input.station,
        points: input.points,
      },
    });

    return mapResult(parseResponse(payload, endpoint));
  },

  async uploadExcel(input) {
    const endpoint = '/api/v1/telemetry/upload-excel';
    const formData = new FormData();
    formData.set('plta_id', input.pltaId);
    formData.set('parameter', input.parameter);
    formData.set('station', input.station);
    formData.set('file', input.file);

    const payload = await apiRequest<unknown>(endpoint, {
      method: 'POST',
      body: formData,
    });

    return mapResult(parseResponse(payload, endpoint));
  },
};
