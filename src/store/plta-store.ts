import { create } from 'zustand';

interface PLTAState {
  selectedPLTAId: string;
  setSelectedPLTA: (id: string) => void;
}

export const usePLTAStore = create<PLTAState>((set) => ({
  selectedPLTAId: 'pbs-soedirman',
  setSelectedPLTA: (id: string) => set({ selectedPLTAId: id }),
}));
