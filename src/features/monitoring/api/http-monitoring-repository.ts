import { ApiError, apiRequest } from '../../../api/http';
import type {
  MonitoringParameterLatest,
  PLTALatestMonitoring,
} from '../model';
import type { MonitoringRepository } from './monitoring-repository';
import {
  apiPLTALatestMonitoringSchema,
  apiRiverBasinLatestMonitoringSchema,
  type ApiMonitoringParameterLatest,
  type ApiPLTALatestMonitoring,
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

  throw new ApiError('Respons server tidak sesuai kontrak data monitoring', {
    status: 502,
    statusText: 'Invalid API Response',
    details: result.error.flatten(),
    url: endpoint,
  });
}

export function mapMonitoringParameterLatest(
  parameter: ApiMonitoringParameterLatest,
): MonitoringParameterLatest {
  return parameter;
}

export function mapPLTALatestMonitoring(
  snapshot: ApiPLTALatestMonitoring,
): PLTALatestMonitoring {
  return {
    pltaId: snapshot.plta_id,
    parameters: snapshot.parameters.map(mapMonitoringParameterLatest),
  };
}

export const httpMonitoringRepository: MonitoringRepository = {
  async getLatestByPLTA(pltaId, options) {
    const endpoint = `/api/v1/monitoring/plta/${encodeURIComponent(pltaId)}/latest`;
    const payload = await apiRequest<unknown>(endpoint, {
      method: 'GET',
      cache: 'no-store',
      signal: options?.signal,
    });

    return mapPLTALatestMonitoring(
      parseResponse(payload, apiPLTALatestMonitoringSchema, endpoint),
    );
  },

  async getLatestByRiverBasin(wsId, options) {
    const endpoint = `/api/v1/monitoring/wilayah-sungai/${encodeURIComponent(wsId)}/latest`;
    const payload = await apiRequest<unknown>(endpoint, {
      method: 'GET',
      cache: 'no-store',
      signal: options?.signal,
    });
    const snapshots = parseResponse(
      payload,
      apiRiverBasinLatestMonitoringSchema,
      endpoint,
    );

    return snapshots.map(mapPLTALatestMonitoring);
  },
};
