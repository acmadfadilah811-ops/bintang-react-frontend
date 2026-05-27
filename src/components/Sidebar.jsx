import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasMenuAccess } from '../utils/permissions';
import {
  LayoutDashboard,
  ShoppingCart,
  Kanban,
  Package,
  Users,
  Settings,
  LogOut,
  Star,
  ChevronLeft,
  ChevronRight,
  User,
  Briefcase,
  CalendarClock,
  BookOpen,
  Bell,
  DollarSign,
  ChevronDown,
  BarChart3,
} from 'lucide-react';

const groupedMenuOwnerManager = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, isGroup: false },
  {
    id: 'operasional',
    label: 'Operasional',
    icon: ShoppingCart,
    isGroup: true,
    submenus: [
      { path: '/orders', label: 'Pesanan', icon: ShoppingCart },
      { path: '/jobs', label: 'Papan Produksi', icon: Kanban },
      { path: '/customers', label: 'Pelanggan', icon: User },
    ],
  },
  {
    id: 'hr_kepegawaian',
    label: 'HR & Kepegawaian',
    icon: Users,
    isGroup: true,
    submenus: [
      { path: '/attendance', label: 'Absensi', icon: CalendarClock },
      { path: '/employees', label: 'Karyawan', icon: Briefcase },
      { path: '/announcements', label: 'Pengumuman', icon: Bell },
      { path: '/reports', label: 'Laporan Kerja', icon: BarChart3 },
    ],
  },
  {
    id: 'keuangan_logistik',
    label: 'Keuangan & Logistik',
    icon: BookOpen,
    isGroup: true,
    submenus: [
      { path: '/inventory', label: 'Inventori', icon: Package },
      { path: '/buku-besar', label: 'Buku Besar', icon: BookOpen },
      { path: '/pricelist', label: 'Daftar Harga', icon: DollarSign },
    ],
  },
  { path: '/profile', label: 'Profil', icon: User, isGroup: false },
  { path: '/settings', label: 'Pengaturan', icon: Settings, isGroup: false },
];

const menuStaff = [
  { path: '/staff-dashboard', label: 'Dashboard', icon: LayoutDashboard, isGroup: false },
  { path: '/jobs', label: 'Papan Produksi', icon: Kanban, isGroup: false },
  { path: '/profile', label: 'Profil', icon: User, isGroup: false },
];

const getLogoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const apiBase = (import.meta.env.VITE_API_URL || 'https://bintang-adv.duckdns.org/api').replace(
    '/api',
    ''
  );
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${apiBase}${path}`;
};

export default function Sidebar() {
  const { user, logout, businessSettings } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [businessSettings?.logo_url]);

  // Status open/close untuk accordion group
  const [openGroups, setOpenGroups] = useState({
    operasional: true, // Default terbuka
    hr_kepegawaian: false,
    keuangan_logistik: false,
  });

  const userRole = user?.role?.toLowerCase() || 'staff';

  const getFeatureIdByPath = (path) => {
    if (path === '/dashboard' || path === '/') return 'dashboard';
    if (path === '/staff-dashboard') return 'staff-dashboard';
    if (path === '/orders') return 'orders';
    if (path === '/jobs') return 'jobs';
    if (path === '/customers') return 'customers';
    if (path === '/attendance') return 'attendance';
    if (path === '/employees') return 'employees';
    if (path === '/announcements') return 'announcements';
    if (path === '/reports') return 'reports';
    if (path === '/inventory') return 'inventory';
    if (path === '/buku-besar') return 'buku-besar';
    if (path === '/pricelist') return 'pricelist';
    if (path === '/settings') return 'settings';
    return null;
  };

  const baseMenu = userRole === 'staff' ? menuStaff : groupedMenuOwnerManager;

  // Filter menu berdasarkan perizinan hak akses dinamis
  const filteredMenu = baseMenu
    .map((item) => {
      if (item.isGroup) {
        const allowedSubmenus = item.submenus.filter((sub) => {
          const fid = getFeatureIdByPath(sub.path);
          return fid ? hasMenuAccess(userRole, fid) : true;
        });

        if (allowedSubmenus.length > 0) {
          return { ...item, submenus: allowedSubmenus };
        }
        return null;
      } else {
        const fid = getFeatureIdByPath(item.path);
        const isAllowed = fid ? hasMenuAccess(userRole, fid) : true;
        return isAllowed ? item : null;
      }
    })
    .filter(Boolean);

  const toggleGroup = (id) => {
    setOpenGroups((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <aside
      className={`bg-slate-900 min-h-screen flex flex-col border-r border-slate-800 transition-all duration-300 relative z-20 shadow-sm ${
        isCollapsed ? 'w-20' : 'w-56'
      }`}
    >
      {/* Tombol Toggle Expand/Collapse */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-slate-800 hover:bg-slate-700 text-slate-300 p-1 rounded-full border border-slate-700 z-30 transition-colors shadow-sm cursor-pointer"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Logo / Nama Aplikasi */}
      <div className="h-16 flex items-center justify-center border-b border-slate-800 overflow-hidden bg-slate-900 shrink-0">
        <div
          className={`flex items-center gap-2 whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'scale-110' : 'scale-100'}`}
        >
          <div className={`rounded-lg flex items-center justify-center overflow-hidden w-12 h-12 shrink-0 ${
            businessSettings?.logo_url && !logoError ? 'p-0' : 'p-2.5 bg-blue-600 shadow-sm'
          }`}>
            {businessSettings?.logo_url && !logoError ? (
              <img
                src={getLogoUrl(businessSettings.logo_url)}
                alt="Logo"
                className="w-full h-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <Star className="text-white shrink-0" size={24} />
            )}
          </div>
          {!isCollapsed && (
            <h1 className="text-white font-extrabold text-[15px] tracking-tight animate-fade-in truncate max-w-[125px]" title={businessSettings?.nama_bisnis || 'Brandy'}>
              {businessSettings?.nama_bisnis || 'Brandy'}
            </h1>
          )}
        </div>
      </div>

      {/* Menu Navigasi */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden sidebar-scrollbar">
        {filteredMenu.map((item) => {
          if (!item.isGroup) {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={isCollapsed ? item.label : ''}
                className={`w-full flex items-center rounded-lg text-sm transition-all duration-200 focus:outline-none cursor-pointer ${
                  isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 gap-3'
                } ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 font-bold shadow-sm border border-blue-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'
                }`}
              >
                <Icon size={isCollapsed ? 20 : 18} className="shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap text-left">{item.label}</span>}
              </button>
            );
          } else {
            // Group Menu (Accordion)
            const isOpen = openGroups[item.id];
            const isAnySubActive = item.submenus.some((sub) => location.pathname === sub.path);
            const GroupIcon = item.icon;

            return (
              <div key={item.id} className="space-y-1">
                {/* Header Group */}
                <button
                  onClick={() => toggleGroup(item.id)}
                  title={isCollapsed ? item.label : ''}
                  className={`w-full flex items-center justify-between rounded-lg text-sm transition-all duration-200 focus:outline-none cursor-pointer ${
                    isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 gap-3'
                  } ${
                    isAnySubActive
                      ? 'bg-slate-800/60 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <GroupIcon size={isCollapsed ? 20 : 18} className="shrink-0" />
                    {!isCollapsed && (
                      <span className="whitespace-nowrap text-left">{item.label}</span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown
                      size={14}
                      className={`text-slate-500 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>

                {/* Submenu List (Slide Down Effect) */}
                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden space-y-0.5">
                    {item.submenus.map((sub) => {
                      const isSubActive = location.pathname === sub.path;
                      const SubIcon = sub.icon;
                      return (
                        <button
                          key={sub.path}
                          onClick={() => navigate(sub.path)}
                          title={isCollapsed ? sub.label : ''}
                          className={`w-full flex items-center rounded-lg transition-all duration-200 focus:outline-none cursor-pointer ${
                            isCollapsed
                              ? 'justify-center p-1.5 my-0.5'
                              : 'pl-9 pr-3 py-1.5 gap-2 text-xs'
                          } ${
                            isSubActive
                              ? 'text-blue-400 font-bold bg-blue-600/10'
                              : 'text-slate-500 hover:text-slate-200'
                          }`}
                        >
                          <SubIcon size={isCollapsed ? 16 : 14} className="shrink-0" />
                          {!isCollapsed && (
                            <span className="whitespace-nowrap text-left">{sub.label}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }
        })}
      </nav>

      {/* Tombol Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-900 shrink-0">
        <button
          onClick={logout}
          title={isCollapsed ? 'Keluar' : ''}
          className={`flex items-center w-full rounded-lg text-sm text-red-400 hover:bg-red-950/50 hover:text-red-300 font-medium transition-all duration-200 cursor-pointer ${
            isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 gap-3'
          }`}
        >
          <LogOut size={isCollapsed ? 20 : 18} className="shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
