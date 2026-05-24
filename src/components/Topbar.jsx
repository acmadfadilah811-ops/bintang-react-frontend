import { Search, Users, Circle, X, Globe, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import apiClient from '../api/apiClient';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/staff-dashboard': 'Dashboard',
  '/orders': 'Pesanan',
  '/customers': 'Pelanggan',
  '/inventory': 'Inventaris',
  '/jobs': 'Papan Produksi',
  '/attendance': 'Absensi',
  '/employees': 'Karyawan',
  '/buku-besar': 'Buku Besar',
  '/announcements': 'Pengumuman',
  '/profile': 'Profil Saya',
  '/settings': 'Pengaturan',
};

export default function Topbar() {
  const location = useLocation();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState('');
  const [liveTime, setLiveTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBrowserModal, setShowBrowserModal] = useState(false);
  const [browserUrl, setBrowserUrl] = useState('');
  const [showOnlineStaff, setShowOnlineStaff] = useState(false);
  const [onlineStaff, setOnlineStaff] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dropdownRef = useRef(null);

  const getPageTitle = () => PAGE_TITLES[location.pathname] || 'Bintang Advertising';

  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const apiBase = (import.meta.env.VITE_API_URL || 'https://bintang-adv.duckdns.org/api').replace(
      '/api',
      ''
    );
    return `${apiBase}${path}`;
  };

  useEffect(() => {
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('id-ID', dateOptions));
  }, []);

  // Live clock — update setiap detik
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setLiveTime(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Monitor status fullscreen browser
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Gagal masuk mode fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Fetch online staff saat dropdown dibuka
  useEffect(() => {
    if (showOnlineStaff && !onlineStaff) {
      apiClient
        .get('/users/online/')
        .then((res) => setOnlineStaff(res.data))
        .catch((err) => console.error('Gagal memuat online staff:', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOnlineStaff]);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowOnlineStaff(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const avatarUrl = getAvatarUrl(user?.foto_profil);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // Menggunakan parameter igu=1 agar Google (terkadang) mengizinkan iframe embedding
      setBrowserUrl(
        `https://www.google.com/search?igu=1&q=${encodeURIComponent(searchQuery.trim())}`
      );
      setShowBrowserModal(true);
      setSearchQuery('');
    }
  };

  return (
    <header className="h-[72px] bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-6 md:px-8 z-30 shrink-0 sticky top-0">
      {/* Kiri: Judul & Tanggal */}
      <div className="flex flex-col justify-center">
        <h1 className="text-xl md:text-[22px] font-bold text-slate-800 leading-tight">
          {getPageTitle()}
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">{currentDate}</p>
      </div>

      {/* Tengah: Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Cari di Google... (Enter)"
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm text-slate-700 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Kanan: Notifikasi + Online Staff Dropdown + Profil */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Live Digital Clock (menggantikan Bell) */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 shadow-inner border border-slate-700 select-none">
          <span
            className="font-mono font-black tracking-widest text-sm leading-none"
            style={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: 'none',
              letterSpacing: '0.12em',
            }}
          >
            {liveTime.slice(0, 5)}
          </span>
          <span
            className="font-mono font-bold text-[10px] leading-none"
            style={{
              background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            :{liveTime.slice(6)}
          </span>
        </div>

        {/* Tombol Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>

        {/* Online Staff Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowOnlineStaff(!showOnlineStaff)}
            className="relative p-2 text-slate-400 hover:text-emerald-600 transition-colors rounded-full hover:bg-emerald-50"
            title="Status Online Staff"
          >
            <Users size={20} />
            {onlineStaff?.total_online > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full border border-white animate-pulse"></span>
            )}
          </button>

          {/* Dropdown Panel */}
          {showOnlineStaff && (
            <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-emerald-600" />
                  <span className="text-sm font-bold text-slate-700">Status Staff Online</span>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  {onlineStaff?.total_online || 0}/{onlineStaff?.total_staff || 0}
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {onlineStaff?.staff?.length > 0 ? (
                  onlineStaff.staff.map((staff, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 overflow-hidden border border-slate-200">
                          {staff.foto_profil ? (
                            <img
                              src={getAvatarUrl(staff.foto_profil)}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                          ) : (
                            staff.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${staff.is_online ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        ></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 capitalize truncate">
                          {staff.username}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider truncate">
                          {staff.divisi_nama || staff.role}
                        </p>
                      </div>
                      <Circle
                        size={8}
                        className={
                          staff.is_online
                            ? 'fill-emerald-500 text-emerald-500'
                            : 'fill-slate-300 text-slate-300'
                        }
                      />
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-slate-400 text-sm">
                    {onlineStaff === null ? 'Memuat...' : 'Tidak ada data staff'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-slate-200"></div>

        {/* Profil User */}
        <div className="flex items-center gap-3 cursor-pointer group">
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
        </div>
      </div>

      {/* Internal Browser Modal */}
      {showBrowserModal && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="m-4 md:m-8 flex-1 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header (Browser Tab) */}
            <div className="h-12 bg-slate-100 border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-blue-500" />
                <span className="text-sm font-bold text-slate-700">Internal Browser</span>
                <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200 ml-2 truncate max-w-[200px] md:max-w-md hidden sm:block">
                  {browserUrl}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(browserUrl, '_blank')}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Buka di Tab Baru"
                >
                  <ExternalLink size={16} />
                </button>
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button
                  onClick={() => setShowBrowserModal(false)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Tutup Browser"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Iframe Content */}
            <div className="flex-1 bg-white relative">
              <iframe
                src={browserUrl}
                className="w-full h-full border-none absolute inset-0"
                title="Internal Browser"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
