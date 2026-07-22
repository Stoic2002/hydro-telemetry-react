import { ApiError, apiRequest } from '../../../api/http';
import type {
  ElevationUploadResult,
  RTOWUploadResult,
} from '../model';
import type { UploadsRepository } from './uploads-repository';
import {
  apiElevationUploadResultSchema,
  apiRTOWUploadResultSchema,
  type ApiElevationUploadResult,
  type ApiRTOWUploadResult,
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

  throw new ApiError('Respons server tidak sesuai kontrak upload data PLTA', {
    status: 502,
    statusText: 'Invalid API Response',
    details: result.error.flatten(),
    url: endpoint,
  });
}

function mapElevationResult(result: ApiElevationUploadResult): ElevationUploadResult {
  return {
    id: result.id,
    pltaId: result.plta_id,
    year: result.year,
    status: result.status,
    minElevation: result.min_elevation,
    maxElevation: result.max_elevation,
    points: result.points,
  };
}

function mapRTOWResult(result: ApiRTOWUploadResult): RTOWUploadResult {
  return {
    id: result.id,
    pltaId: result.plta_id,
    tahun: result.tahun,
    entries: result.entries.map((entry) => ({
      id: entry.id,
      tanggal: entry.tanggal,
      targetElevasi: entry.target_elevasi,
    })),
  };
}

export const httpUploadsRepository: UploadsRepository = {
  async createElevation(input) {
    const endpoint = '/api/v1/elevations';
    const payload = await apiRequest<unknown>(endpoint, {
      method: 'POST',
      cache: 'no-store',
      json: {
        plta_id: input.pltaId,
        year: input.year,
        min_elevation: input.minElevation,
        max_elevation: input.maxElevation,
        points: input.points,
      },
    });

    return mapElevationResult(
      parseResponse(payload, apiElevationUploadResultSchema, endpoint),
    );
  },

  async createRTOW(input) {
    const endpoint = '/api/v1/rtow';
    const payload = await apiRequest<unknown>(endpoint, {
      method: 'POST',
      cache: 'no-store',
      json: {
        plta_id: input.pltaId,
        tahun: input.tahun,
        entries: input.entries.map((entry) => ({
          tanggal: entry.tanggal,
          target_elevasi: entry.targetElevasi,
        })),
      },
    });

    return mapRTOWResult(
      parseResponse(payload, apiRTOWUploadResultSchema, endpoint),
    );
  },
};
