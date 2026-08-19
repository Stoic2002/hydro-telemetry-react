import { createContext, useContext } from 'react';
import type { PLTAInfo } from '../../types';
import type { Plant } from './model';

export interface ActivePLTA {
  /** ID PLTA pada route, sudah divalidasi bentuknya. */
  pltaId: string;
  /** Data plant dari API. */
  plant: Plant;
  /** Bentuk siap tampil untuk komponen dashboard. */
  plta: PLTAInfo;
}

/**
 * PLTA aktif diselesaikan sekali di level route, lalu dibagikan ke seluruh
 * halaman di bawahnya.
 *
 * Sebelumnya setiap halaman memanggil hook yang melempar `Error` bila data
 * belum ada, sehingga kondisi data biasa bisa merobohkan render. Sekarang route
 * hanya merender turunannya setelah data tersedia, jadi nilai context ini
 * dijamin ada dan halaman tidak perlu lagi menangani kondisi kosong.
 */
export const ActivePLTAContext = createContext<ActivePLTA | null>(null);

function useActivePLTAContext(hookName: string): ActivePLTA {
  const value = useContext(ActivePLTAContext);

  if (!value) {
    // Ini kesalahan penempatan komponen, bukan kondisi data: hook dipakai di
    // luar route `/dashboard/plta/:pltaId`.
    throw new Error(
      `${hookName} hanya boleh dipakai di dalam route PLTA (/dashboard/plta/:pltaId)`,
    );
  }

  return value;
}

export function useActivePLTA(): ActivePLTA {
  return useActivePLTAContext('useActivePLTA');
}

export function useActivePLTAId(): string {
  return useActivePLTAContext('useActivePLTAId').pltaId;
}
