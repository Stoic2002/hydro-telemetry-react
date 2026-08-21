import { useEffect, type PropsWithChildren } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/auth-store';
import AppShellSkeleton from '../../../components/skeletons/AppShellSkeleton';
import DashboardShellSkeleton from '../../../components/skeletons/DashboardShellSkeleton';
import { getAuthTokens } from '../../../api/http/auth-session';

export default function AuthBootstrap({ children }: PropsWithChildren) {
  const initialize = useAuthStore((state) => state.initialize);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const queryClient = useQueryClient();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      queryClient.clear();
    }
  }, [isAuthenticated, isInitialized, queryClient]);

  if (!isInitialized) {
    // Adanya token berarti tujuannya dashboard, bukan halaman login. Menebak
    // dari sini membuat shimmer pertama sudah berbentuk benar sejak awal.
    const isRestoringSession = Boolean(getAuthTokens())
      && window.location.pathname.startsWith('/dashboard');

    return isRestoringSession ? <DashboardShellSkeleton /> : <AppShellSkeleton />;
  }

  return children;
}
