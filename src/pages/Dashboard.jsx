import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingCart,
  TrendingUp,
  Package,
  Users,
  Crown,
  Trophy,
  Medal,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Circle,
  Activity,
  CalendarClock,
} from 'lucide-react';
import AttendanceSessionManager from '../components/dashboard/AttendanceSessionManager';

export default function Dashboard() {
  const { user } = useAuth();
  const isOwner = user?.role?.toLowerCase() === 'owner';

  const [data, setData] = useState(null);
  const [onlineStaff, setOnlineStaff] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [personalAttendance, setPersonalAttendance] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update jam real-time setiap detik
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchPersonalAttendance = async () => {
    if (isOwner) return;
    try {
      const res = await apiClient.get('/hr/dashboard/staff/');
      setPersonalAttendance(res.data);
    } catch (err) {
      console.error('Gagal mengambil status absensi personal:', err);
    }
  };

  const playNotificationSound = (filename) => {
    try {
      const audioBaseUrl = import.meta.env.VITE_AUDIO_BASE_URL || '/audio';
      const audio = new Audio(`${audioBaseUrl}/${filename}`);
      audio.play().catch((e) => console.log('Autoplay blocked:', e));
    } catch (error) {
      console.log('Gagal memutar audio', error);
    }
  };

  const handleClockIn = async () => {
    try {
      setActionLoading(true);
      await apiClient.post('/hr/absensi/clock-in/', { catatan: '' });
      playNotificationSound('checkin.mp3');
      await fetchPersonalAttendance();
    } catch (err) {
      alert(err.response?.data?.detail || 'Gagal melakukan Clock-In');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!window.confirm('Apakah Anda yakin ingin mengakhiri jam kerja hari ini?')) return;
    try {
      setActionLoading(true);
      await apiClient.post('/hr/absensi/clock-out/', { catatan: '' });
      playNotificationSound('selesai.mp3');
      await fetchPersonalAttendance();
    } catch (err) {
      alert(err.response?.data?.detail || 'Gagal melakukan Clock-Out');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      apiClient.get('/dashboard/'),
      apiClient.get('/users/online/'),
      apiClient.get('/orders/?limit=6'),
    ])
      .then(([dashRes, staffRes, ordersRes]) => {
        setData(dashRes.data);
        setOnlineStaff(staffRes.data);
        const orders = Array.isArray(ordersRes.data)
          ? ordersRes.data
          : ordersRes.data?.results || [];
        setRecentOrders(orders.slice(0, 6));
      })
      .catch((err) => console.error('Error fetching dashboard:', err))
      .finally(() => setLoading(false));

    if (!isOwner) {
      fetchPersonalAttendance();
    }
  }, [isOwner]);

  const formatRupiah = (angka) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(angka || 0);

  const formatTimeAgo = (isoString) => {
    if (!isoString) return '';
    const diff = Math.floor((Date.now() - new Date(isoString)) / 60000);
    if (diff < 1) return 'Baru saja';
    if (diff < 60) return `${diff} mnt lalu`;
    const h = Math.floor(diff / 60);
    if (h < 24) return `${h} jam lalu`;
    return `${Math.floor(h / 24)} hr lalu`;
  };

  const getStatusStyle = (status) => {
    const map = {
      review: 'bg-blue-50 text-blue-600 border-blue-200',
      proses: 'bg-amber-50 text-amber-600 border-amber-200',
      selesai: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      batal: 'bg-red-50 text-red-600 border-red-200',
    };
    return map[status] || 'bg-slate-50 text-slate-500 border-slate-200';
  };

  if (loading)
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-semibold tracking-widest uppercase">
            Memuat Dashboard...
          </p>
        </div>
      </div>
    );

  const omsetBulan = data?.omset_6_bulan || [];
  const totalOmsetSemua = omsetBulan.reduce((sum, item) => sum + item.total, 0) || 1;
  const chartColors = ['#4318FF', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

  let currentPct = 0;
  const donutGradient = omsetBulan
    .map((item, idx) => {
      const start = currentPct;
      const end = start + (item.total / totalOmsetSemua) * 100;
      currentPct = end;
      return `${chartColors[idx % chartColors.length]} ${start}% ${end}%`;
    })
    .join(', ');

  // ── STAT CARDS DATA ───────────────────────────────────────────
  const statCards = [
    {
      label: 'Total Omset',
      value: formatRupiah(data?.omset_bulan_ini),
      badge: '+12%',
      badgeUp: true,
      icon: TrendingUp,
      iconBg: 'bg-white/20',
      iconColor: 'text-white',
      gradient: true,
    },
    {
      label: 'Pelanggan Baru',
      value: data?.total_pelanggan || onlineStaff?.total_staff || 0,
      badge: '+20%',
      badgeUp: true,
      icon: Users,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-500',
      gradient: false,
    },
    {
      label: 'Total Order',
      value: data?.total_order_bulan_ini || 0,
      badge: '-5%',
      badgeUp: false,
      icon: ShoppingCart,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-500',
      gradient: false,
    },
    {
      label: 'Order Hari Ini',
      value: data?.total_order_hari_ini || 0,
      badge: '+35%',
      badgeUp: true,
      icon: Package,
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-500',
      gradient: false,
    },
  ];

  return (
    <div className="space-y-5 w-full">
      {/* ── BARIS 1: STAT CARDS ─────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md
                ${
                  card.gradient
                    ? 'bg-gradient-to-br from-[#4318FF] to-[#6B49FF] text-white'
                    : 'bg-white border border-slate-100 text-slate-800'
                }`}
            >
              {/* Header: Icon + More */}
              <div className="flex items-start justify-between">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}
                >
                  <Icon size={18} className={card.iconColor} />
                </div>
                <button
                  className={`${card.gradient ? 'text-white/60 hover:text-white' : 'text-slate-300 hover:text-slate-500'} transition-colors`}
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>

              {/* Value */}
              <div>
                <p
                  className={`text-[11px] font-semibold uppercase tracking-widest mb-1 ${card.gradient ? 'text-indigo-200' : 'text-slate-400'}`}
                >
                  {card.label}
                </p>
                <div className="flex items-end justify-between gap-2">
                  <h3
                    className={`text-2xl font-extrabold leading-none ${card.gradient ? 'text-white' : 'text-slate-800'}`}
                  >
                    {card.value}
                  </h3>
                  <span
                    className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap
                    ${
                      card.badgeUp
                        ? card.gradient
                          ? 'bg-white/20 text-white'
                          : 'bg-emerald-50 text-emerald-600'
                        : 'bg-red-50 text-red-500'
                    }`}
                  >
                    {card.badgeUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {card.badge}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── BARIS 2: CHART + RECENT ORDERS ──────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* KIRI: Analytics (8 kolom) */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          {/* Sesi Absensi & Absensi Personal untuk Bawahan Owner */}
          {!isOwner ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Widget Absensi Personal */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <CalendarClock size={12} className="text-indigo-500" /> Kehadiran Saya
                      </p>
                      <h3
                        className={`text-lg font-black mt-1 uppercase ${
                          !personalAttendance?.absensi_hari_ini ||
                          personalAttendance?.absensi_hari_ini?.status === 'belum_absen'
                            ? 'text-amber-600'
                            : personalAttendance?.absensi_hari_ini?.jam_keluar
                              ? 'text-slate-500'
                              : 'text-emerald-600'
                        }`}
                      >
                        {!personalAttendance?.absensi_hari_ini ||
                        personalAttendance?.absensi_hari_ini?.status === 'belum_absen'
                          ? 'Belum Masuk'
                          : personalAttendance?.absensi_hari_ini?.status}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-slate-800 tracking-tight tabular-nums leading-none">
                        {currentTime.toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-550 leading-relaxed mb-4">
                    {personalAttendance?.absensi_hari_ini?.jam_masuk
                      ? `Anda masuk kerja pada pukul ${new Date(personalAttendance.absensi_hari_ini.jam_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.`
                      : 'Pastikan Anda melakukan Clock In sebelum memulai pekerjaan hari ini.'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleClockIn}
                    disabled={
                      (personalAttendance?.absensi_hari_ini &&
                        personalAttendance?.absensi_hari_ini?.status !== 'belum_absen') ||
                      actionLoading
                    }
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer
                      ${
                        personalAttendance?.absensi_hari_ini &&
                        personalAttendance?.absensi_hari_ini?.status !== 'belum_absen'
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      }`}
                  >
                    Clock In
                  </button>
                  <button
                    onClick={handleClockOut}
                    disabled={
                      !personalAttendance?.absensi_hari_ini ||
                      personalAttendance?.absensi_hari_ini?.status === 'belum_absen' ||
                      personalAttendance?.absensi_hari_ini?.jam_keluar ||
                      actionLoading
                    }
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer
                      ${
                        !personalAttendance?.absensi_hari_ini ||
                        personalAttendance?.absensi_hari_ini?.status === 'belum_absen' ||
                        personalAttendance?.absensi_hari_ini?.jam_keluar
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-rose-500 hover:bg-rose-600 text-white'
                      }`}
                  >
                    Clock Out
                  </button>
                </div>
              </div>

              {/* Sesi Absensi Manager */}
              <AttendanceSessionManager />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <AttendanceSessionManager />
            </div>
          )}

          {/* Donut Chart + Pipeline (Dipindah ke bawah) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800">Omset & Pipeline</h2>
              <button className="text-slate-300 hover:text-slate-500">
                <MoreHorizontal size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Donut */}
              <div className="flex flex-col items-center">
                {omsetBulan.length > 0 ? (
                  <>
                    <div
                      className="relative w-36 h-36 rounded-full flex items-center justify-center"
                      style={{ background: `conic-gradient(${donutGradient})` }}
                    >
                      <div className="absolute w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                          Total
                        </span>
                        <span className="text-xs font-black text-slate-800 px-1 text-center truncate w-full">
                          {formatRupiah(totalOmsetSemua)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-4">
                      {omsetBulan.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1 text-[10px] text-slate-500 font-medium"
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: chartColors[idx % chartColors.length] }}
                          ></span>
                          {item.bulan}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400 text-sm">Data belum tersedia</div>
                )}
              </div>

              {/* Pipeline */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Pipeline Pesanan
                </p>
                {data?.order_per_status &&
                  Object.entries(data.order_per_status).map(([status, count]) => {
                    const colors = {
                      review: { bar: 'bg-blue-500', text: 'text-blue-600' },
                      proses: { bar: 'bg-amber-400', text: 'text-amber-600' },
                      selesai: { bar: 'bg-emerald-500', text: 'text-emerald-600' },
                      batal: { bar: 'bg-red-400', text: 'text-red-500' },
                    };
                    const c = colors[status] || { bar: 'bg-slate-400', text: 'text-slate-500' };
                    const pct = Math.min((count / (data.total_order_bulan_ini || 1)) * 100, 100);
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="capitalize font-semibold text-slate-600">{status}</span>
                          <span className={`font-black ${c.text}`}>{count}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${c.bar} transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* KANAN: Recent Orders "My Inbox" style (4 kolom) */}
        <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Pesanan Terbaru</h2>
            <button className="text-slate-300 hover:text-slate-500">
              <MoreHorizontal size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {recentOrders.length > 0 ? (
              recentOrders.map((order, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/70 transition-colors cursor-pointer group"
                >
                  {/* Avatar Inisial */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-sm">
                    {(order.nama || 'U').charAt(0).toUpperCase()}
                  </div>
                  {/* Info */}
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
                      {order.status_global}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                <ShoppingCart size={32} strokeWidth={1.5} />
                <p className="text-sm mt-2 font-medium">Belum ada pesanan</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BARIS 3: ACTIVITIES + CASES (Leaderboard) ───────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* KIRI: My Activities — Pipeline status detail (5 kolom) */}
        <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity size={14} className="text-indigo-500" /> Status Absensi Hari Ini
            </h2>
            <button className="text-slate-300 hover:text-slate-500">
              <MoreHorizontal size={16} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {onlineStaff?.staff?.slice(0, 6).map((staff, i) => {
              const absensi = staff.absensi_hari_ini;
              const isOnline = staff.is_online;
              const sudahAbsen = absensi && absensi.status !== 'belum_absen';
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                    {staff.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 capitalize truncate">
                      {staff.username}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide truncate">
                      {staff.divisi_nama || staff.role}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {sudahAbsen ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <Clock size={14} className="text-slate-300" />
                    )}
                    <span
                      className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase
                      ${isOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                    >
                      {isOnline ? (
                        <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></span>
                      ) : (
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      )}
                      {isOnline ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>
              );
            })}
            {(!onlineStaff?.staff || onlineStaff.staff.length === 0) && (
              <div className="py-8 text-center text-slate-300 text-sm">Data belum tersedia</div>
            )}
          </div>
        </div>

        {/* KANAN: My Cases — Top Staff Leaderboard (7 kolom) */}
        <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Crown size={14} className="text-amber-500" /> Leaderboard Staff
            </h2>
            <button className="text-slate-300 hover:text-slate-500">
              <MoreHorizontal size={16} />
            </button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Nama Staff</div>
            <div className="col-span-3">Divisi</div>
            <div className="col-span-2 text-center">Job</div>
            <div className="col-span-2 text-right">Insentif</div>
          </div>

          <div className="divide-y divide-slate-50">
            {data?.top_staff?.length > 0 ? (
              data.top_staff.map((staff, i) => {
                const rankIcons = [
                  <Trophy key={0} size={14} className="text-amber-500" />,
                  <Medal key={1} size={14} className="text-slate-400" />,
                  <Medal key={2} size={14} className="text-orange-400" />,
                ];
                return (
                  <div
                    key={i}
                    className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-slate-50/70 transition-colors text-sm"
                  >
                    <div className="col-span-1 flex items-center">
                      {rankIcons[i] || (
                        <span className="text-xs font-black text-slate-400">{i + 1}</span>
                      )}
                    </div>
                    <div className="col-span-4 font-semibold text-slate-800 capitalize truncate">
                      {staff.nama}
                    </div>
                    <div className="col-span-3">
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                        Staff
                      </span>
                    </div>
                    <div className="col-span-2 text-center font-black text-slate-700">
                      {staff.jumlah_job_selesai}
                    </div>
                    <div className="col-span-2 text-right font-black text-emerald-600 text-xs">
                      {formatRupiah(staff.total_insentif)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-300 text-sm">Data belum tersedia</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
