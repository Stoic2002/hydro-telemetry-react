import { create } from 'zustand';
import type { User } from '../types';
import { ApiError } from '../api/http/api-error';
import {
  clearAuthTokens,
  getAuthTokens,
  setAuthTokens,
  subscribeToAuthSession,
} from '../api/http/auth-session';
import { authRepository } from '../features/auth/api/repository';
import { mapAuthUserToUIUser } from '../features/auth/model';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  refreshProfile: () => Promise<boolean>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

let initializationPromise: Promise<void> | null = null;

function getLoginErrorMessage(error: unknown): string {
  if (!ApiError.isApiError(error)) {
    return 'Terjadi kesalahan saat masuk. Silakan coba kembali';
  }

  if (error.status === 0) return 'Tidak dapat terhubung ke server';
  if (error.status === 401) return 'Username atau password salah';
  if (error.status === 403) return 'Akun tidak memiliki izin untuk masuk';
  if (error.status === 422) return 'Username atau password tidak valid';
  if (error.status >= 500) return 'Server sedang mengalami gangguan';
  return error.message;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    if (get().isInitialized) return;
    if (initializationPromise) return initializationPromise;

    initializationPromise = (async () => {
      if (!getAuthTokens()) {
        set({ isInitialized: true, isLoading: false });
        return;
      }

      set({ isLoading: true, error: null });

      try {
        const profile = await authRepository.getCurrentUser();
        if (!profile.is_active) {
          clearAuthTokens({ broadcast: true });
          set({
            user: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
            error: 'Akun sudah dinonaktifkan',
          });
          return;
        }

        set({
          user: mapAuthUserToUIUser(profile),
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        if (ApiError.isApiError(error) && (error.isUnauthorized || error.isForbidden)) {
          clearAuthTokens({ broadcast: true });
        }

        set({
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          isLoading: false,
          error: getLoginErrorMessage(error),
        });
      }
    })().finally(() => {
      initializationPromise = null;
    });

    return initializationPromise;
  },

  refreshProfile: async () => {
    try {
      const profile = await authRepository.getCurrentUser();
      if (!profile.is_active) {
        clearAuthTokens({ broadcast: true });
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Akun sudah dinonaktifkan',
        });
        return false;
      }

      set({ user: mapAuthUserToUIUser(profile), error: null });
      return true;
    } catch (error) {
      set({ error: getLoginErrorMessage(error) });
      return false;
    }
  },

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const tokens = await authRepository.login({ username, password });
      setAuthTokens(tokens);

      const profile = await authRepository.getCurrentUser();
      if (!profile.is_active) {
        clearAuthTokens();
        set({ isLoading: false, error: 'Akun sudah dinonaktifkan' });
        return false;
      }

      set({
        user: mapAuthUserToUIUser(profile),
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (error) {
      clearAuthTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: getLoginErrorMessage(error),
      });
      return false;
    }
  },

  logout: () => {
    clearAuthTokens({ broadcast: true });
    set({
      user: null,
      isAuthenticated: false,
      isInitialized: true,
      isLoading: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));

subscribeToAuthSession((tokens) => {
  if (!tokens) {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }
});
