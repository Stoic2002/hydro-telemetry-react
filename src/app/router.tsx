import { lazy, Suspense, useMemo, type ReactNode } from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom';
import {
  getPLTADashboardPath,
  isValidPLTAId,
  type PLTADashboardPage,
} from '../features/plta/routing';
import {
  usePlantCatalogQuery,
  usePLTADetailQuery,
} from '../features/plta/api/queries';
import { getPLTAErrorMessage } from '../features/plta/error';
import { toPLTADashboardInfo } from '../features/plta/dashboard-adapter';
import {
  ActivePLTAContext,
  type ActivePLTA,
} from '../features/plta/active-plta-context';
import { canAccessDataTools, canManageUsers } from '../features/auth/permissions';
import { useAuthStore } from '../store/auth-store';
import AppShellSkeleton from '../components/skeletons/AppShellSkeleton';
import DashboardPageSkeleton from '../components/skeletons/DashboardPageSkeleton';
import { getDashboardSkeletonVariant } from '../components/skeletons/dashboardSkeletonVariant';
import { Building2, RefreshCw } from 'lucide-react';

const DashboardLayout = lazy(() => import('../layouts/DashboardLayout'));
const Login = lazy(() => import('../pages/Login'));
const Overview = lazy(() => import('../pages/dashboard/Overview'));
const Telemetering = lazy(() => import('../pages/dashboard/Telemetering'));
const Forecasting = lazy(() => import('../pages/dashboard/Forecasting'));
const Trends = lazy(() => import('../pages/dashboard/Trends'));
const Laporan = lazy(() => import('../pages/dashboard/Laporan'));
const InputGHW = lazy(() => import('../pages/dashboard/InputGHW'));
const UserManagement = lazy(() => import('../pages/dashboard/UserManagement'));
const AccountSettings = lazy(() => import('../pages/dashboard/AccountSettings'));
const ResourceCatalog = lazy(() => import('../pages/dashboard/ResourceCatalog'));

function RouteFallback() {
  return <AppShellSkeleton />;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function AdminOnlyRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);

  if (!canManageUsers(user)) {
    return <Navigate to="/dashboard/overview" replace />;
  }

  return children;
}

export function DataToolsRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);

  if (!canAccessDataTools(user)) {
    return <Navigate to="/dashboard/overview" replace />;
  }

  return children;
}

function ExistingPLTARoute({ pltaId }: { pltaId: string }) {
  const plantQuery = usePLTADetailQuery(pltaId);
  const plant = plantQuery.data;
  const activePLTA = useMemo<ActivePLTA | null>(() => {
    if (!plant) return null;

    const plta = toPLTADashboardInfo(plant);
    return plta ? { pltaId, plant, plta } : null;
  }, [plant, pltaId]);

  if (plantQuery.isPending) {
    return <PlantRouteLoading />;
  }

  if (plantQuery.isError) {
    return (
      <PlantRouteError
        message={getPLTAErrorMessage(plantQuery.error)}
        onRetry={() => plantQuery.refetch()}
      />
    );
  }

  if (!activePLTA) {
    return (
      <PlantRouteError
        message="PLTA yang dipilih tidak ditemukan atau sudah tidak tersedia. Pilih PLTA lain dari sidebar."
        onRetry={() => plantQuery.refetch()}
      />
    );
  }

  // Turunan hanya dirender setelah PLTA aktif benar-benar tersedia, sehingga
  // halaman tidak perlu lagi menangani kondisi datanya kosong.
  return (
    <ActivePLTAContext.Provider value={activePLTA}>
      <Outlet />
    </ActivePLTAContext.Provider>
  );
}

function ValidPLTARoute() {
  const { pltaId } = useParams<{ pltaId: string }>();

  if (!isValidPLTAId(pltaId)) {
    return <Navigate to="/dashboard/overview" replace />;
  }

  return <ExistingPLTARoute pltaId={pltaId} />;
}

