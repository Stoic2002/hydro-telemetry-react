import type { Plant } from './model';

export function getPlantDisplayName(plant: Pick<Plant, 'code' | 'name'>): string {
  const name = plant.name.trim().replace(/^PLTA\s+/i, '');
  return name || plant.code.trim() || 'Tanpa nama';
}

export function plantMatchesIdentity(
  plant: Pick<Plant, 'code' | 'name'>,
  identity: string,
): boolean {
  const normalizedIdentity = identity.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedCode = plant.code.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedName = plant.name.toLowerCase().replace(/[^a-z0-9]/g, '');

  return normalizedCode.includes(normalizedIdentity)
    || normalizedName.includes(normalizedIdentity);
}
