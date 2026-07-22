export interface PaginatedResult<TItem> {
  items: TItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ListParams {
  page: number;
  limit: number;
  search?: string;
}

export interface RiverBasin {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export interface Plant {
  id: string;
  code: string;
  name: string;
  riverBasinId: string;
  latitude: number | null;
  longitude: number | null;
  capacityMw: number | null;
  description: string | null;
  isActive: boolean;
  bebanToOutflowNum: number;
  bebanToOutflowDen: number;
  constants: Record<string, unknown>;
}

export type PlantTagProtocol = 'opcua' | 'modbus' | 'sql' | 'rest' | 'upload';

export interface PlantTag {
  id: string;
  pltaId: string;
  parameter: string;
  station: string;
  protocol: PlantTagProtocol;
  address: string;
  httpHeaders: Record<string, string>;
  valuePath: string | null;
  timestampPath: string | null;
  scale: number;
  offset: number;
  unit: string;
  enabled: boolean;
}

export interface PlantTagListParams extends ListParams {
  protocol?: PlantTagProtocol;
  enabled?: boolean;
}
