import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Activity, TrendingUp,
  FileText, Edit3, Users, LogOut, ChevronLeft, ChevronRight,
  ChevronDown, BarChart3
} from 'lucide-react';
import { useAuthStore } from '../store/auth-store';
import { usePLTAStore } from '../store/plta-store';
import { pltaData } from '../data/plta-data';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [isTelemeteringOpen, setIsTelemeteringOpen] = useState(true);
  const [isTrendsOpen, setIsTrendsOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { selectedPLTAId, setSelectedPLTA } = usePLTAStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isTelemetering = location.pathname.startsWith('/dashboard/telemetering');

  // Automatically keep Telemetering submenu open if active route is telemetering
  useEffect(() => {
    if (location.pathname.startsWith('/dashboard/telemetering')) {
      setIsTelemeteringOpen(true);
    }
  }, [location.pathname]);

  // Automatically keep Trends submenu open if active route is trends
  useEffect(() => {
    if (location.pathname.startsWith('/dashboard/trends')) {
      setIsTrendsOpen(true);
    }
  }, [location.pathname]);

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
          collapsed ? 'w-[72px]' : 'w-[280px]'
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
            to="/dashboard/overview"
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

          {/* Telemetering Parent Menu */}
          <div>
            <button
              onClick={() => {
                if (collapsed) {
                  setCollapsed(false);
                }
                setIsTelemeteringOpen(!isTelemeteringOpen);
              }}
              className={`flex h-10 w-full items-center rounded-[10px] px-3 gap-3 transition-colors overflow-hidden whitespace-nowrap text-left cursor-pointer ${
                isTelemetering
                  ? 'bg-[#ecfeff] text-[#0891b2] font-semibold'
                  : 'text-[#334155] hover:bg-slate-50 hover:text-slate-900'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? 'Telemetering' : undefined}
            >
              <Activity size={18} className="shrink-0 text-current" />
              {!collapsed && (
                <>
                  <span className="font-sans text-sm flex-1">Telemetering</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 text-current ${
                      isTelemeteringOpen ? 'rotate-180' : ''
                    }`}
                  />
                </>
              )}
            </button>

            {/* Telemetering Dropdown Sub-items */}
            {isTelemeteringOpen && !collapsed && (
              <div className="flex flex-col pr-0 pl-[30px] py-1 gap-0.5 animate-in fade-in duration-200">
                {pltaData.map((plta) => {
                  const isSelected = selectedPLTAId === plta.id && isTelemetering;
                  return (
                    <button
                      key={plta.id}
                      onClick={() => {
                        setSelectedPLTA(plta.id);
                        navigate('/dashboard/telemetering');
                      }}
                      className={`flex h-8 items-center rounded-2xl px-3 w-full text-left transition-colors cursor-pointer hover:bg-slate-50`}
                    >
                      <span className={`font-sans text-[13px] leading-normal transition-colors ${
                        isSelected
                          ? 'text-[#0891b2] font-medium'
                          : 'text-[#64748b] hover:text-[#334155]'
                      }`}>
                        PLTA {plta.shortName}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>



          {/* Forecasting (Machine Learning) */}
          <NavLink
            to="/dashboard/machine-learning"
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
          <div>
            <button
              onClick={() => {
                if (collapsed) {
                  setCollapsed(false);
                }
                setIsTrendsOpen(!isTrendsOpen);
              }}
              className={`flex h-10 w-full items-center rounded-[10px] px-3 gap-3 transition-colors overflow-hidden whitespace-nowrap text-left cursor-pointer ${
                location.pathname.startsWith('/dashboard/trends')
                  ? 'bg-[#ecfeff] text-[#0891b2] font-semibold'
                  : 'text-[#334155] hover:bg-slate-50 hover:text-slate-900'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? 'Tren & Grafik' : undefined}
            >
              <BarChart3 size={18} className="shrink-0 text-current" />
              {!collapsed && (
                <>
                  <span className="font-sans text-sm flex-1">Tren &amp; Grafik</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 text-current ${
                      isTrendsOpen ? 'rotate-180' : ''
                    }`}
                  />
                </>
              )}
            </button>

            {/* Tren & Grafik Dropdown Sub-items */}
            {isTrendsOpen && !collapsed && (
              <div className="flex flex-col pr-0 pl-[30px] py-1 gap-0.5 animate-in fade-in duration-200">
                {pltaData.map((plta) => {
                  const isSelected = selectedPLTAId === plta.id && location.pathname.startsWith('/dashboard/trends');
                  return (
                    <button
                      key={plta.id}
                      onClick={() => {
                        setSelectedPLTA(plta.id);
                        navigate('/dashboard/trends');
                      }}
                      className={`flex h-8 items-center rounded-2xl px-3 w-full text-left transition-colors cursor-pointer hover:bg-slate-50`}
                    >
                      <span className={`font-sans text-[13px] leading-normal transition-colors ${
                        isSelected
                          ? 'text-[#0891b2] font-medium'
                          : 'text-[#64748b] hover:text-[#334155]'
                      }`}>
                        PLTA {plta.shortName}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Laporan */}
          <NavLink
            to="/dashboard/laporan"
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
            to="/dashboard/data-input-ghw"
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

          {/* User Management */}
          {user && (user.role === 'Super Admin' || user.role === 'Admin UBP') && (
            <NavLink
              to="/dashboard/user-admin"
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
            <div className={`flex items-center gap-3 overflow-hidden min-w-0 ${collapsed ? 'justify-center w-full' : 'flex-1'}`}>
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
            </div>
          )}
          {!collapsed && (
            <button
              className="text-[#94a3b8] hover:text-red-500 transition-colors shrink-0 focus:outline-none cursor-pointer"
              onClick={logout}
              title="Keluar"
            >
              <LogOut size={16} />
            </button>
          )}
          {collapsed && (
            <button
              className="p-1 rounded-md text-[#94a3b8] hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 focus:outline-none cursor-pointer"
              onClick={logout}
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
          collapsed ? 'ml-[72px]' : 'ml-[280px]'
        }`}
      >
        {/* Page Content */}
        <main className="flex-1 p-6 w-full max-w-[1440px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
