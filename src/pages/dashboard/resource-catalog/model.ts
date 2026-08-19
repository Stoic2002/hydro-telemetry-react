import type { PlantTagProtocol } from '../../../features/plta';

export const PAGE_LIMIT = 10;
export const RIVER_BASIN_LOOKUP_LIMIT = 200;

export const TAG_PROTOCOLS: PlantTagProtocol[] = [
  'opcua',
  'modbus',
  'sql',
  'rest',
  'upload',
];

export type CatalogView = 'ws' | 'plta' | 'tags';

export function parseCatalogView(value: string | null): CatalogView {
  return value === 'plta' || value === 'tags' ? value : 'ws';
}

export function formatCoordinate(value: number | null): string {
  return value === null ? '—' : value.toFixed(5);
}

