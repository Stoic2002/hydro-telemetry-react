import { Suspense, useCallback, useState } from "react";
import {
  Outlet,
  NavLink,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  FileText,
  Edit3,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Database,
  Menu,
  X,
} from "lucide-react";
import {
  getPLTADashboardPath,
  getUnscopedDashboardPath,
  isValidPLTAId,
} from "../features/plta/routing";
import { FORECASTING_PLTA_ID } from "../features/forecasting";
import { usePlantCatalogQuery } from "../features/plta/api/queries";
import { useAuthStore } from "../store/auth-store";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import DashboardPageSkeleton from "../components/skeletons/DashboardPageSkeleton";
import { getDashboardSkeletonVariant } from "../components/skeletons/dashboardSkeletonVariant";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  end?: boolean;
}

function NavItem({ to, icon, label, collapsed, end }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex h-10 items-center gap-2.5 overflow-hidden rounded-md px-3 whitespace-nowrap transition-colors ${
          isActive ? "bg-brand-tint" : "hover:bg-slate-50"
        } ${collapsed ? "justify-center px-0" : ""}`
      }
      title={collapsed ? label : undefined}
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden="true"
            className={`shrink-0 ${isActive ? "text-brand-primary-strong" : "text-slate-400"}`}
          >
            {icon}
          </span>
          {!collapsed && (
            <span
              className={`font-sans text-sm ${
                isActive ? "font-semibold text-brand-primary-strong" : "text-text-secondary"
              }`}
            >
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { pltaId } = useParams<{ pltaId: string }>();
  const plantsQuery = usePlantCatalogQuery();
  const pltaList = plantsQuery.data ?? [];
  const selectedPLTAId = isValidPLTAId(pltaId)
    ? pltaId
    : (pltaList.find((plant) => plant.isActive) ?? pltaList[0])?.id;
  const navigate = useNavigate();
  const location = useLocation();
  const loadingVariant = getDashboardSkeletonVariant(location.pathname);
  const canAccessDataTools = user?.role !== "Viewer";

  const getSelectedDashboardPath = (
    page: Parameters<typeof getPLTADashboardPath>[1],
  ) =>
    selectedPLTAId
      ? getPLTADashboardPath(selectedPLTAId, page)
      : getUnscopedDashboardPath(page);

  const closeLogoutDialog = useCallback(() => {
    setIsLogoutDialogOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    closeLogoutDialog();
    logout();
    navigate("/login", { replace: true });
  }, [closeLogoutDialog, logout, navigate]);

  // Generate initials for the user avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="flex min-h-screen min-w-0 bg-surface-base">
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Tutup menu navigasi"
          className="fixed inset-0 z-30 cursor-default bg-slate-950/35 backdrop-blur-[1px] lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 max-w-[85vw] flex-col border-r border-border-subtle bg-white transition-[width,transform] duration-300 lg:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          collapsed ? "lg:w-[72px]" : "lg:w-64"
        }`}
      >
        {/* Sidebar Header */}
        <div className="relative flex h-[72px] shrink-0 items-center gap-2.5 border-b border-border-subtle px-4 transition-all duration-300">
          <div
            className={`flex items-center gap-2.5 overflow-hidden transition-all duration-300 ${collapsed ? "w-full justify-center" : "w-full"}`}
          >
            <img
              src="/logo.png"
              alt="Logo"
              className="size-9 shrink-0 rounded-md object-contain"
            />
            {!collapsed && (
              <div className="flex flex-col whitespace-nowrap">
                <span className="font-sans text-[15px] font-bold leading-tight text-text-primary">
                  PLTA Monitoring
                </span>
                <span className="text-text-muted font-sans text-[11px] leading-normal">
                  Jawa Tengah
                </span>
              </div>
            )}
          </div>

          {/* Floating Collapse Button (No Shadow) */}
          <button
            type="button"
            aria-label={collapsed ? "Perluas menu navigasi" : "Ciutkan menu navigasi"}
            className="absolute -right-3 top-[88px] z-50 hidden size-6 cursor-pointer items-center justify-center rounded-full border border-border-subtle bg-white text-slate-500 transition-colors hover:border-brand-primary-strong hover:text-brand-primary-strong lg:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <button
            type="button"
            aria-label="Tutup menu navigasi"
            className="ml-auto flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <nav
          className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <NavItem
            to={getUnscopedDashboardPath("overview")}
            end
            collapsed={collapsed}
            icon={<LayoutDashboard size={18} strokeWidth={1.75} />}
            label="Overview"
          />
          <NavItem
            to={getSelectedDashboardPath("telemetering")}
            collapsed={collapsed}
            icon={<Activity size={18} strokeWidth={1.75} />}
            label="Telemetering"
          />
          <NavItem
            to={getPLTADashboardPath(FORECASTING_PLTA_ID, "forecasting")}
            collapsed={collapsed}
            icon={<TrendingUp size={18} strokeWidth={1.75} />}
            label="Forecasting"
          />
          <NavItem
            to={getSelectedDashboardPath("trends")}
            collapsed={collapsed}
            icon={<BarChart3 size={18} strokeWidth={1.75} />}
            label="Tren & Grafik"
          />
          <NavItem
            to={getSelectedDashboardPath("laporan")}
            collapsed={collapsed}
            icon={<FileText size={18} strokeWidth={1.75} />}
            label="Laporan"
          />

          {canAccessDataTools && (
            <>
              <NavItem
                to={getSelectedDashboardPath("input-ghw")}
                collapsed={collapsed}
                icon={<Edit3 size={18} strokeWidth={1.75} />}
                label="Input GHW"
              />
              <NavItem
                to="/dashboard/catalog"
                end
                collapsed={collapsed}
                icon={<Database size={18} strokeWidth={1.75} />}
                label="Katalog Data"
              />
            </>
          )}

          {user &&
            (user.role === "Super Admin" || user.role === "Admin UBP") && (
              <NavItem
                to={getSelectedDashboardPath("user-management")}
                collapsed={collapsed}
                icon={<Users size={18} strokeWidth={1.75} />}
                label="User Management"
              />
            )}
        </nav>

        {/* Sidebar Footer / Profile Info (No Shadows) */}
        <div
          className={`flex h-[68px] shrink-0 items-center border-t border-border-subtle transition-all duration-300 ${
            collapsed ? "h-auto flex-col justify-center gap-2 px-2 py-2" : "justify-between gap-2.5 px-4"
          }`}
        >
          {user && (
            <button
              type="button"
              onClick={() => {
                setIsMobileSidebarOpen(false);
                navigate(getSelectedDashboardPath("account"));
              }}
              title="Profil Saya"
              className={`flex min-w-0 cursor-pointer items-center gap-2.5 overflow-hidden border-0 bg-transparent p-0 text-left ${collapsed ? "w-full justify-center" : "flex-1"}`}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-overlay font-sans text-xs font-semibold leading-none text-slate-600">
                {getInitials(user.name)}
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-text-primary font-sans text-[13px] font-medium truncate">
                    {user.name}
                  </span>
                  <span className="text-text-muted font-sans text-[11px] truncate">
                    {user.role}
                  </span>
                </div>
              )}
            </button>
          )}
          <button
            type="button"
            aria-label="Keluar dari aplikasi"
            className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-sm text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-brand-primary-strong/40"
            onClick={() => setIsLogoutDialogOpen(true)}
            title="Keluar"
          >
            <LogOut size={17} strokeWidth={1.75} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-300 ${
          collapsed ? "lg:ml-[72px]" : "lg:ml-64"
        }`}
      >
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border-subtle bg-white/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            aria-label="Buka menu navigasi"
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border-subtle text-slate-600 hover:bg-slate-50"
            onClick={() => {
              setCollapsed(false);
              setIsMobileSidebarOpen(true);
            }}
          >
            <Menu size={20} />
          </button>
          <img src="/logo.png" alt="" className="size-8 rounded-md object-contain" />
          <span className="min-w-0 truncate text-sm font-semibold text-slate-800">
            PLTA Monitoring
          </span>
        </header>

        {/* Page Content */}
        <main className="mx-auto w-full min-w-0 max-w-[1440px] flex-1 p-3 sm:p-4 lg:p-6">
          <Suspense
            fallback={<DashboardPageSkeleton variant={loadingVariant} />}
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      <ConfirmDialog
        isOpen={isLogoutDialogOpen}
        title="Keluar dari aplikasi?"
        description="Sesi Anda di perangkat ini akan diakhiri. Anda perlu masuk kembali untuk mengakses dashboard."
        confirmLabel="Ya, Keluar"
        cancelLabel="Tetap Masuk"
        icon={<LogOut size={21} strokeWidth={2.25} />}
        onConfirm={handleLogout}
        onClose={closeLogoutDialog}
      />
    </div>
  );
}
