import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PLTAInfo } from '../../types';
import type { Plant } from './model';
import {
  ActivePLTAContext,
  useActivePLTA,
  useActivePLTAId,
  type ActivePLTA,
} from './active-plta-context';

const PLTA_ID = '11111111-1111-4111-8111-111111111111';

const activePLTA = {
  pltaId: PLTA_ID,
  plant: { id: PLTA_ID, name: 'PLTA Soedirman' } as Plant,
  plta: { id: PLTA_ID, shortName: 'Soedirman' } as PLTAInfo,
} satisfies ActivePLTA;

function Consumer() {
  const { plta } = useActivePLTA();
  const pltaId = useActivePLTAId();

  return <p>{`${plta.shortName} ${pltaId}`}</p>;
}

describe('context PLTA aktif', () => {
  it('membagikan PLTA yang sudah diselesaikan route ke turunannya', () => {
    render(
      <ActivePLTAContext.Provider value={activePLTA}>
        <Consumer />
      </ActivePLTAContext.Provider>,
    );

    expect(screen.getByText(`Soedirman ${PLTA_ID}`)).toBeInTheDocument();
  });

  it('menolak pemakaian di luar route PLTA sebagai kesalahan penempatan', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Consumer />)).toThrow(
      /hanya boleh dipakai di dalam route PLTA/,
    );
  });
});
