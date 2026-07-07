import { create } from 'zustand';
import type { User } from '../types';
import { usersData } from '../data/users-data';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (username: string, _password: string) => {
    set({ isLoading: true, error: null });

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 1200));

    const found = usersData.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.status === 'Aktif'
    );

    if (found) {
      set({ user: found, isAuthenticated: true, isLoading: false, error: null });
      return true;
    } else {
      set({ isLoading: false, error: 'Username atau password salah' });
      return false;
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
