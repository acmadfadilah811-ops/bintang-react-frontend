import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import AttendanceSessionManager from '../components/dashboard/AttendanceSessionManager';
import {
  ShoppingCart,
  Package,
  Users,
  CalendarClock,
  MoreHorizontal,
  Circle,
  ClipboardList,
  Hourglass,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();

  // ── Absensi personal ──────────────────────────────────────
  const [personalAttendance, setPersonalAttendance] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // ── Stats admin ───────────────────────────────────────────
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClockOutModal, setShowClockOutModal] = useState(false);

  // Jam real-time
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchPersonalAttendance = async () => {
    try {
      const res = await apiClient.get('/hr/dashboard/staff/');
      setPersonalAttendance(res.data);
    } catch (err) {
      console.error('Gagal mengambil status absensi:', err);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [ordersRes, inventoryRes, customersRes] = await Promise.allSettled([
          apiClient.get('/orders/?limit=6'),
          apiClient.get('/inventory/?limit=1'),
          apiClient.get('/customers/?limit=1'),
        ]);

        // Recent orders
        if (ordersRes.status === 'fulfilled') {
          const raw = ordersRes.value.data;
          const list = Array.isArray(raw) ? raw : raw?.results || [];
          setRecentOrders(list.slice(0, 6));

          // Hitung stat dari data orders
          const today = new Date().toISOString().split('T')[0];
          const todayOrders = list.filter((o) => o.waktu?.startsWith(today));
          const pending = list.filter((o) => o.status_global === 'review');

          setStats((prev) => ({
            ...prev,
            total_order_hari_ini: todayOrders.length,
            order_pending: pending.length,
            total_order: raw?.count || list.length,
          }));
        }

        if (inventoryRes.status === 'fulfilled') {
          const raw = inventoryRes.value.data;
          setStats((prev) => ({ ...prev, total_inventori: raw?.count || 0 }));
        }

        if (customersRes.status === 'fulfilled') {
          const raw = customersRes.value.data;
          setStats((prev) => ({ ...prev, total_pelanggan: raw?.count || 0 }));
        }
      } catch (err) {
        console.error('Error fetching admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    fetchPersonalAttendance();
  }, []);

  const handleClockIn = async () => {
    try {
      setActionLoading(true);
      await apiClient.post('/hr/absensi/clock-in/', { catatan: '' });
      await fetchPersonalAttendance();
    } catch (err) {
      alert(err.response?.data?.detail || 'Gagal Clock-In');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setActionLoading(true);
      await apiClient.post('/hr/absensi/clock-out/', { catatan: '' });
      await fetchPersonalAttendance();
    } catch (err) {
      alert(err.response?.data?.detail || 'Gagal Clock-Out');
    } finally {
      setActionLoading(false);
      setShowClockOutModal(false);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
    if (diff < 1) return 'baru saja';
    if (diff < 60) return `${diff} mnt lalu`;
    if (diff < 1440) return `${Math.floor(diff / 60)} jam lalu`;
    return `${Math.floor(diff / 1440)} hari lalu`;
  };

  const getStatusStyle = (status) => {
    const map = {
      review: 'bg-blue-50 text-blue-600 border-blue-200',
      desain: 'bg-purple-50 text-purple-600 border-purple-200',
      proses: 'bg-amber-50 text-amber-600 border-amber-200',
      ready: 'bg-teal-50 text-teal-600 border-teal-200',
      selesai: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      batal: 'bg-red-50 text-red-600 border-red-200',
    };
    return map[status] || 'bg-slate-50 text-slate-500 border-slate-200';
  };

  const getStatusLabel = (status) => {
    const map = {
      review: 'Menunggu Review',
      desain: 'Proses Desain',
      proses: 'Proses Produksi',
      ready: 'Siap Diambil',
      selesai: 'Selesai',
      batal: 'Dibatalkan',
    };
    return map[status] || status;
  };

  const absensiHariIni = personalAttendance?.absensi_hari_ini;
  const sudahClockIn = absensiHariIni && absensiHariIni.status !== 'belum_absen';
  const sudahClockOut = !!absensiHariIni?.jam_keluar;

  // Stat cards
  const statCards = [
    {
      label: 'Order Hari Ini',
      value: loading ? '...' : (stats?.total_order_hari_ini ?? 0),
      icon: ShoppingCart,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      badge: 'Aktif',
      badgeColor: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Pending Review',
      value: loading ? '...' : (stats?.order_pending ?? 0),
      icon: Hourglass,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      badge: 'Butuh tindakan',
      badgeColor: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Item Inventori',
      value: loading ? '...' : (stats?.total_inventori ?? 0),
      icon: Package,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      badge: 'Total',
      badgeColor: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Pelanggan',
      value: loading ? '...' : (stats?.total_pelanggan ?? 0),
      icon: Users,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      badge: 'Terdaftar',
      badgeColor: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="space-y-5 w-full">
      {/* ── HEADER SELAMAT DATANG ──────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Selamat Datang, <span className="text-indigo-600 capitalize">{user?.username}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            {currentTime.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-2xl font-black text-slate-800 tabular-nums leading-none">
            {currentTime.toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-widest">
            Waktu Lokal
          </p>
        </div>
      </div>

      {/* ── BARIS 1: STAT CARDS ───────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}
                >
                  <Icon size={18} className={card.iconColor} />
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${card.badgeColor}`}
                >
                  {card.badge}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                  {card.label}
                </p>
                <p className="text-2xl font-extrabold text-slate-800 leading-none">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── BARIS 2: ABSENSI + SESI + WA PANEL ────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* KIRI (8 kolom): Absensi + Recent Orders */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          {/* Absensi Personal + Sesi Manager side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Widget Absensi Personal */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between min-h-[200px]">
              <div>
                <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <CalendarClock size={12} className="text-indigo-500" /> Kehadiran Saya
                    </p>
                    <h3
                      className={`text-lg font-black mt-1 uppercase ${
                        !sudahClockIn
                          ? 'text-amber-600'
                          : sudahClockOut
                            ? 'text-slate-500'
                            : 'text-emerald-600'
                      }`}
                    >
                      {!sudahClockIn ? 'Belum Masuk' : absensiHariIni?.status}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {absensiHariIni?.jam_masuk
                    ? `Masuk pukul ${new Date(absensiHariIni.jam_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.${sudahClockOut ? ` Keluar pukul ${new Date(absensiHariIni.jam_keluar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.` : ''}`
                    : 'Lakukan Clock In sebelum mulai bekerja hari ini.'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleClockIn}
                  disabled={sudahClockIn || actionLoading}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    sudahClockIn
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  Clock In
                </button>
                <button
                  onClick={() => setShowClockOutModal(true)}
                  disabled={!sudahClockIn || sudahClockOut || actionLoading}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    !sudahClockIn || sudahClockOut
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-rose-500 hover:bg-rose-600 text-white'
                  }`}
                >
                  Clock Out
                </button>
              </div>
            </div>

            {/* Sesi Absensi (Admin hanya bisa lihat, tidak bisa edit) */}
            <AttendanceSessionManager />
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList size={14} className="text-indigo-500" /> Pesanan Terbaru
              </h2>
              <button className="text-slate-300 hover:text-slate-500">
                <MoreHorizontal size={16} />
              </button>
            </div>

            <div className="divide-y divide-slate-50">
              {recentOrders.length > 0 ? (
                recentOrders.map((order, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-sm">
                      {(order.nama || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                          {order.nama || 'Pelanggan'}
                        </p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                          {formatTimeAgo(order.waktu)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {order.id} · {order.items?.length || 0} item
                      </p>
                      <span
                        className={`inline-flex items-center mt-1.5 gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wide ${getStatusStyle(order.status_global)}`}
                      >
                        <Circle size={5} className="fill-current" />
                        {getStatusLabel(order.status_global)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                  <ShoppingCart size={28} strokeWidth={1.5} />
                  <p className="text-sm mt-2 font-medium">Belum ada pesanan</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KANAN (4 kolom): Ringkasan & Shortcut */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {/* Quick Stats */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ClipboardList size={12} className="text-indigo-500" /> Ringkasan Pesanan
            </h3>
            <div className="space-y-2">
              {[
                {
                  label: 'Order Hari Ini',
                  value: loading ? '...' : (stats?.total_order_hari_ini ?? 0),
                  color: 'text-blue-600 bg-blue-50',
                },
                {
                  label: 'Pending Review',
                  value: loading ? '...' : (stats?.order_pending ?? 0),
                  color: 'text-amber-600 bg-amber-50',
                },
                {
                  label: 'Total Order',
                  value: loading ? '...' : (stats?.total_order ?? 0),
                  color: 'text-slate-600 bg-slate-50',
                },
                {
                  label: 'Item Inventori',
                  value: loading ? '...' : (stats?.total_inventori ?? 0),
                  color: 'text-emerald-600 bg-emerald-50',
                },
                {
                  label: 'Total Pelanggan',
                  value: loading ? '...' : (stats?.total_pelanggan ?? 0),
                  color: 'text-purple-600 bg-purple-50',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <span className="text-xs text-slate-600 font-medium">{item.label}</span>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${item.color}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    {/* MODAL KONFIRMASI CLOCK OUT CUSTOM (PREMIUM STYLE) */}
      {showClockOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col animate-scale-up text-left">
            {/* Header / Ikon Peringatan */}
            <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-8 flex flex-col items-center text-center text-white relative">
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setShowClockOutModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <ArrowLeft size={18} className="rotate-95" />
                </button>
              </div>
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/20 mb-3 shadow-inner">
                <CalendarClock size={32} className="text-white" />
              </div>
              <h3 className="font-extrabold text-lg tracking-wide uppercase">Konfirmasi Keluar Jam Kerja</h3>
              <p className="text-xs text-rose-100 mt-1">Sistem Absensi &amp; Kepegawaian Bintang Advertising</p>
            </div>

            {/* Konten Detail Peringatan */}
            <div className="px-6 py-6 space-y-4">
              <div className="flex gap-3 items-start bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div className="text-xs text-amber-800 leading-relaxed font-medium">
                  <span className="font-extrabold block text-amber-900 mb-1">⚠️ PERINGATAN PENTING:</span>
                  Setelah menekan tombol Clock-Out, akses Anda ke <strong>Papan Produksi (Kanban Kerja) akan otomatis TERKUNCI</strong> untuk hari ini.
                </div>
              </div>

              <div className="text-xs text-slate-500 leading-relaxed text-center">
                Apakah Anda yakin telah menyelesaikan semua tugas admin hari ini dan ingin melakukan Clock-Out?
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="px-6 pb-6 pt-2 flex flex-col gap-2">
              <button
                onClick={handleClockOut}
                disabled={actionLoading}
                className="w-full bg-[#f0442c] hover:bg-[#d32f2f] text-white font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer text-sm disabled:opacity-50"
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Ya, Clock-Out Sekarang</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowClockOutModal(false)}
                disabled={actionLoading}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all cursor-pointer text-sm text-center disabled:opacity-50"
              >
                Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
