import { pltaData } from '../../mocks/plta.mock';
import type { PLTAHistoricalPoint, PLTAInfo } from '../../types';
import type { Plant } from './model';
import { getPlantDisplayName } from './presentation';

function normalizeIdentity(value: string): string {
  return value
    .toLowerCase()
    .replace(/^plta\s*/i, '')
    .replace(/[^a-z0-9]/g, '');
}

function findSimulationFixture(plant: Plant): PLTAInfo | undefined {
  const identities = [plant.code, plant.name]
    .map(normalizeIdentity)
    .filter(Boolean);

  return pltaData.find((candidate) => (
    [candidate.id, candidate.name, candidate.shortName]
      .map(normalizeIdentity)
      .some((candidateIdentity) => (
        identities.some((identity) => (
          identity === candidateIdentity
          || identity.includes(candidateIdentity)
          || candidateIdentity.includes(identity)
        ))
      ))
  ));
}

function createUnavailableHistory(): PLTAHistoricalPoint[] {
  const now = new Date();

  return Array.from({ length: 31 }, (_, index) => {
    const timestamp = new Date(now);
    timestamp.setDate(timestamp.getDate() - (30 - index));

    return {
      timestamp: timestamp.toISOString(),
      waterLevel: 0,
      inflow: 0,
      outflow: 0,
    };
  });
}

function createUnavailableDashboardData(plant: Plant): PLTAInfo {
  const shortName = getPlantDisplayName(plant);
  const now = new Date().toISOString();

  return {
    id: plant.id,
    name: plant.name,
    shortName,
    location: 'Lokasi rinci belum tersedia',
    province: 'Belum tersedia',
    capacity: plant.capacityMw ?? 0,
    units: [{ id: 1, capacity: plant.capacityMw ?? 0 }],
    waduk: `Waduk ${shortName}`,
    ws: plant.riverBasinId,
    status: 'Offline',
    coordinates: [plant.longitude ?? 0, plant.latitude ?? 0],
    notes: plant.description ?? undefined,
    historicalData: createUnavailableHistory(),
    liveData: {
      waterLevel: 0,
      targetLevel: 0,
      inflow: 0,
      outflow: 0,
      produksi: 0,
      lastUpdate: now,
    },
    connection: {
      status: 'Offline',
      lastReceived: now,
      nextSync: now,
    },
  };
}

/**
 * Combines API-owned plant metadata with the explicitly simulated dashboard
 * dataset. Realtime/historical values stay outside the catalog API contract.
 */
export function toPLTADashboardInfo(plant: Plant): PLTAInfo {
  const fixture = findSimulationFixture(plant) ?? createUnavailableDashboardData(plant);

  return {
    ...fixture,
    id: plant.id,
    name: plant.name,
    shortName: getPlantDisplayName(plant),
    capacity: plant.capacityMw ?? fixture.capacity,
    coordinates: [
      plant.longitude ?? fixture.coordinates[0],
      plant.latitude ?? fixture.coordinates[1],
    ],
    notes: plant.description ?? fixture.notes,
    status: plant.isActive ? fixture.status : 'Offline',
  };
}
