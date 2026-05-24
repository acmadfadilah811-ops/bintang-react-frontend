import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
} from 'lucide-react';

// Tambahkan menu Buku Besar ke akses Owner / Manager
const menuOwnerManager = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/attendance', label: 'Absensi', icon: CalendarClock },
  { path: '/orders', label: 'Pesanan', icon: ShoppingCart },
  { path: '/jobs', label: 'Papan Produksi', icon: Kanban },
  { path: '/inventory', label: 'Inventori', icon: Package },
  { path: '/customers', label: 'Pelanggan', icon: Users },
  { path: '/employees', label: 'Karyawan', icon: Briefcase },
  { path: '/buku-besar', label: 'Buku Besar', icon: BookOpen },
  { path: '/pricelist', label: 'Daftar Harga', icon: DollarSign },
  { path: '/announcements', label: 'Pengumuman', icon: Bell },
  { path: '/profile', label: 'Profil', icon: User },
  { path: '/settings', label: 'Pengaturan', icon: Settings },
];

const menuStaff = [
  { path: '/staff-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/jobs', label: 'Papan Produksi', icon: Kanban },
  { path: '/profile', label: 'Profil', icon: User },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menu = user?.role?.toLowerCase() === 'staff' ? menuStaff : menuOwnerManager;

  return (
    <aside
      className={`bg-slate-900 min-h-screen flex flex-col border-r border-slate-800 transition-all duration-300 relative z-20 shadow-sm ${
        isCollapsed ? 'w-20' : 'w-56'
      }`}
    >
      {/* Tombol Toggle Expand/Collapse */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-slate-800 hover:bg-slate-700 text-slate-300 p-1 rounded-full border border-slate-700 z-30 transition-colors shadow-sm"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Logo / Nama Aplikasi */}
      <div className="h-16 flex items-center justify-center border-b border-slate-800 overflow-hidden bg-slate-900 shrink-0">
        <div
          className={`flex items-center gap-2 whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'scale-110' : 'scale-100'}`}
        >
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm">
            <Star className="text-white shrink-0" size={isCollapsed ? 20 : 18} />
          </div>
          {!isCollapsed && (
            <h1 className="text-white font-extrabold text-lg tracking-tight animate-fade-in">
              Bintang Adv
            </h1>
          )}
        </div>
      </div>

      {/* Menu Navigasi */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden sidebar-scrollbar">
        {menu.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={isCollapsed ? item.label : ''}
              className={`w-full flex items-center rounded-lg text-sm transition-all duration-200 focus:outline-none ${
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
        })}
      </nav>

      {/* Tombol Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-900 shrink-0">
        <button
          onClick={logout}
          title={isCollapsed ? 'Keluar' : ''}
          className={`flex items-center w-full rounded-lg text-sm text-red-400 hover:bg-red-950/50 hover:text-red-300 font-medium transition-all duration-200 ${
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