function LegacyDashboardRedirect({ page }: { page: PLTADashboardPage }) {
  return <DefaultPLTARedirect page={page} />;
}

function PlantRouteLoading() {
  const { pathname } = useLocation();
  return <DashboardPageSkeleton variant={getDashboardSkeletonVariant(pathname)} />;
}

function PlantRouteError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[340px] items-center justify-center py-8">
      <div className="flex max-w-md flex-col items-center rounded-2xl border border-red-100 bg-surface-raised px-7 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600 ring-4 ring-red-50/70">
          <Building2 size={22} />
        </div>
        <h1 className="mt-4 font-display text-lg font-bold text-text-primary">Data PLTA belum dapat dimuat</h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-brand-primary-strong px-4 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-strong/40"
        >
          <RefreshCw size={15} />
          Coba lagi
        </button>
      </div>
    </div>
  );
}

function DefaultPLTARedirect({ page }: { page: PLTADashboardPage }) {
  const { search } = useLocation();
  const plantsQuery = usePlantCatalogQuery();

  if (plantsQuery.isPending) {
    return <PlantRouteLoading />;
  }

  if (plantsQuery.isError) {
    return (
      <PlantRouteError
        message={getPLTAErrorMessage(plantsQuery.error)}
        onRetry={() => plantsQuery.refetch()}
      />
    );
  }

  const defaultPlant = plantsQuery.data.find((plant) => plant.isActive)
    ?? plantsQuery.data[0];

  if (!defaultPlant) {
    return (
      <div className="flex min-h-[340px] items-center justify-center py-8">
        <div className="max-w-md rounded-2xl border border-border-subtle bg-surface-raised px-7 py-8 text-center">
          <Building2 className="mx-auto text-disabled" size={38} />
          <h1 className="mt-4 font-display text-lg font-bold text-text-primary">Belum ada PLTA</h1>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            Server belum memiliki plant yang dapat ditampilkan untuk akun ini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Navigate
      to={`${getPLTADashboardPath(defaultPlant.id, page)}${search}`}
      replace
    />
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route
            path="/login"
            element={(
              <GuestOnlyRoute>
                <Login />
              </GuestOnlyRoute>
            )}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={<Navigate to="overview" replace />}
            />

            <Route path="overview" element={<Overview />} />
            <Route
              path="monitoring"
              element={<LegacyDashboardRedirect page="telemetering" />}
            />
            <Route
              path="catalog"
              element={(
                <DataToolsRoute>
                  <ResourceCatalog />
                </DataToolsRoute>
              )}
            />
            <Route
              path="plta/:pltaId/overview"
              element={<Navigate to="/dashboard/overview" replace />}
            />

            <Route path="plta/:pltaId" element={<ValidPLTARoute />}>
              <Route index element={<Navigate to="telemetering" replace />} />
              <Route path="telemetering" element={<Telemetering />} />
              <Route path="forecasting" element={<Forecasting />} />
              <Route path="trends" element={<Trends />} />
              <Route path="laporan" element={<Laporan />} />
              <Route
                path="input-ghw"
                element={(
                  <DataToolsRoute>
                    <InputGHW />
                  </DataToolsRoute>
                )}
              />
              <Route path="account" element={<AccountSettings />} />
              <Route
                path="user-management"
                element={(
                  <AdminOnlyRoute>
                    <UserManagement />
                  </AdminOnlyRoute>
                )}
              />
            </Route>

            <Route path="telemetering" element={<LegacyDashboardRedirect page="telemetering" />} />
            <Route path="forecasting" element={<LegacyDashboardRedirect page="forecasting" />} />
            <Route path="trends" element={<LegacyDashboardRedirect page="trends" />} />
            <Route path="laporan" element={<LegacyDashboardRedirect page="laporan" />} />
            <Route path="input-ghw" element={<LegacyDashboardRedirect page="input-ghw" />} />
            <Route path="user-management" element={<LegacyDashboardRedirect page="user-management" />} />
            <Route path="account" element={<LegacyDashboardRedirect page="account" />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
