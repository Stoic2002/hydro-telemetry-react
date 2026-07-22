import { Suspense, useCallback, useState } from 'react';
import {
  Outlet,
  NavLink,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  LayoutDashboard, Activity, TrendingUp,
  FileText, Edit3, Users, LogOut, ChevronLeft, ChevronRight,
  BarChart3, Database,
} from 'lucide-react';
import {
  getPLTADashboardPath,
  getUnscopedDashboardPath,
  isValidPLTAId,
} from '../features/plta/routing';
import { usePlantCatalogQuery } from '../features/plta/api/queries';
import { useAuthStore } from '../store/auth-store';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AppShellSkeleton from '../components/skeletons/AppShellSkeleton';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
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

  const getSelectedDashboardPath = (page: Parameters<typeof getPLTADashboardPath>[1]) => (
    selectedPLTAId
      ? getPLTADashboardPath(selectedPLTAId, page)
      : getUnscopedDashboardPath(page)
  );

  const closeLogoutDialog = useCallback(() => {
    setIsLogoutDialogOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    closeLogoutDialog();
    logout();
    navigate('/login', { replace: true });
  }, [closeLogoutDialog, logout, navigate]);

  // Generate initials for the user avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-surface-base">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 flex flex-col bg-white border-r border-border-subtle transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className="relative flex h-[72px] shrink-0 items-center border-b border-border-subtle px-5 gap-3 transition-all duration-300">
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${collapsed ? 'justify-center w-full' : 'w-full'}`}>
            <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain shrink-0 rounded-lg" />
            {!collapsed && (
              <div className="flex flex-col whitespace-nowrap">
                <span className="text-[#0f172a] font-display text-[15px] font-bold leading-normal tracking-[-0.375px]">
                  PLTA Monitoring
                </span>
                <span className="text-[#94a3b8] font-sans text-[11px] leading-normal">
                  Jawa Tengah
                </span>
              </div>
            )}
          </div>
          
          {/* Floating Collapse Button (No Shadow) */}
          <button
            className="absolute -right-3 top-6 w-6 h-6 bg-white border border-border-subtle rounded-full flex items-center justify-center text-slate-400 hover:text-brand-primary-strong hover:border-brand-primary-strong z-50 transition-all duration-200 cursor-pointer"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          
          {/* Overview */}
          <NavLink
            to={getUnscopedDashboardPath('overview')}
            end
            className={({ isActive }) =>
              `flex h-10 items-center rounded-[10px] px-3 gap-3 transition-colors overflow-hidden whitespace-nowrap ${
                isActive
                  ? 'bg-[#ecfeff] text-[#0891b2] font-semibold'
                  : 'text-[#334155] hover:bg-slate-50 hover:text-slate-900'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? 'Overview' : undefined}
          >
            <LayoutDashboard size={18} className="shrink-0 text-current" />
            {!collapsed && <span className="font-sans text-sm">Overview</span>}
          </NavLink>

          {/* Telemetering */}
          <NavLink
            to={getSelectedDashboardPath('telemetering')}
            className={({ isActive }) =>
              `flex h-10 items-center rounded-[10px] px-3 gap-3 transition-colors overflow-hidden whitespace-nowrap ${
                isActive
                  ? 'bg-[#ecfeff] text-[#0891b2] font-semibold'
                  : 'text-[#334155] hover:bg-slate-50 hover:text-slate-900'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? 'Telemetering' : undefined}
          >
            <Activity size={18} className="shrink-0 text-current" />
            {!collapsed && <span className="font-sans text-sm">Telemetering</span>}
          </NavLink>

          {/* Forecasting (Machine Learning) */}
          <NavLink
            to={getSelectedDashboardPath('forecasting')}
            className={({ isActive }) =>
              `flex h-10 items-center rounded-[10px] px-3 gap-3 transition-colors overflow-hidden whitespace-nowrap ${
                isActive
                  ? 'bg-[#ecfeff] text-[#0891b2] font-semibold'
                  : 'text-[#334155] hover:bg-slate-50 hover:text-slate-900'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? 'Forecasting' : undefined}
          >
            <TrendingUp size={18} className="shrink-0 text-current" />
            {!collapsed && <span className="font-sans text-sm">Forecasting</span>}
          </NavLink>

          {/* Tren & Grafik */}
          <NavLink
            to={getSelectedDashboardPath('trends')}
            className={({ isActive }) =>
              `flex h-10 items-center rounded-[10px] px-3 gap-3 transition-colors overflow-hidden whitespace-nowrap ${
                isActive
                  ? 'bg-[#ecfeff] text-[#0891b2] font-semibold'
                  : 'text-[#334155] hover:bg-slate-50 hover:text-slate-900'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? 'Tren & Grafik' : undefined}
          >
            <BarChart3 size={18} className="shrink-0 text-current" />
            {!collapsed && <span className="font-sans text-sm">Tren &amp; Grafik</span>}
          </NavLink>

          {/* Laporan */}
          <NavLink
            to={getSelectedDashboardPath('laporan')}
            className={({ isActive }) =>
              `flex h-10 items-center rounded-[10px] px-3 gap-3 transition-colors overflow-hidden whitespace-nowrap ${
                isActive
                  ? 'bg-[#ecfeff] text-[#0891b2] font-semibold'
                  : 'text-[#334155] hover:bg-slate-50 hover:text-slate-900'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? 'Laporan' : undefined}
          >
            <FileText size={18} className="shrink-0 text-current" />
            {!collapsed && <span className="font-sans text-sm">Laporan</span>}
          </NavLink>

          {/* Input GHW */}
          <NavLink
            to={getSelectedDashboardPath('input-ghw')}
            className={({ isActive }) =>
              `flex h-10 items-center rounded-[10px] px-3 gap-3 transition-colors overflow-hidden whitespace-nowrap ${
                isActive
                  ? 'bg-[#ecfeff] text-[#0891b2] font-semibold'
                  : 'text-[#334155] hover:bg-slate-50 hover:text-slate-900'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? 'Input GHW' : undefined}
          >
            <Edit3 size={18} className="shrink-0 text-current" />
            {!collapsed && <span className="font-sans text-sm">Input GHW</span>}
          </NavLink>

          {/* Katalog Data */}
          <NavLink
            to="/dashboard/catalog"
            end
            className={({ isActive }) =>
              `flex h-10 items-center rounded-[10px] px-3 gap-3 transition-colors overflow-hidden whitespace-nowrap ${
                isActive
                  ? 'bg-[#ecfeff] text-[#0891b2] font-semibold'
                  : 'text-[#334155] hover:bg-slate-50 hover:text-slate-900'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? 'Katalog Data' : undefined}
          >
            <Database size={18} className="shrink-0 text-current" />
            {!collapsed && <span className="font-sans text-sm">Katalog Data</span>}
          </NavLink>

          {/* User Management */}
          {user && (user.role === 'Super Admin' || user.role === 'Admin UBP') && (
            <NavLink
              to={getSelectedDashboardPath('user-management')}
              className={({ isActive }) =>
                `flex h-10 items-center rounded-[10px] px-3 gap-3 transition-colors overflow-hidden whitespace-nowrap ${
                  isActive
                    ? 'bg-[#ecfeff] text-[#0891b2] font-semibold'
                    : 'text-[#334155] hover:bg-slate-50 hover:text-slate-900'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
              title={collapsed ? 'User Management' : undefined}
            >
              <Users size={18} className="shrink-0 text-current" />
              {!collapsed && <span className="font-sans text-sm">User Management</span>}
            </NavLink>
          )}
        </nav>

        {/* Sidebar Footer / Profile Info (No Shadows) */}
        <div className={`h-[68px] border-t border-border-subtle flex shrink-0 items-center transition-all duration-300 ${
          collapsed ? 'flex-col justify-center px-2 py-2 h-auto gap-2' : 'px-5 justify-between gap-3'
        }`}>
          {user && (
            <button
              type="button"
              onClick={() => navigate(getSelectedDashboardPath('account'))}
              title="Profil Saya"
              className={`flex cursor-pointer items-center gap-3 overflow-hidden border-0 bg-transparent p-0 text-left min-w-0 ${collapsed ? 'justify-center w-full' : 'flex-1'}`}
            >
              <div className="size-9 flex shrink-0 justify-center items-center bg-[#f1f5f9] rounded-full border border-border-subtle text-[#0891b2] font-sans text-[13px] font-semibold leading-normal">
                {getInitials(user.name)}
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[#0f172a] font-sans text-[13px] font-medium truncate">
                    {user.name}
                  </span>
                  <span className="text-[#94a3b8] font-sans text-[11px] truncate">
                    {user.role}
                  </span>
                </div>
              )}
            </button>
          )}
          {!collapsed && (
            <button
              type="button"
              aria-label="Keluar dari aplikasi"
              className="text-[#94a3b8] hover:text-red-500 transition-colors shrink-0 focus:outline-none cursor-pointer"
              onClick={() => setIsLogoutDialogOpen(true)}
              title="Keluar"
            >
              <LogOut size={16} />
            </button>
          )}
          {collapsed && (
            <button
              type="button"
              aria-label="Keluar dari aplikasi"
              className="p-1 rounded-md text-[#94a3b8] hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 focus:outline-none cursor-pointer"
              onClick={() => setIsLogoutDialogOpen(true)}
              title="Keluar"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          collapsed ? 'ml-[72px]' : 'ml-64'
        }`}
      >
        {/* Page Content */}
        <main className="flex-1 p-6 w-full max-w-[1440px] mx-auto">
          <Suspense fallback={<AppShellSkeleton embedded />}>
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
