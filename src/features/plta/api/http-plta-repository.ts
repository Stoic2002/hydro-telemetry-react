import { ApiError, apiRequest } from '../../../api/http';
import type {
  ListParams,
  PaginatedResult,
  Plant,
  PlantTag,
  RiverBasin,
} from '../model';
import type { PLTARepository } from './plta-repository';
import {
  apiPlantSchema,
  paginatedPlantTagsSchema,
  paginatedPlantsSchema,
  paginatedRiverBasinsSchema,
  type ApiPlant,
  type ApiPlantTag,
  type ApiRiverBasin,
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

  throw new ApiError('Respons server tidak sesuai kontrak data Plants', {
    status: 502,
    statusText: 'Invalid API Response',
    details: result.error.flatten(),
    url: endpoint,
  });
}

function mapRiverBasin(riverBasin: ApiRiverBasin): RiverBasin {
  return {
    id: riverBasin.id,
    code: riverBasin.code,
    name: riverBasin.name,
    description: riverBasin.description,
  };
}

function mapPlant(plant: ApiPlant): Plant {
  return {
    id: plant.id,
    code: plant.code,
    name: plant.name,
    riverBasinId: plant.ws_id,
    latitude: plant.latitude,
    longitude: plant.longitude,
    capacityMw: plant.capacity_mw,
    description: plant.description,
    isActive: plant.is_active,
    bebanToOutflowNum: plant.beban_to_outflow_num,
    bebanToOutflowDen: plant.beban_to_outflow_den,
    constants: plant.constants,
  };
}

function mapPlantTag(tag: ApiPlantTag): PlantTag {
  return {
    id: tag.id,
    pltaId: tag.plta_id,
    parameter: tag.parameter,
    station: tag.station,
    protocol: tag.protocol,
    address: tag.address,
    httpHeaders: tag.http_headers ?? {},
    valuePath: tag.value_path,
    timestampPath: tag.timestamp_path,
    scale: tag.scale,
    offset: tag.offset,
    unit: tag.unit,
    enabled: tag.enabled,
  };
}

function mapPage<TApiItem, TItem>(
  page: {
    items: TApiItem[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  },
  mapItem: (item: TApiItem) => TItem,
): PaginatedResult<TItem> {
  return {
    ...page,
    items: page.items.map(mapItem),
  };
}

function listQuery(params: ListParams) {
  return {
    page: params.page,
    limit: params.limit,
    search: params.search,
  };
}

export const httpPltaRepository: PLTARepository = {
  async listRiverBasins(params) {
    const endpoint = '/api/v1/wilayah-sungai';
    const payload = await apiRequest<unknown>(endpoint, {
      method: 'GET',
      cache: 'no-store',
      query: listQuery(params),
    });
    const result = parseResponse(payload, paginatedRiverBasinsSchema, endpoint);

    return mapPage(result, mapRiverBasin);
  },

  async listByRiverBasin(wsId, params) {
    const endpoint = `/api/v1/wilayah-sungai/${encodeURIComponent(wsId)}/plta`;
    const payload = await apiRequest<unknown>(endpoint, {
      method: 'GET',
      cache: 'no-store',
      query: listQuery(params),
    });
    const result = parseResponse(payload, paginatedPlantsSchema, endpoint);

    return mapPage(result, mapPlant);
  },

  async list(params) {
    const endpoint = '/api/v1/plta';
    const payload = await apiRequest<unknown>(endpoint, {
      method: 'GET',
      cache: 'no-store',
      query: listQuery(params),
    });
    const result = parseResponse(payload, paginatedPlantsSchema, endpoint);

    return mapPage(result, mapPlant);
  },

  async getById(pltaId) {
    const endpoint = `/api/v1/plta/${encodeURIComponent(pltaId)}`;

    try {
      const payload = await apiRequest<unknown>(endpoint, {
        method: 'GET',
        cache: 'no-store',
      });

      return mapPlant(parseResponse(payload, apiPlantSchema, endpoint));
    } catch (error) {
      if (ApiError.isApiError(error) && error.status === 404) return null;
      throw error;
    }
  },

  async listTags(pltaId, params) {
    const endpoint = `/api/v1/plta/${encodeURIComponent(pltaId)}/tags`;
    const payload = await apiRequest<unknown>(endpoint, {
      method: 'GET',
      cache: 'no-store',
      query: {
        ...listQuery(params),
        protocol: params.protocol,
        enabled: params.enabled,
      },
    });
    const result = parseResponse(payload, paginatedPlantTagsSchema, endpoint);

    return mapPage(result, mapPlantTag);
  },
};
