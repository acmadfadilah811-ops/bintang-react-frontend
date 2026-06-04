import {
  Search,
  Users,
  Circle,
  X,
  Globe,
  Square,
  Minimize,
  ExternalLink,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Music,
  BellRing,
  Sparkles,
  UserCheck,
  AlertCircle,
  Volume2,
  LayoutDashboard,
  ShoppingCart,
  Kanban,
  Layers,
  Package,
  Briefcase,
  CalendarClock,
  DollarSign,
  BookOpen,
  Bell,
  Settings,
  LogOut,
  Grid,
  ChevronRight,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDynamicIsland } from '../context/DynamicIslandContext';
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
  '/payroll': 'Penggajian & BoM',
  '/buku-besar': 'Buku Besar',
  '/announcements': 'Pengumuman',
  '/profile': 'Profil Saya',
  '/settings': 'Pengaturan',
};

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, businessSettings, logout } = useAuth();

  // UI State Variables
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');

  const profileDropdownRef = useRef(null);
  const commandPaletteRef = useRef(null);

  const userRole = user?.role?.toLowerCase() || 'staff';

  const allCommands = [
    { label: 'Buka Dashboard', action: () => navigate(userRole === 'staff' ? '/staff-dashboard' : '/dashboard'), category: 'Navigasi' },
    { label: 'Buka Pesanan (CRM)', action: () => navigate('/orders'), category: 'Navigasi' },
    { label: 'Buka Papan Kerja (SPK)', action: () => navigate('/jobs'), category: 'Navigasi' },
    { label: 'Buka Kanban Produksi', action: () => navigate('/produksi'), category: 'Navigasi' },
    { label: 'Buka Pelanggan', action: () => navigate('/customers'), category: 'Navigasi' },
    { label: 'Buka Inventori', action: () => navigate('/inventory'), category: 'Navigasi' },
    { label: 'Buka Absensi', action: () => navigate('/attendance'), category: 'Navigasi' },
    { label: 'Buka Karyawan', action: () => navigate('/employees'), category: 'Navigasi' },
    { label: 'Buka Gaji & BoM', action: () => navigate('/payroll'), category: 'Navigasi' },
    { label: 'Buka Buku Besar', action: () => navigate('/buku-besar'), category: 'Navigasi' },
    { label: 'Buka Pengaturan', action: () => navigate('/settings'), category: 'Navigasi' },
    { label: 'Buka Pemutar Musik', action: () => { setShowMusicPlayer(true); setShowCommandPalette(false); }, category: 'Alat' },
    { label: 'Toggle Layar Penuh', action: () => { toggleFullscreen(); setShowCommandPalette(false); }, category: 'Alat' },
    { label: 'Keluar / Logout', action: () => { logout(); navigate('/login'); }, category: 'Akun' },
  ];

  const filteredCommands = allCommands.filter(cmd => {
    if (userRole === 'staff' && ['Buka Karyawan', 'Buka Gaji & BoM', 'Buka Buku Besar', 'Buka Pengaturan'].includes(cmd.label)) return false;
    if (userRole === 'admin' && ['Buka Karyawan', 'Buka Gaji & BoM', 'Buka Buku Besar'].includes(cmd.label)) return false;
    return cmd.label.toLowerCase().includes(commandQuery.toLowerCase());
  });
  const [currentDate, setCurrentDate] = useState('');
  const [liveTime, setLiveTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBrowserModal, setShowBrowserModal] = useState(false);
  const [browserUrl, setBrowserUrl] = useState('');
  const [showOnlineStaff, setShowOnlineStaff] = useState(false);
  const [onlineStaff, setOnlineStaff] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dropdownRef = useRef(null);

  // States & Context untuk Dynamic Island
  const {
    activeNotification,
    dismissNotification,
    musicPlaying,
    setMusicPlaying,
    currentTrackIndex,
    setCurrentTrackIndex,
    currentTrack,
    showMusicPlayer,
    setShowMusicPlayer,
    tracks,
  } = useDynamicIsland();

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [musicTab, setMusicTab] = useState('lofi'); // 'lofi' | 'youtube' | 'spotify'
  const [ytSearchQuery, setYtSearchQuery] = useState('');
  const [ytEmbedUrl, setYtEmbedUrl] = useState('https://www.youtube.com/embed/jfKfPfyJRdk');
  const [spotifyLink, setSpotifyLink] = useState('');
  const [spotifyEmbedUrl, setSpotifyEmbedUrl] = useState(
    'https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn?utm_source=generator&theme=0'
  );
  const searchInputRef = useRef(null);

  const handleYtSearch = () => {
    if (ytSearchQuery.trim()) {
      setYtEmbedUrl(
        `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(ytSearchQuery.trim())}`
      );
    }
  };

  const handleSpotifyLoad = () => {
    const link = spotifyLink.trim();
    if (!link) return;
    try {
      let cleanUrl = link;
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
      }
      const parsedUrl = new URL(cleanUrl);
      const paths = parsedUrl.pathname.split('/').filter(Boolean);
      if (paths.length >= 2) {
        const type = paths[0]; // playlist, track, album, artist
        const id = paths[1];
        setSpotifyEmbedUrl(
          `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`
        );
      } else {
        alert('Format URL Spotify tidak valid. Masukkan link share lagu/playlist dari Spotify.');
      }
    } catch {
      alert('Tolong masukkan URL Spotify yang valid.');
    }
  };

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  const getPageTitle = () =>
    PAGE_TITLES[location.pathname] || businessSettings?.nama_bisnis || 'Bintang Advertising';

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

  // Hotkeys listener untuk Command Palette (Ctrl+K atau Cmd+K) & Esc key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowProfileDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowOnlineStaff(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
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
    <header className="h-[72px] bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-4 md:px-8 z-30 shrink-0 sticky top-0">
      {/* Kiri: Judul & Tanggal */}
      <div className="flex flex-col justify-center min-w-0">
        <h1
          className="font-bold text-slate-800 leading-tight truncate text-xl md:text-[22px]"
          title={getPageTitle()}
        >
          {getPageTitle()}
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">{currentDate}</p>
      </div>

      {/* Tengah: Dynamic Island */}
      <div className="flex items-center justify-center flex-1 relative z-50 max-w-md mx-4">
        <style>{`
          @keyframes pulseBar {
            0%, 100% { height: 4px; transform: scaleY(1); }
            50% { height: 10px; transform: scaleY(1.4); }
          }
          .bar-1 { animation: pulseBar 1.4s ease-in-out infinite; }
          .bar-2 { animation: pulseBar 1.0s ease-in-out infinite 0.15s; }
          .bar-3 { animation: pulseBar 1.2s ease-in-out infinite 0.3s; }

          @keyframes ecgScroll {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-120px, 0, 0); }
          }
          .animate-ecg-scroll {
            animation: ecgScroll 4s linear infinite;
          }

          @keyframes scaleUp {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-scale-up {
            animation: scaleUp 0.18s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
        `}</style>

        {activeNotification ? (
          /* A. NOTIFICATION STATE */
          <div className="flex items-center gap-3 bg-slate-950 text-white py-2 rounded-3xl shadow-2xl border border-slate-800 animate-zoom-in w-full transition-all duration-300 max-w-[380px] px-4">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                activeNotification.type === 'announcement'
                  ? 'bg-blue-500/20 text-blue-400'
                  : activeNotification.type === 'job'
                    ? 'bg-purple-500/20 text-purple-400'
                    : activeNotification.type === 'attendance'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {activeNotification.type === 'announcement' && <BellRing size={16} />}
              {activeNotification.type === 'job' && <Sparkles size={16} />}
              {activeNotification.type === 'attendance' && <UserCheck size={16} />}
              {activeNotification.type === 'permission' && <AlertCircle size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black text-slate-200 tracking-wide uppercase leading-none truncate">
                {activeNotification.title}
              </div>
              <div className="text-[9px] text-slate-400 truncate leading-snug mt-0.5">
                {activeNotification.message}
              </div>
            </div>
            <button
              onClick={dismissNotification}
              className="text-slate-500 hover:text-white shrink-0 p-1"
            >
              <X size={12} />
            </button>
          </div>
        ) : isSearchExpanded ? (
          /* B. EXPANDED SEARCH STATE */
          <div className="flex items-center w-full bg-slate-950 px-4 py-1.5 rounded-full border border-slate-800 shadow-xl transition-all duration-300 max-w-[380px]">
            <Search size={14} className="text-slate-400 mr-2 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              onBlur={() => {
                // Shrink setelah delay singkat agar klik X sempat terdaftar
                setTimeout(() => setIsSearchExpanded(false), 200);
              }}
              placeholder="Cari Google... (Enter)"
              className="w-full bg-transparent text-white text-xs outline-none placeholder-slate-500 py-1"
            />
            <button
              onClick={() => setIsSearchExpanded(false)}
              className="text-slate-500 hover:text-white ml-2 shrink-0"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          /* C. IDLE / MUSIC STATE (UNIFIED PILL) */
          <div className="flex items-center justify-between bg-slate-950 text-white h-9 px-4 rounded-full border border-slate-800 shadow-md select-none gap-3 transition-all duration-300 w-[300px]">
            {/* Left: Search Trigger */}
            <div
              onClick={() => setIsSearchExpanded(true)}
              className="flex items-center gap-1.5 cursor-pointer group shrink-0"
              title="Klik untuk mencari Google"
            >
              <Search
                size={12}
                className="text-slate-400 group-hover:text-white transition-colors shrink-0"
              />
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors">
                Cari
              </span>
            </div>

            {/* Middle: ECG Heartbeat Waveform Bridge (Replacing divider, made longer & continuous) */}
            <div className="flex-1 flex items-center justify-center select-none pointer-events-none overflow-hidden relative h-4 max-w-[120px]">
              <div className="flex w-[240px] animate-ecg-scroll shrink-0">
                <svg
                  className="w-[120px] h-4 text-emerald-500/80 shrink-0"
                  viewBox="0 0 120 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M 0 8 H 20 L 23 2 L 26 14 L 29 8 H 60 L 63 2 L 66 14 L 69 8 H 100 L 103 2 L 106 14 L 109 8 H 120" />
                </svg>
                <svg
                  className="w-[120px] h-4 text-emerald-500/80 shrink-0"
                  viewBox="0 0 120 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M 0 8 H 20 L 23 2 L 26 14 L 29 8 H 60 L 63 2 L 66 14 L 69 8 H 100 L 103 2 L 106 14 L 109 8 H 120" />
                </svg>
              </div>
            </div>

            {/* Right: Music Trigger & Visualizer */}
            <div
              onClick={() => setShowMusicPlayer(true)}
              className="flex items-center gap-2 cursor-pointer group shrink-0"
              title="Buka Pemutar Musik"
            >
              <Music
                size={12}
                className={`shrink-0 transition-colors ${musicPlaying ? 'text-indigo-400 animate-pulse' : 'text-slate-400 group-hover:text-indigo-400'}`}
              />
              <span
                className={`text-[10px] font-bold transition-colors truncate max-w-[80px] ${musicPlaying ? 'text-indigo-300' : 'text-slate-400 group-hover:text-indigo-400'}`}
              >
                {musicPlaying ? 'Lofi Playing' : 'Musik'}
              </span>

              {/* Visualizer Bars (Animating when playing, Static when paused) */}
              <div className="flex items-end gap-0.5 h-3 ml-1 shrink-0">
                <span
                  className={`w-0.5 bg-indigo-400 rounded-full transition-all duration-300 ${musicPlaying ? 'bar-1' : 'h-1'}`}
                ></span>
                <span
                  className={`w-0.5 bg-indigo-400 rounded-full transition-all duration-300 ${musicPlaying ? 'bar-2' : 'h-2'}`}
                ></span>
                <span
                  className={`w-0.5 bg-indigo-400 rounded-full transition-all duration-300 ${musicPlaying ? 'bar-3' : 'h-1.5'}`}
                ></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Kanan: Notifikasi + Online Staff Dropdown + Profil */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Live Digital Clock */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 shadow-inner border border-slate-700 select-none">
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
          className="hidden sm:block p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
        >
          {isFullscreen ? <Minimize size={20} /> : <Square size={20} />}
        </button>

        {/* Online Staff Dropdown */}
        <div className="hidden sm:block relative" ref={dropdownRef}>
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
        <div className="hidden sm:block h-8 w-px bg-slate-200"></div>

        {/* Profil User */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-3 cursor-pointer group outline-none focus:outline-none"
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

          {/* Profile Dropdown Panel */}
          {showProfileDropdown && (
            <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden py-1 animate-scale-up">
              <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 text-left">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Halo,</p>
                <p className="text-sm font-black text-slate-700 truncate capitalize">{user?.username}</p>
              </div>

              <button
                onClick={() => {
                  setShowProfileDropdown(false);
                  navigate('/profile');
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left cursor-pointer"
              >
                <UserCheck size={14} className="text-slate-405 text-slate-400" />
                <span>Pengaturan Profil</span>
              </button>

              <button
                onClick={() => {
                  setShowProfileDropdown(false);
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
      {/* 4. Glassmorphism Music Player Modal */}
      {showMusicPlayer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900/90 text-white border border-slate-800 rounded-[32px] p-6 w-[320px] shadow-2xl flex flex-col items-center relative overflow-hidden">
            {/* Background glowing aura */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header */}
            <div className="w-full flex items-center justify-between mb-4 z-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pusat Musik Lofi
              </span>
              <button
                onClick={() => setShowMusicPlayer(false)}
                className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-950/80 p-1 rounded-xl w-full gap-1 mb-4 z-10 border border-slate-800">
              {[
                { id: 'lofi', label: 'Lofi Lokal' },
                { id: 'youtube', label: 'YouTube' },
                { id: 'spotify', label: 'Spotify' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setMusicTab(tab.id);
                    if (tab.id !== 'lofi') {
                      // Hentikan pemutar lokal agar tidak bertumpuk
                      setMusicPlaying(false);
                    }
                  }}
                  className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg capitalize transition ${
                    musicTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {musicTab === 'lofi' && (
              <>
                {/* Vinyl Record */}
                <div className="relative my-2 flex items-center justify-center z-10">
                  <div
                    className={`w-28 h-28 rounded-full bg-slate-950 border-4 border-slate-800 flex items-center justify-center shadow-lg relative ${musicPlaying ? 'animate-spin' : ''}`}
                    style={{ animationDuration: '12s' }}
                  >
                    {/* Center label */}
                    <div className="w-9 h-9 rounded-full bg-indigo-600 border border-slate-950 flex items-center justify-center overflow-hidden">
                      <img
                        src={currentTrack.cover}
                        alt=""
                        className="w-full h-full object-cover opacity-80"
                      />
                    </div>
                    <div className="w-2 h-2 rounded-full bg-slate-950 absolute"></div>
                  </div>
                </div>

                {/* Track Info */}
                <div className="text-center w-full z-10 mb-2">
                  <h3 className="font-extrabold text-xs text-white truncate px-2">
                    {currentTrack.title}
                  </h3>
                  <p className="text-[9px] text-indigo-300 font-semibold mt-0.5">
                    {currentTrack.artist}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-5 z-10 mb-4">
                  <button
                    onClick={() => {
                      setCurrentTrackIndex((prev) => (prev === 0 ? 2 : prev - 1));
                      setMusicPlaying(true);
                    }}
                    className="text-slate-400 hover:text-white transition active:scale-95"
                  >
                    <SkipBack size={16} />
                  </button>

                  <button
                    onClick={() => setMusicPlaying(!musicPlaying)}
                    className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg transition active:scale-90"
                  >
                    {musicPlaying ? (
                      <Pause size={16} fill="currentColor" />
                    ) : (
                      <Play size={16} fill="currentColor" className="ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setCurrentTrackIndex((prev) => (prev === 2 ? 0 : prev + 1));
                      setMusicPlaying(true);
                    }}
                    className="text-slate-400 hover:text-white transition active:scale-95"
                  >
                    <SkipForward size={16} />
                  </button>
                </div>

                {/* Song list selection */}
                <div className="w-full z-10 bg-slate-950/40 rounded-xl p-2 border border-slate-800/60 max-h-32 overflow-y-auto">
                  <div className="space-y-1">
                    {(tracks || []).map((trackItem, index) => {
                      const isCurrent = currentTrackIndex === index;
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setCurrentTrackIndex(index);
                            setMusicPlaying(true);
                          }}
                          className={`w-full text-left px-2 py-1 rounded-lg text-[9px] font-semibold flex items-center justify-between transition ${
                            isCurrent
                              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/20'
                              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                          }`}
                        >
                          <span className="truncate">{trackItem.title}</span>
                          {isCurrent && musicPlaying && (
                            <Volume2 size={10} className="text-indigo-400 animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {musicTab === 'youtube' && (
              <div className="w-full z-10 flex flex-col items-center animate-fade-in">
                {/* Kolom Pencarian Musik YouTube */}
                <div className="flex gap-1.5 w-full mb-3">
                  <input
                    type="text"
                    value={ytSearchQuery}
                    onChange={(e) => setYtSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleYtSearch();
                    }}
                    placeholder="Cari lagu/lofi di YouTube..."
                    className="flex-1 bg-slate-950 text-white text-[11px] px-3 py-1.5 rounded-xl border border-slate-800 outline-none placeholder-slate-500"
                  />
                  <button
                    onClick={handleYtSearch}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl transition shrink-0"
                  >
                    Cari
                  </button>
                </div>

                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-black mb-3">
                  <iframe
                    src={ytEmbedUrl}
                    title="YouTube Music Player"
                    className="w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <p className="text-[9px] text-slate-400 text-center leading-relaxed mb-4">
                  Hasil pencarian YouTube diputar langsung di atas.
                </p>
                <button
                  onClick={() => setMusicPlaying(!musicPlaying)}
                  className={`w-full py-2 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-2 border ${
                    musicPlaying
                      ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/20'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Music size={12} className={musicPlaying ? 'animate-spin' : ''} />
                  {musicPlaying
                    ? 'Matikan Efek Visualizer Island'
                    : 'Aktifkan Efek Visualizer Island'}
                </button>
              </div>
            )}

            {musicTab === 'spotify' && (
              <div className="w-full z-10 flex flex-col items-center animate-fade-in">
                {/* Kolom Link Musik Spotify */}
                <div className="flex gap-1.5 w-full mb-3">
                  <input
                    type="text"
                    value={spotifyLink}
                    onChange={(e) => setSpotifyLink(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSpotifyLoad();
                    }}
                    placeholder="Tempel link share lagu/playlist Spotify..."
                    className="flex-1 bg-slate-950 text-white text-[11px] px-3 py-1.5 rounded-xl border border-slate-800 outline-none placeholder-slate-500"
                  />
                  <button
                    onClick={handleSpotifyLoad}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl transition shrink-0"
                  >
                    Putar
                  </button>
                </div>

                <div className="w-full h-[180px] rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950 mb-3">
                  <iframe
                    src={spotifyEmbedUrl}
                    width="100%"
                    height="180"
                    frameBorder="0"
                    allowFullScreen=""
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="border-none"
                  ></iframe>
                </div>
                <p className="text-[9px] text-slate-400 text-center leading-relaxed mb-4">
                  Tempel link Spotify dari aplikasi Spotify untuk memutar.
                </p>
                <button
                  onClick={() => setMusicPlaying(!musicPlaying)}
                  className={`w-full py-2 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-2 border ${
                    musicPlaying
                      ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/20'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Music size={12} className={musicPlaying ? 'animate-spin' : ''} />
                  {musicPlaying
                    ? 'Matikan Efek Visualizer Island'
                    : 'Aktifkan Efek Visualizer Island'}
                </button>
              </div>
            )}

            {/* Minimise button */}
            <button
              onClick={() => setShowMusicPlayer(false)}
              className="mt-4 text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition tracking-wider"
            >
              Simpan ke Dynamic Island
            </button>
          </div>
        </div>
      )}

      {/* Command Palette Overlay */}
      {showCommandPalette && (
        <div 
          className="fixed inset-0 z-[110] flex justify-center bg-slate-950/60 backdrop-blur-sm p-4 pt-[10vh]"
          onClick={() => setShowCommandPalette(false)}
        >
          <div 
            className="bg-white/95 border border-slate-200/50 rounded-3xl max-w-lg w-full shadow-2xl flex flex-col overflow-hidden max-h-[400px] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
            ref={commandPaletteRef}
          >
            {/* Input Search */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder="Ketik menu atau aksi cepat... (Esc untuk batal)"
                className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder-slate-400"
                autoFocus
              />
              <span className="text-[10px] font-bold text-slate-400 border border-slate-200 bg-white px-2 py-0.5 rounded shadow-sm">ESC</span>
            </div>

            {/* List Commands */}
            <div className="flex-1 overflow-y-auto py-2 divide-y divide-slate-100">
              {filteredCommands.length > 0 ? (
                Object.entries(
                  filteredCommands.reduce((acc, cmd) => {
                    if (!acc[cmd.category]) acc[cmd.category] = [];
                    acc[cmd.category].push(cmd);
                    return acc;
                  }, {})
                ).map(([category, cmds]) => (
                  <div key={category} className="py-2">
                    <p className="px-4 py-1 text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest bg-slate-50/20">{category}</p>
                    {cmds.map((cmd, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          cmd.action();
                          setShowCommandPalette(false);
                          setCommandQuery('');
                        }}
                        className="w-full flex items-center justify-between px-6 py-2 hover:bg-indigo-50/40 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors text-left cursor-pointer"
                      >
                        <span>{cmd.label}</span>
                        <ChevronRight size={12} className="text-indigo-600" />
                      </button>
                    ))}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs font-semibold">
                  Tidak ada perintah atau menu yang cocok
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
