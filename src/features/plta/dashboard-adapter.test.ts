import { describe, expect, it } from 'vitest';
import type { Plant } from './model';
import { toPLTADashboardInfo } from './dashboard-adapter';

function plant(overrides: Partial<Plant> = {}): Plant {
  return {
    id: 'plant-1',
    code: 'PBS-SOEDIRMAN',
    name: 'PLTA PBS Soedirman',
    riverBasinId: 'ws-serayu',
    latitude: -7.36,
    longitude: 109.62,
    capacityMw: 190,
    description: 'Metadata dari API',
    isActive: true,
    bebanToOutflowNum: 1,
    bebanToOutflowDen: 1,
    constants: {},
    ...overrides,
  };
}

describe('toPLTADashboardInfo', () => {
  it('combines the matching simulation fixture with API-owned metadata', () => {
    const dashboard = toPLTADashboardInfo(plant());

    expect(dashboard).toMatchObject({
      id: 'plant-1',
      name: 'PLTA PBS Soedirman',
      shortName: 'PBS Soedirman',
      capacity: 190,
      coordinates: [109.62, -7.36],
      notes: 'Metadata dari API',
    });
    expect(dashboard.liveData.targetLevel).toBe(224.5);
    expect(dashboard.historicalData).toHaveLength(31);
  });

  it('creates an explicit unavailable state for plants without a fixture', () => {
    const dashboard = toPLTADashboardInfo(plant({
      id: 'unknown-plant',
      code: 'UNKNOWN',
      name: 'PLTA Baru',
      capacityMw: null,
      latitude: null,
      longitude: null,
      description: null,
    }));

    expect(dashboard).toMatchObject({
      id: 'unknown-plant',
      shortName: 'Baru',
      capacity: 0,
      coordinates: [0, 0],
      status: 'Offline',
    });
    expect(dashboard.historicalData).toHaveLength(31);
    expect(dashboard.historicalData.every((point) => (
      point.waterLevel === 0 && point.inflow === 0 && point.outflow === 0
    ))).toBe(true);
  });

  it('forces inactive API plants to an offline dashboard status', () => {
    expect(toPLTADashboardInfo(plant({ isActive: false })).status).toBe('Offline');
  });
});

