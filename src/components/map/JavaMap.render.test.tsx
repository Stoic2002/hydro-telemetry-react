import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import JavaMap from './JavaMap';
import { useMapLayersQuery, useRainRadarFrameQuery } from './queries';
import { usePlantCatalogQuery } from '../../features/plta';
import * as labelPlacement from './label-placement';
import type { Plant } from '../../features/plta';

/**
 * Menyorot marker mengubah state di komponen teratas peta, sehingga seluruh
 * isinya ikut dirender ulang.
 *
 * Yang dikunci di sini adalah perhitungan geometrinya: centroid 35 kabupaten
 * dari ribuan titik tidak boleh dihitung ulang setiap sorotan berubah.
 *
 * Catatan cakupan: test ini mengunci `useMemo` di dalam lapisan peta, BUKAN
 * `React.memo` yang membungkusnya. Melepas `React.memo` tidak menggagalkan test
 * ini, karena `useMemo` tetap menahan perhitungannya. Yang dihemat `React.memo`
 * adalah render ulang itu sendiri — terutama pembuatan path SVG untuk 555 fitur
 * sungai, yang tidak tertangkap oleh penanda ini.
 */

vi.mock('./queries', () => ({
  useMapLayersQuery: vi.fn(),
  useRainRadarFrameQuery: vi.fn(),
}));

vi.mock('../../features/plta', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../features/plta')>()),
  usePlantCatalogQuery: vi.fn(),
}));

const useMapLayersQueryMock = vi.mocked(useMapLayersQuery);
const useRainRadarFrameQueryMock = vi.mocked(useRainRadarFrameQuery);
const usePlantCatalogQueryMock = vi.mocked(usePlantCatalogQuery);

const SQUARE = [[
  [108.5, -5.5], [112.0, -5.5], [112.0, -8.5], [108.5, -8.5], [108.5, -5.5],
]];

function regency(name: string, offset: number) {
  return {
    type: 'Feature',
    properties: { namobj: name },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [109 + offset, -7], [109.4 + offset, -7], [109.4 + offset, -7.4],
        [109 + offset, -7.4], [109 + offset, -7],
      ]],
    },
  };
}

const MAP_LAYERS = {
  province: {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { Propinsi: 'JAWA TENGAH' },
      geometry: { type: 'Polygon', coordinates: SQUARE },
    }],
  },
  regencies: {
    type: 'FeatureCollection',
    features: [regency('Banjarnegara', 0), regency('Wonosobo', 0.5), regency('Kebumen', 1)],
  },
  rivers: { type: 'FeatureCollection', features: [] },
};

const PLANTS = [
  {
    id: 'plta-soedirman', name: 'PLTA Soedirman', code: 'SDR', riverBasinId: 'ws-1',
    latitude: -7.3, longitude: 109.6, capacityMw: 180, description: null, isActive: true,
    bebanToOutflowNum: null, bebanToOutflowDen: null, constants: null,
  },
] as unknown as Plant[];

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  useMapLayersQueryMock.mockReturnValue({
    data: MAP_LAYERS, isError: false, isPending: false, refetch: vi.fn(),
  } as unknown as ReturnType<typeof useMapLayersQuery>);
  useRainRadarFrameQueryMock.mockReturnValue({
    data: undefined, isError: false, isPending: true, fetchStatus: 'idle', refetch: vi.fn(),
  } as unknown as ReturnType<typeof useRainRadarFrameQuery>);
  usePlantCatalogQueryMock.mockReturnValue({
    data: PLANTS, isError: false, isPending: false, isSuccess: true, error: null, refetch: vi.fn(),
  } as unknown as ReturnType<typeof usePlantCatalogQuery>);
});

describe('perhitungan geometri saat sorotan berubah', () => {
  it('tidak menghitung ulang geometri kabupaten saat marker disorot', async () => {
    const getLabelCoordinate = vi.spyOn(labelPlacement, 'getLabelCoordinate');
    const user = userEvent.setup();
    render(<JavaMap onPLTAClick={vi.fn()} />, { wrapper });

    const afterFirstRender = getLabelCoordinate.mock.calls.length;
    expect(afterFirstRender).toBeGreaterThan(0);

    const marker = screen.getByRole('button', { name: /PLTA Soedirman/i });
    await user.hover(marker);
    await user.unhover(marker);
    await user.hover(marker);

    // Tanpa useMemo, angka ini bertambah setiap kali sorotan berubah.
    expect(getLabelCoordinate.mock.calls.length).toBe(afterFirstRender);
    getLabelCoordinate.mockRestore();
  });

  it('tidak menghitung ulang geometri saat marker menerima fokus keyboard', async () => {
    const getLabelCoordinate = vi.spyOn(labelPlacement, 'getLabelCoordinate');
    const user = userEvent.setup();
    render(<JavaMap onPLTAClick={vi.fn()} />, { wrapper });

    const afterFirstRender = getLabelCoordinate.mock.calls.length;
    await user.tab();
    await user.tab();

    expect(getLabelCoordinate.mock.calls.length).toBe(afterFirstRender);
    getLabelCoordinate.mockRestore();
  });

  it('tetap menampilkan seluruh label kabupaten', () => {
    render(<JavaMap onPLTAClick={vi.fn()} />, { wrapper });

    // Optimasi tidak boleh menghilangkan konten.
    expect(screen.getByText('Banjarnegara')).toBeInTheDocument();
    expect(screen.getByText('Wonosobo')).toBeInTheDocument();
    expect(screen.getByText('Kebumen')).toBeInTheDocument();
  });
});
