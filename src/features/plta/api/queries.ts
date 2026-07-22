import {
  keepPreviousData,
  useQuery,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import { toPLTADashboardInfo } from '../dashboard-adapter';
import type {
  ListParams,
  Plant,
  PlantTagListParams,
} from '../model';
import { useActivePLTAId } from '../routing';
import { pltaRepository } from './repository';

const CATALOG_PAGE_LIMIT = 200;
const CATALOG_STALE_TIME = 5 * 60 * 1_000;

function normalizeListParams(params: ListParams): ListParams {
  const search = params.search?.trim();
  const page = Number.isFinite(params.page) ? Math.floor(params.page) : 1;
  const limit = Number.isFinite(params.limit) ? Math.floor(params.limit) : 20;

  return {
    page: Math.max(1, page),
    limit: Math.min(200, Math.max(1, limit)),
    search: search ? search.slice(0, 100) : undefined,
  };
}

function normalizeTagListParams(params: PlantTagListParams): PlantTagListParams {
  return {
    ...normalizeListParams(params),
    protocol: params.protocol,
    enabled: params.enabled,
  };
}

async function fetchPlantCatalog(): Promise<Plant[]> {
  const firstPage = await pltaRepository.list({
    page: 1,
    limit: CATALOG_PAGE_LIMIT,
  });

  if (firstPage.pages <= 1) return firstPage.items;

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.pages - 1 }, (_, index) => (
      pltaRepository.list({
        page: index + 2,
        limit: CATALOG_PAGE_LIMIT,
      })
    )),
  );

  const plantsById = new Map(
    [firstPage, ...remainingPages]
      .flatMap((page) => page.items)
      .map((plant) => [plant.id, plant] as const),
  );

  return [...plantsById.values()];
}

export const pltaQueryKeys = {
  all: ['plta'] as const,
  riverBasins: () => [...pltaQueryKeys.all, 'river-basins'] as const,
  riverBasinList: (params: ListParams) => (
    [...pltaQueryKeys.riverBasins(), 'list', params] as const
  ),
  lists: () => [...pltaQueryKeys.all, 'list'] as const,
  list: (params: ListParams) => [...pltaQueryKeys.lists(), params] as const,
  catalog: () => [...pltaQueryKeys.lists(), 'catalog'] as const,
  byRiverBasin: (wsId: string, params: ListParams) => (
    [...pltaQueryKeys.riverBasins(), wsId, 'plta', params] as const
  ),
  details: () => [...pltaQueryKeys.all, 'detail'] as const,
  detail: (pltaId: string) => [...pltaQueryKeys.details(), pltaId] as const,
  tags: (pltaId: string, params: PlantTagListParams) => (
    [...pltaQueryKeys.detail(pltaId), 'tags', params] as const
  ),
};

export function useRiverBasinsQuery(params: ListParams) {
  const normalizedParams = normalizeListParams(params);

  return useQuery({
    queryKey: pltaQueryKeys.riverBasinList(normalizedParams),
    queryFn: () => pltaRepository.listRiverBasins(normalizedParams),
    placeholderData: keepPreviousData,
    staleTime: CATALOG_STALE_TIME,
  });
}

export function usePLTAListQuery(params: ListParams) {
  const normalizedParams = normalizeListParams(params);

  return useQuery({
    queryKey: pltaQueryKeys.list(normalizedParams),
    queryFn: () => pltaRepository.list(normalizedParams),
    placeholderData: keepPreviousData,
    staleTime: CATALOG_STALE_TIME,
  });
}

export function usePlantCatalogQuery(enabled = true) {
  return useQuery({
    queryKey: pltaQueryKeys.catalog(),
    queryFn: fetchPlantCatalog,
    enabled,
    staleTime: CATALOG_STALE_TIME,
  });
}

export function usePLTAsByRiverBasinQuery(wsId: string, params: ListParams) {
  const normalizedParams = normalizeListParams(params);

  return useQuery({
    queryKey: pltaQueryKeys.byRiverBasin(wsId, normalizedParams),
    queryFn: () => pltaRepository.listByRiverBasin(wsId, normalizedParams),
    enabled: Boolean(wsId),
    placeholderData: keepPreviousData,
    staleTime: CATALOG_STALE_TIME,
  });
}

export function usePLTADetailQuery(pltaId: string) {
  return useQuery({
    queryKey: pltaQueryKeys.detail(pltaId),
    queryFn: () => pltaRepository.getById(pltaId),
    enabled: Boolean(pltaId),
    staleTime: CATALOG_STALE_TIME,
  });
}

export function usePLTATagsQuery(pltaId: string, params: PlantTagListParams) {
  const normalizedParams = normalizeTagListParams(params);

  return useQuery({
    queryKey: pltaQueryKeys.tags(pltaId, normalizedParams),
    queryFn: () => pltaRepository.listTags(pltaId, normalizedParams),
    enabled: Boolean(pltaId),
    placeholderData: keepPreviousData,
  });
}

export function useActivePLTA() {
  const pltaId = useActivePLTAId();
  const { data: plant } = usePLTADetailQuery(pltaId);
  const plta = useMemo(
    () => plant ? toPLTADashboardInfo(plant) : null,
    [plant],
  );

  if (!plant || !plta) {
    throw new Error(`PLTA ${pltaId} belum tersedia`);
  }

  return { plant, plta, pltaId };
}
