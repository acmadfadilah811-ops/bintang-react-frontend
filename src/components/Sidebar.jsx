import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ShoppingCart, Kanban,
  Package, Users, Settings, LogOut, Star,
  ChevronLeft, ChevronRight, User, Briefcase
} from 'lucide-react';

const menuOwnerManager = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/orders', label: 'Pesanan', icon: ShoppingCart },
  { path: '/jobs', label: 'Papan Produksi', icon: Kanban },
  { path: '/inventory', label: 'Inventori', icon: Package },
  { path: '/customers', label: 'Pelanggan', icon: Users },
  { path: '/employees', label: 'Karyawan', icon: Briefcase },
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
  const [isCollapsed, setIsCollapsed] = useState(false); // State untuk animasi geser

  const menu = user?.role?.toLowerCase() === 'staff' ? menuStaff : menuOwnerManager;

  const getSidebarAvatar = () => {
    if (!user?.foto_profil) return null;
    return user.foto_profil.startsWith('http') 
      ? user.foto_profil 
      : `http://127.0.0.1:8000${user.foto_profil}`;
  };
  const avatarUrl = getSidebarAvatar();

  return (
    <aside 
      className={`bg-slate-800 min-h-screen flex flex-col border-r border-slate-700 transition-all duration-300 relative z-20 ${
        isCollapsed ? 'w-20' : 'w-56'
      }`}
    >
      {/* Tombol Toggle Expand/Collapse */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-slate-700 hover:bg-slate-600 text-white p-1 rounded-full border border-slate-500 z-30 transition-colors shadow-md"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Logo / Nama Aplikasi */}
      <div className="h-16 flex items-center justify-center border-b border-slate-700 overflow-hidden">
        <div className={`flex items-center gap-2 whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'scale-110' : 'scale-100'}`}>
          <Star className="text-yellow-400 shrink-0" size={isCollapsed ? 24 : 22} />
          {!isCollapsed && <h1 className="text-white font-bold text-lg animate-fade-in">Bintang Adv</h1>}
        </div>
      </div>

      {/* Info User */}
      <div className={`border-b border-slate-700 flex flex-col items-center justify-center transition-all duration-300 ${isCollapsed ? 'py-4' : 'p-4'}`}>
        {isCollapsed ? (
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold uppercase shadow-sm overflow-hidden" title={user?.username}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.username?.charAt(0) || <User size={18} />
            )}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center text-center overflow-hidden animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center shadow-md overflow-hidden mb-2 border-2 border-slate-600">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={28} className="text-slate-400" />
              )}
            </div>
            <p className="text-white font-semibold text-sm truncate w-full">{user?.username}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 capitalize inline-block mt-1">
              {user?.role}
            </span>
          </div>
        )}
      </div>

      {/* Menu Navigasi */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {menu.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : ''} // Munculkan tooltip teks jika sedang disembunyikan
              className={`flex items-center rounded-lg text-sm transition-all duration-200 ${
                isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5 gap-3'
              } ${
                isActive
                  ? 'bg-indigo-600 text-white font-medium shadow-md'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon size={isCollapsed ? 22 : 18} className="shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Tombol Logout */}
      <div className="p-3 border-t border-slate-700">
        <button
          onClick={logout}
          title={isCollapsed ? 'Keluar' : ''}
          className={`flex items-center w-full rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all duration-200 ${
            isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5 gap-3'
          }`}
        >
          <LogOut size={isCollapsed ? 22 : 18} className="shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Keluar</span>}
        </button>
      </div>
    </aside>
  );
}