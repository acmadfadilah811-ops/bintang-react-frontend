import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LogOut,
  UserCheck,
  BellRing,
  CreditCard,
  History,
  Wallet,
  Settings,
  MessageCircle,
  LayoutDashboard,
  ShoppingCart,
  Package,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useDynamicIsland } from '../../../context/DynamicIslandContext';
import { useKasir } from '../context/KasirContext';
import apiClient from '../../../api/apiClient';

const getAvatarUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const apiBase = (import.meta.env.VITE_API_URL || 'https://bintang-adv.duckdns.org/api').replace(
    '/api',
    ''
  );
  return `${apiBase}${path}`;
};

export default function KasirTopbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { shiftAktif } = useKasir();
  const { activeNotification, dismissNotification } = useDynamicIsland();

  const [liveTime, setLiveTime] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [waOrderCount, setWaOrderCount] = useState(0);
  const profileRef = useRef(null);

  // Poll count of incoming WA orders (status_global=review, sumber=wa)
  const fetchWaOrdersCount = async () => {
    try {
      const response = await apiClient.get('/orders/', {
        params: { status_global: 'review', sumber: 'wa' },
      });
      const data = response.data || [];
      setWaOrderCount(data.length);
    } catch (error) {
      console.error('Error fetching WA orders count:', error);
    }
  };

  useEffect(() => {
    fetchWaOrdersCount();
    const interval = setInterval(fetchWaOrdersCount, 15000); // 15 seconds poll
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setLiveTime(`${h}:${m}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const avatarUrl = getAvatarUrl(user?.foto_profil);
  const userRole = user?.role?.toLowerCase();

  // Tab utama = fungsi kasir sesuai rute KasirApp (PRD)
  const navLinks = [
    { path: '/kasir/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/kasir/terminal', label: 'Terminal', icon: CreditCard },
    { path: '/kasir/produk', label: 'Produk', icon: Package },
    { path: '/kasir/antrean-wa', label: 'Antrean WA', icon: MessageCircle, badge: waOrderCount },
    { path: '/kasir/riwayat', label: 'Riwayat', icon: History },
    { path: '/kasir/shift', label: 'Kas & Shift', icon: Wallet },
    { path: '/kasir/ringkasan-shift-v2', label: 'Ringkasan', icon: BellRing },
    { path: '/kasir/pengaturan-wa', label: 'Pengaturan WA', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between gap-4 px-6">
      {/* Kiri: Title and Sub-Tabs */}
      <div className="flex items-center gap-6 flex-1 min-w-0">
        <Link to="/kasir/terminal" className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
            <CreditCard size={18} />
          </div>
          <span className="font-extrabold text-slate-800 text-base tracking-tight hidden md:inline-block">
            Kasir Terminal
          </span>
        </Link>

        {/* Desktop Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-full">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                <Icon size={14} />
                <span>{link.label}</span>
                {link.badge > 0 && (
                  <span className="ml-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-black leading-none">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Kanan: Shift status, Shortcuts, Jam, Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Shift status badge */}
        {shiftAktif ? (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span>Shift: {shiftAktif.kasir_name || 'Aktif'}</span>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
            <span>Shift Belum Dibuka</span>
          </div>
        )}

        {/* Jam */}
        <div className="hidden sm:flex items-center px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 select-none">
          <span
            className="font-mono font-black text-xs tracking-widest leading-none"
            style={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {liveTime}
          </span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-8 w-px bg-slate-200" />

        {/* User Account Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile((v) => !v)}
            className="flex items-center gap-2.5 cursor-pointer group outline-none"
          >
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">
                {user?.username || 'User'}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {user?.role || 'staff'}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0 border-2 border-slate-200 shadow-sm group-hover:border-blue-400 transition-colors">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-blue-700 font-black text-base">
                  {(user?.username || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden py-1 animate-scale-up">
              <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 text-left">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Masuk sebagai</p>
                <p className="text-sm font-black text-slate-700 truncate capitalize">
                  {user?.username}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowProfile(false);
                  navigate('/profile');
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left cursor-pointer"
              >
                <UserCheck size={14} className="text-slate-400" />
                <span>Pengaturan Profil</span>
              </button>
              <button
                onClick={() => {
                  setShowProfile(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left border-t border-slate-100 cursor-pointer"
              >
                <LogOut size={14} className="text-rose-500" />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
