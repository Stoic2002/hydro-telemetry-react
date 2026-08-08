import type {
  ListParams,
  PaginatedResult,
  Plant,
  PlantTag,
  PlantTagListParams,
  RiverBasin,
} from '../model';

export interface PLTARepository {
  listRiverBasins(params: ListParams): Promise<PaginatedResult<RiverBasin>>;
  list(params: ListParams): Promise<PaginatedResult<Plant>>;
  getById(pltaId: string): Promise<Plant | null>;
  listTags(
    pltaId: string,
    params: PlantTagListParams,
  ): Promise<PaginatedResult<PlantTag>>;
}
