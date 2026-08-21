import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import JavaMap from './JavaMap';
import { useMapLayersQuery, useRainRadarFrameQuery } from './queries';
import { usePlantCatalogQuery } from '../../features/plta';
import type { Plant } from '../../features/plta';

/**
 * Peta adalah satu-satunya cara memilih PLTA dari halaman Overview, jadi
 * marker-nya harus dapat dijangkau tanpa tetikus.
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

const MAP_LAYERS = {
  regencies: { type: 'FeatureCollection', features: [] },
  rivers: { type: 'FeatureCollection', features: [] },
};

function plant(overrides: Partial<Plant> & { id: string; name: string }): Plant {
  return {
    code: overrides.name,
    riverBasinId: 'ws-1',
    latitude: -7.3,
    longitude: 109.6,
    capacityMw: 180,
    description: null,
    isActive: true,
    bebanToOutflowNum: null,
    bebanToOutflowDen: null,
    constants: null,
    ...overrides,
  } as Plant;
}

const PLANTS = [
  plant({ id: 'plta-soedirman', name: 'PLTA Soedirman' }),
  plant({ id: 'plta-garung', name: 'PLTA Garung', longitude: 109.9, latitude: -7.2 }),
];

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

describe('marker PLTA', () => {
  it('mengekspos setiap PLTA sebagai tombol bernama', () => {
    render(<JavaMap onPLTAClick={vi.fn()} />, { wrapper });

    expect(screen.getByRole('button', { name: /PLTA Soedirman/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /PLTA Garung/i })).toBeInTheDocument();
  });

  it('dapat dijangkau dengan Tab', async () => {
    const user = userEvent.setup();
    render(<JavaMap onPLTAClick={vi.fn()} />, { wrapper });

    const marker = screen.getByRole('button', { name: /PLTA Soedirman/i });
    await user.tab();
    // Marker pertama harus terjangkau tanpa perlu tetikus sama sekali.
    expect(marker).toHaveFocus();
  });

  it.each([
    ['{Enter}', 'Enter'],
    [' ', 'Spasi'],
  ])('membuka PLTA saat ditekan %s', async (key) => {
    const onPLTAClick = vi.fn();
    const user = userEvent.setup();
    render(<JavaMap onPLTAClick={onPLTAClick} />, { wrapper });

    screen.getByRole('button', { name: /PLTA Soedirman/i }).focus();
    await user.keyboard(key);

    expect(onPLTAClick).toHaveBeenCalledWith('plta-soedirman');
  });

  it('tetap membuka PLTA saat diklik tetikus', async () => {
    const onPLTAClick = vi.fn();
    const user = userEvent.setup();
    render(<JavaMap onPLTAClick={onPLTAClick} />, { wrapper });

    await user.click(screen.getByRole('button', { name: /PLTA Garung/i }));

    expect(onPLTAClick).toHaveBeenCalledWith('plta-garung');
  });
});
