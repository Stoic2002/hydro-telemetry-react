import { lazy, Suspense, type ReactNode } from 'react';
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
import { useAuthStore } from '../store/auth-store';
import AppShellSkeleton from '../components/skeletons/AppShellSkeleton';
import Skeleton from '../components/atoms/Skeleton';
import { Building2, RefreshCw } from 'lucide-react';

const DashboardLayout = lazy(() => import('../layouts/DashboardLayout'));
const Login = lazy(() => import('../pages/Login'));
const Overview = lazy(() => import('../pages/dashboard/Overview'));
const Telemetering = lazy(() => import('../pages/dashboard/Telemetering'));
const Forecasting = lazy(() => import('../pages/dashboard/Forecasting'));
const Trends = lazy(() => import('../pages/dashboard/Trends'));
const Laporan = lazy(() => import('../pages/dashboard/Laporan'));
const InputGHW = lazy(() => import('../pages/dashboard/InputGHW'));
const DataInputOperator = lazy(() => import('../pages/dashboard/DataInputOperator'));
const UserManagement = lazy(() => import('../pages/dashboard/UserManagement'));
const UserCreate = lazy(() => import('../pages/dashboard/UserCreate'));
const UserEdit = lazy(() => import('../pages/dashboard/UserEdit'));
const AccountSettings = lazy(() => import('../pages/dashboard/AccountSettings'));
const ResourceCatalog = lazy(() => import('../pages/dashboard/ResourceCatalog'));

function RouteFallback() {
  return <AppShellSkeleton />;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AdminOnlyRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);

  if (user?.role !== 'Super Admin' && user?.role !== 'Admin UBP') {
    return <Navigate to="/dashboard/overview" replace />;
  }

  return children;
}

function ExistingPLTARoute({ pltaId }: { pltaId: string }) {
  const plantQuery = usePLTADetailQuery(pltaId);

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

  if (!plantQuery.data) {
    return (
      <PlantRouteError
        message="PLTA yang dipilih tidak ditemukan atau sudah tidak tersedia. Pilih PLTA lain dari sidebar."
        onRetry={() => plantQuery.refetch()}
      />
    );
  }

  return <Outlet />;
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
  return (
    <div role="status" aria-label="Memuat data PLTA" className="flex flex-col gap-5 py-1">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-48 rounded-lg" />
        <Skeleton className="h-3 w-80 max-w-full rounded-md" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={`plant-route-card-${index}`} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-[360px] rounded-2xl" />
      <span className="sr-only">Memuat data PLTA...</span>
    </div>
  );
}

function PlantRouteError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[340px] items-center justify-center py-8">
      <div className="flex max-w-md flex-col items-center rounded-2xl border border-red-100 bg-white px-7 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600 ring-4 ring-red-50/70">
          <Building2 size={22} />
        </div>
        <h1 className="mt-4 font-display text-lg font-bold text-slate-900">Data PLTA belum dapat dimuat</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-brand-primary-strong px-4 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-brand-primary-strong/40 focus:ring-offset-2"
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
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white px-7 py-8 text-center">
          <Building2 className="mx-auto text-slate-300" size={38} />
          <h1 className="mt-4 font-display text-lg font-bold text-slate-900">Belum ada PLTA</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
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
            <Route path="catalog" element={<ResourceCatalog />} />
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
              <Route path="input-ghw" element={<InputGHW />} />
              <Route path="data-input-operator" element={<DataInputOperator />} />
              <Route path="account" element={<AccountSettings />} />
              <Route
                path="user-management"
                element={(
                  <AdminOnlyRoute>
                    <UserManagement />
                  </AdminOnlyRoute>
                )}
              />
              <Route
                path="user-management/new"
                element={(
                  <AdminOnlyRoute>
                    <UserCreate />
                  </AdminOnlyRoute>
                )}
              />
              <Route
                path="user-management/:userId/edit"
                element={(
                  <AdminOnlyRoute>
                    <UserEdit />
                  </AdminOnlyRoute>
                )}
              />
            </Route>

            <Route path="telemetering" element={<LegacyDashboardRedirect page="telemetering" />} />
            <Route path="forecasting" element={<LegacyDashboardRedirect page="forecasting" />} />
            <Route path="trends" element={<LegacyDashboardRedirect page="trends" />} />
            <Route path="laporan" element={<LegacyDashboardRedirect page="laporan" />} />
            <Route path="input-ghw" element={<LegacyDashboardRedirect page="input-ghw" />} />
            <Route path="data-input-operator" element={<LegacyDashboardRedirect page="data-input-operator" />} />
            <Route path="user-management" element={<LegacyDashboardRedirect page="user-management" />} />
            <Route path="account" element={<LegacyDashboardRedirect page="account" />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
