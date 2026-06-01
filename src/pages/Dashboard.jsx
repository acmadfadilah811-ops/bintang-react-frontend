import { useState, useEffect, useCallback } from 'react';
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
  Clock,
  Activity,
  CalendarClock,
  AlertCircle,
  Play,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const isPrivileged = ['owner', 'manager'].includes(user?.role?.toLowerCase());

  const [data, setData] = useState(null);
  const [onlineStaff, setOnlineStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sesi Absensi States (untuk Owner/Manager)
  const [waktuMulai, setWaktuMulai] = useState('08:00');
  const [batasMaksimal, setBatasMaksimal] = useState('09:00');
  const [repeatDaily, setRepeatDaily] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [unlockRequests, setUnlockRequests] = useState([]);

  // Staff States (untuk staff biasa)
  const [personalAttendance, setPersonalAttendance] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update jam real-time setiap detik
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchPersonalAttendance = async () => {
    if (isPrivileged) return;
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

  const fetchSessionData = useCallback(async () => {
    if (!isPrivileged) return;
    try {
      const [sessionRes, requestsRes] = await Promise.all([
        apiClient.get('/hr/attendance-session/'),
        apiClient.get('/hr/unlock-requests/'),
      ]);
      setSessionData(sessionRes.data);
      setRepeatDaily(sessionRes.data?.repeat_daily || false);
      if (sessionRes.data?.batas_maksimal) {
        const dateBatas = new Date(sessionRes.data.batas_maksimal);
        setBatasMaksimal(
          `${String(dateBatas.getHours()).padStart(2, '0')}:${String(dateBatas.getMinutes()).padStart(2, '0')}`
        );
      }
      if (sessionRes.data?.waktu_mulai) {
        const dateMulai = new Date(sessionRes.data.waktu_mulai);
        setWaktuMulai(
          `${String(dateMulai.getHours()).padStart(2, '0')}:${String(dateMulai.getMinutes()).padStart(2, '0')}`
        );
      }
      setUnlockRequests(requestsRes.data);
    } catch (err) {
      console.error('Gagal mengambil data sesi absensi:', err);
    }
  }, [isPrivileged]);

  const handleStartSession = async () => {
    try {
      setActionLoading(true);
      await apiClient.post('/hr/attendance-session/', {
        waktu_mulai: waktuMulai,
        batas_maksimal: batasMaksimal,
        repeat_daily: repeatDaily,
      });
      await fetchSessionData();
      alert('Sesi absensi berhasil diperbarui!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Gagal memulai sesi');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([apiClient.get('/dashboard/'), apiClient.get('/users/online/')])
      .then(([dashRes, staffRes]) => {
        setData(dashRes.data);
        setOnlineStaff(staffRes.data);
      })
      .catch((err) => console.error('Error fetching dashboard:', err))
      .finally(() => setLoading(false));

    if (!isPrivileged) {
      fetchPersonalAttendance();
    } else {
      fetchSessionData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrivileged, fetchSessionData]);

  const formatRupiah = (angka) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(angka || 0);

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

  // ── DRAFT STAFF VIEW ───────────────────────────────────────────
  if (!isPrivileged) {
    const absensi = personalAttendance?.absensi_hari_ini;
    const sudahAbsen = absensi && absensi.status !== 'belum_absen';
    return (
      <div className="space-y-6 w-full max-w-7xl mx-auto px-4">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-black">Halo, {user?.username || 'Staff'}!</h2>
            <p className="text-xs text-indigo-100 mt-1">
              Selamat bekerja! Harap lakukan Clock In sebelum memulai tugas harian Anda.
            </p>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm text-right shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200">
              Waktu Sekarang
            </span>
            <div className="text-lg font-black tracking-tight tabular-nums mt-0.5">
              {currentTime.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
          </div>
        </div>

        {/* Kehadiran & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Card Kehadiran */}
          <div className="md:col-span-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <CalendarClock size={12} className="text-indigo-500" /> Status Absensi
                  </p>
                  <h3
                    className={`text-lg font-black mt-1 uppercase ${
                      !absensi || absensi.status === 'belum_absen'
                        ? 'text-amber-600'
                        : absensi.jam_keluar
                          ? 'text-slate-500'
                          : 'text-emerald-600'
                    }`}
                  >
                    {!absensi || absensi.status === 'belum_absen' ? 'Belum Masuk' : absensi.status}
                  </h3>
                </div>
                {absensi?.jam_masuk && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-wider">
                    {new Date(absensi.jam_masuk).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-550 leading-relaxed mb-4">
                {absensi?.jam_masuk
                  ? `Sesi kerja Anda hari ini dimulai pukul ${new Date(absensi.jam_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.`
                  : 'Silakan klik tombol di bawah untuk Clock In dan mulai mencatat jam kerja Anda hari ini.'}
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={handleClockIn}
                disabled={sudahAbsen || actionLoading}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer
                  ${sudahAbsen ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
              >
                Clock In
              </button>
              <button
                onClick={handleClockOut}
                disabled={
                  !absensi ||
                  absensi.status === 'belum_absen' ||
                  absensi.jam_keluar ||
                  actionLoading
                }
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer
                  ${!absensi || absensi.status === 'belum_absen' || absensi.jam_keluar ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}
              >
                Clock Out
              </button>
            </div>
          </div>

          {/* Card Info Sesi Kerja */}
          <div className="md:col-span-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between min-h-[220px]">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Info Sesi Absensi Hari Ini
              </h3>
              <div className="space-y-2 text-xs text-slate-600 mt-2">
                <div className="flex justify-between border-b border-slate-50 py-1.5">
                  <span>Waktu Mulai Kerja:</span>
                  <span className="font-bold text-slate-800">
                    {sessionData?.waktu_mulai
                      ? new Date(sessionData.waktu_mulai).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '08:00'}{' '}
                    WIB
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-50 py-1.5">
                  <span>Batas Akhir Absensi:</span>
                  <span className="font-bold text-slate-800">
                    {sessionData?.batas_maksimal
                      ? new Date(sessionData.batas_maksimal).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '09:00'}{' '}
                    WIB
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Status Sesi:</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      sessionData?.is_active
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : 'bg-slate-50 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {sessionData?.is_active ? 'AKTIF' : 'NON-AKTIF'}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-450 italic text-center border-t border-slate-50 pt-3">
              *Toleransi keterlambatan ditentukan oleh kebijakan manajemen.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── DRAFT OWNER/MANAGER VIEW ───────────────────────────────────
  const omsetBulan = data?.omset_6_bulan || [];
  // hitung koordinat kurva SVG line chart omset bulanan
  const maxOmset = Math.max(...omsetBulan.map((item) => item.total), 1) * 1.1;
  const svgWidth = 500;
  const svgHeight = 150;

  const points = omsetBulan.map((item, idx) => {
    const x = (idx / Math.max(omsetBulan.length - 1, 1)) * (svgWidth - 40) + 20;
    const y = svgHeight - (item.total / maxOmset) * (svgHeight - 40) - 20;
    return { x, y };
  });

  const pathD =
    points.length > 0
      ? `M ${points[0].x} ${points[0].y} ` +
        points
          .slice(1)
          .map((p) => `L ${p.x} ${p.y}`)
          .join(' ')
      : '';

  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - 15} L ${points[0].x} ${svgHeight - 15} Z`
      : '';

  // Data donut chart absensi
  const staffList = onlineStaff?.staff?.filter((s) => s.role === 'staff') || [];
  const totalStaff = staffList.length || 1;
  const countHadir = staffList.filter(
    (s) => s.absensi_hari_ini && s.absensi_hari_ini.status === 'hadir'
  ).length;
  const countTerlambat = staffList.filter(
    (s) => s.absensi_hari_ini && s.absensi_hari_ini.status === 'terlambat'
  ).length;
  const countBelumAbsen = staffList.filter(
    (s) => !s.absensi_hari_ini || s.absensi_hari_ini.status === 'belum_absen'
  ).length;

  const pctHadir = Math.round((countHadir / totalStaff) * 100);
  const pctTerlambat = Math.round((countTerlambat / totalStaff) * 100);
  const pctBelumAbsen = 100 - pctHadir - pctTerlambat;

  const segHadirEnd = pctHadir;
  const segLateEnd = segHadirEnd + pctTerlambat;
  const attendanceDonutGradient = `conic-gradient(
    #10b981 0% ${segHadirEnd}%,
    #f59e0b ${segHadirEnd}% ${segLateEnd}%,
    #ef4444 ${segLateEnd}% 100%
  )`;

  const statCards = [
    {
      label: 'Total Omset',
      value: formatRupiah(data?.omset_bulan_ini),
      badge: '+12%',
      badgeUp: true,
      icon: TrendingUp,
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      iconColor: 'text-indigo-600',
    },
    {
      label: 'Pelanggan Baru',
      value: data?.total_pelanggan || 0,
      badge: '+20%',
      badgeUp: true,
      icon: Users,
      iconBg: 'bg-orange-50 text-orange-600 border border-orange-100',
      iconColor: 'text-orange-500',
    },
    {
      label: 'Total Order',
      value: data?.total_order_bulan_ini || 0,
      badge: '-5%',
      badgeUp: false,
      icon: ShoppingCart,
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
      iconColor: 'text-rose-500',
    },
    {
      label: 'Order Hari Ini',
      value: data?.total_order_hari_ini || 0,
      badge: '+35%',
      badgeUp: true,
      icon: Package,
      iconBg: 'bg-teal-50 text-teal-600 border border-teal-100',
      iconColor: 'text-teal-500',
    },
  ];

  // 4 colorful cards (Review Status, Proses Produksi, Siap Diambil, Selesai)
  const statusCards = [
    {
      title: 'Review Status',
      count: data?.order_per_status?.review || 0,
      colorClass: 'text-blue-600 bg-blue-50/60 border border-blue-100/50',
      chartColor: '#3b82f6',
      type: 'bars',
    },
    {
      title: 'Proses Produksi',
      count: data?.order_per_status?.proses || 0,
      colorClass: 'text-amber-500 bg-amber-50/60 border border-amber-100/50',
      chartColor: '#f59e0b',
      type: 'line',
    },
    {
      title: 'Siap Diambil',
      count: data?.order_per_status?.ready || 0,
      colorClass: 'text-rose-500 bg-rose-50/60 border border-rose-100/50',
      chartColor: '#f43f5e',
      type: 'line',
    },
    {
      title: 'Selesai (Bulan Ini)',
      count: data?.order_per_status?.selesai || 0,
      colorClass: 'text-purple-650 text-purple-600 bg-purple-50/60 border border-purple-100/50',
      chartColor: '#a855f7',
      type: 'bars',
    },
  ];

  return (
    <div className="space-y-6 w-full select-none">
      {/* ── BARIS 1: ANALYTICS + SESI ABSENSI ────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* KIRI: Line Chart Omset & 4 Stat Cards di bawahnya (8 kolom) */}
        <div className="xl:col-span-8 flex flex-col gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          {/* Header Omset */}
          <div className="flex justify-between items-start border-b border-slate-50 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Dashboard Analitik</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Pendapatan dan performa penjualan 6 bulan terakhir.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-450">
                Bulan Ini
              </span>
              <div className="text-lg font-black text-slate-800 leading-none mt-0.5">
                {formatRupiah(data?.omset_bulan_ini)}
              </div>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full h-44 mt-2">
            {omsetBulan.length > 0 ? (
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="omsetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4318FF" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#4318FF" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Grid Lines */}
                <line
                  x1="20"
                  y1={svgHeight - 15}
                  x2={svgWidth - 20}
                  y2={svgHeight - 15}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <line
                  x1="20"
                  y1={svgHeight / 2}
                  x2={svgWidth - 20}
                  y2={svgHeight / 2}
                  stroke="#F1F5F9"
                  strokeWidth="0.5"
                  strokeDasharray="3"
                />
                <line
                  x1="20"
                  y1="20"
                  x2={svgWidth - 20}
                  y2={20}
                  stroke="#F1F5F9"
                  strokeWidth="0.5"
                  strokeDasharray="3"
                />

                {/* Area under the line */}
                {areaD && <path d={areaD} fill="url(#omsetGradient)" />}

                {/* Line path */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#4318FF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Dots */}
                {points.map((p, idx) => (
                  <g key={idx}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="3"
                      fill="#4318FF"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  </g>
                ))}
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-350 text-xs">
                Data grafik belum tersedia
              </div>
            )}
          </div>

          {/* X-Axis labels */}
          <div className="flex justify-between px-5 text-[8.5px] font-bold text-slate-400 uppercase">
            {omsetBulan.map((item, idx) => (
              <span key={idx}>{item.bulan.slice(0, 3)}</span>
            ))}
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-50">
            {statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 flex items-center justify-between transition-all hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5 truncate">
                      {card.label}
                    </p>
                    <h3 className="text-sm font-black text-slate-800 leading-none truncate">
                      {card.value}
                    </h3>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ml-1 ${card.iconBg}`}
                  >
                    <Icon size={14} className={card.iconColor} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* KANAN: Traffic -> Sesi & Kehadiran Absensi (4 kolom) */}
        <div className="xl:col-span-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-50 pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Sesi & Kehadiran Absensi</h2>
              {sessionData?.is_active && (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  Sesi Aktif
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Pemantauan tingkat kehadiran staff hari ini.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 items-center">
            {/* Donut Chart */}
            <div className="flex flex-col items-center">
              <div
                className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-inner"
                style={{ background: attendanceDonutGradient }}
              >
                <div className="absolute w-18 h-18 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                  <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider">
                    Hadir
                  </span>
                  <span className="text-xs font-black text-slate-800">
                    {countHadir + countTerlambat} / {totalStaff}
                  </span>
                </div>
              </div>
            </div>

            {/* Legend Kehadiran */}
            <div className="space-y-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>Tepat Waktu</span>
                </div>
                <span className="text-xs font-black text-slate-800 pl-3.5 mt-0.5">
                  {countHadir} Org ({pctHadir}%)
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                  <span>Terlambat</span>
                </div>
                <span className="text-xs font-black text-slate-800 pl-3.5 mt-0.5">
                  {countTerlambat} Org ({pctTerlambat}%)
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span>Belum Absen</span>
                </div>
                <span className="text-xs font-black text-slate-800 pl-3.5 mt-0.5">
                  {countBelumAbsen} Org ({pctBelumAbsen}%)
                </span>
              </div>
            </div>
          </div>

          {/* Form Atur Sesi Absensi */}
          <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 mt-1 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide mb-1">
                  Jam Masuk
                </span>
                <input
                  type="time"
                  value={waktuMulai}
                  onChange={(e) => setWaktuMulai(e.target.value)}
                  className="text-xs font-bold px-2 py-1 bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-500 cursor-pointer"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide mb-1">
                  Batas Absen
                </span>
                <input
                  type="time"
                  value={batasMaksimal}
                  onChange={(e) => setBatasMaksimal(e.target.value)}
                  className="text-xs font-bold px-2 py-1 bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="repeatDailyCheck"
                checked={repeatDaily}
                onChange={(e) => setRepeatDaily(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-200 cursor-pointer"
              />
              <label
                htmlFor="repeatDailyCheck"
                className="text-[9px] font-bold text-slate-655 text-slate-600 cursor-pointer select-none"
              >
                Jadwalkan otomatis setiap hari
              </label>
            </div>

            <button
              onClick={handleStartSession}
              disabled={actionLoading}
              className="w-full justify-center py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black rounded shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play size={10} /> Update Sesi Absensi
            </button>
          </div>

          {/* Unlock Requests Alert (jika ada) */}
          {unlockRequests.length > 0 && (
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertCircle size={14} className="text-amber-500 shrink-0" />
                <span className="text-[9px] font-bold text-amber-800 truncate">
                  Ada {unlockRequests.length} permohonan buka absen pending.
                </span>
              </div>
              <button
                onClick={() => alert('Gunakan sidebar atau panel bawahan untuk memproses izin')}
                className="text-[9px] text-amber-700 font-extrabold underline whitespace-nowrap"
              >
                Lihat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── BARIS 2: 4 COLORFUL STATS CARDS ────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card, i) => (
          <div
            key={i}
            className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm"
          >
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {card.title}
              </p>
              <h3 className="text-xl font-black text-slate-800">{card.count} Order</h3>
            </div>

            {/* SVG Chart Mini */}
            <div className="shrink-0">
              {card.type === 'bars' ? (
                <svg className="w-12 h-8" viewBox="0 0 60 40">
                  <rect
                    x="5"
                    y="15"
                    width="6"
                    height="25"
                    rx="1.5"
                    fill={card.chartColor}
                    opacity="0.3"
                  />
                  <rect x="17" y="5" width="6" height="35" rx="1.5" fill={card.chartColor} />
                  <rect
                    x="29"
                    y="20"
                    width="6"
                    height="20"
                    rx="1.5"
                    fill={card.chartColor}
                    opacity="0.5"
                  />
                  <rect x="41" y="10" width="6" height="30" rx="1.5" fill={card.chartColor} />
                </svg>
              ) : (
                <svg className="w-16 h-8" viewBox="0 0 100 40">
                  <path
                    d="M 5 30 Q 20 5 40 25 T 75 10 T 95 35"
                    fill="none"
                    stroke={card.chartColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── BARIS 3: ONLINE STAFF TIMELINE + LEADERBOARD ─────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* KIRI: Status Absensi Hari Ini (timeline style) (5 kolom) */}
        <div className="xl:col-span-5 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="border-b border-slate-50 pb-3 mb-4 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Activity size={14} className="text-indigo-500" /> Kehadiran Staff Hari Ini
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Timeline check-in dan online status staff saat ini.
              </p>
            </div>
            <button className="text-slate-300 hover:text-slate-500">
              <MoreHorizontal size={16} />
            </button>
          </div>

          {/* Timeline Wrapper */}
          <div className="relative flex-1 overflow-y-auto pl-4 border-l border-slate-100 space-y-4 max-h-[360px] custom-scrollbar">
            {staffList.length > 0 ? (
              staffList.map((staff, i) => {
                const absensi = staff.absensi_hari_ini;
                const isOnline = staff.is_online;
                const sudahAbsen = absensi && absensi.status !== 'belum_absen';

                // Color node
                let nodeBg = 'bg-slate-200';
                if (sudahAbsen) {
                  if (absensi.status === 'hadir') {
                    nodeBg = 'bg-emerald-500';
                  } else {
                    nodeBg = 'bg-amber-500';
                  }
                }

                return (
                  <div key={i} className="relative flex items-start gap-4 pb-1 group">
                    {/* Node Dot on Timeline Line */}
                    <div
                      className={`absolute -left-[22px] top-1 w-3 h-3 rounded-full ${nodeBg} border-2 border-white shadow-sm flex items-center justify-center`}
                    ></div>

                    {/* Avatar Initial */}
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                      {staff.username.charAt(0)}
                    </div>

                    {/* Staff info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800 capitalize truncate">
                          {staff.username}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                          {staff.divisi_nama || 'Staff'}
                        </span>
                      </div>

                      {/* Check-in time & Online Badge */}
                      <div className="flex items-center justify-between mt-1 gap-2">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock size={10} className="text-slate-400" />
                          {sudahAbsen && absensi.jam_masuk
                            ? `Masuk: ${new Date(absensi.jam_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
                            : 'Belum Clock In'}
                        </span>

                        {/* Status Online */}
                        <span
                          className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase flex items-center gap-1 ${
                            isOnline
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1 h-1 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}
                          ></span>
                          {isOnline ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-300 text-xs">
                Tidak ada staff terdaftar.
              </div>
            )}
          </div>
        </div>

        {/* KANAN: Leaderboard Staff Podium + List (7 kolom) */}
        <div className="xl:col-span-7 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50 shrink-0">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Crown size={14} className="text-amber-500 animate-pulse" /> Leaderboard Staff
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Pemeringkat performa staff berdasarkan penyelesaian tugas.
              </p>
            </div>
            <button className="text-slate-300 hover:text-slate-500">
              <MoreHorizontal size={16} />
            </button>
          </div>

          {/* Podium (Top 3) */}
          {data?.top_staff?.length > 0 && (
            <div className="py-4 bg-gradient-to-b from-indigo-50/10 to-white border-b border-slate-50 flex justify-center items-end gap-5 shrink-0 select-none">
              {/* Peringkat 2 */}
              {data.top_staff[1] && (
                <div className="flex flex-col items-center w-24">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full border-2 border-slate-300 bg-slate-50 flex items-center justify-center font-bold text-slate-655 text-slate-600 text-xs uppercase shadow shadow-inner">
                      {data.top_staff[1].nama.charAt(0)}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-slate-300 text-slate-800 rounded-full flex items-center justify-center font-black text-[8.5px] border border-white">
                      2
                    </span>
                  </div>
                  <span className="text-[9.5px] font-bold text-slate-700 capitalize mt-1.5 truncate w-full text-center">
                    {data.top_staff[1].nama}
                  </span>
                  <span className="text-[8px] text-slate-400 font-extrabold uppercase mt-0.5">
                    {data.top_staff[1].jumlah_job_selesai} Jobs
                  </span>
                  <span className="text-[9px] text-indigo-600 font-black mt-0.5">
                    {formatRupiah(data.top_staff[1].total_insentif)}
                  </span>
                </div>
              )}

              {/* Peringkat 1 */}
              {data.top_staff[0] && (
                <div className="flex flex-col items-center w-28 -translate-y-1">
                  <div className="relative">
                    <Crown
                      size={14}
                      className="text-amber-505 text-amber-500 absolute -top-3 left-1/2 -translate-x-1/2 drop-shadow animate-bounce"
                    />
                    <div className="w-12 h-12 rounded-full border-3 border-amber-400 bg-amber-50 flex items-center justify-center font-black text-slate-800 text-sm uppercase shadow-md">
                      {data.top_staff[0].nama.charAt(0)}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 text-white rounded-full flex items-center justify-center font-black text-[9px] border-2 border-white">
                      1
                    </span>
                  </div>
                  <span className="text-xs font-black text-slate-905 text-slate-900 capitalize mt-1.5 truncate w-full text-center">
                    {data.top_staff[0].nama}
                  </span>
                  <span className="text-[9px] text-amber-600 font-extrabold uppercase mt-0.5">
                    {data.top_staff[0].jumlah_job_selesai} Jobs
                  </span>
                  <span className="text-[9px] text-emerald-600 font-black mt-0.5">
                    {formatRupiah(data.top_staff[0].total_insentif)}
                  </span>
                </div>
              )}

              {/* Peringkat 3 */}
              {data.top_staff[2] && (
                <div className="flex flex-col items-center w-24">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full border-2 border-orange-200 bg-orange-50/20 flex items-center justify-center font-bold text-orange-850 text-orange-800 text-xs uppercase shadow shadow-inner">
                      {data.top_staff[2].nama.charAt(0)}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-orange-300 text-orange-950 rounded-full flex items-center justify-center font-black text-[8.5px] border border-white">
                      3
                    </span>
                  </div>
                  <span className="text-[9.5px] font-bold text-slate-700 capitalize mt-1.5 truncate w-full text-center">
                    {data.top_staff[2].nama}
                  </span>
                  <span className="text-[8px] text-slate-400 font-extrabold uppercase mt-0.5">
                    {data.top_staff[2].jumlah_job_selesai} Jobs
                  </span>
                  <span className="text-[9px] text-orange-600 font-black mt-0.5">
                    {formatRupiah(data.top_staff[2].total_insentif)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Table Header */}
          <div className="grid grid-cols-12 px-5 py-2 bg-slate-50 border-b border-slate-100 text-[8.5px] font-black text-slate-405 text-slate-400 uppercase tracking-widest shrink-0">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Nama Staff</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-2 text-center">Job Selesai</div>
            <div className="col-span-2 text-right">Total Insentif</div>
          </div>

          {/* Table List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50 max-h-[220px] custom-scrollbar">
            {data?.top_staff?.length > 0 ? (
              data.top_staff.map((staff, i) => {
                const rankIcons = [
                  <Trophy key={0} size={12} className="text-amber-500" />,
                  <Medal key={1} size={12} className="text-slate-450" />,
                  <Medal key={2} size={12} className="text-orange-400" />,
                ];
                return (
                  <div
                    key={i}
                    className="grid grid-cols-12 px-5 py-2 items-center hover:bg-slate-50/50 transition-colors text-[10.5px]"
                  >
                    <div className="col-span-1 flex items-center">
                      {rankIcons[i] || (
                        <span className="text-[9px] font-black text-slate-400">{i + 1}</span>
                      )}
                    </div>
                    <div className="col-span-4 font-bold text-slate-800 capitalize truncate">
                      {staff.nama}
                    </div>
                    <div className="col-span-3">
                      <span className="text-[8px] bg-slate-100 text-slate-500 border border-slate-200/80 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                        Staff
                      </span>
                    </div>
                    <div className="col-span-2 text-center font-black text-slate-700">
                      {staff.jumlah_job_selesai}
                    </div>
                    <div className="col-span-2 text-right font-black text-emerald-600">
                      {formatRupiah(staff.total_insentif)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-300 text-xs">Data belum tersedia</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
