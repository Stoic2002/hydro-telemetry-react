import { useEffect, type PropsWithChildren } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/auth-store';
import AppShellSkeleton from '../../../components/skeletons/AppShellSkeleton';

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
    return <AppShellSkeleton />;
  }

  return children;
}
