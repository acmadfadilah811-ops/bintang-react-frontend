import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { ShoppingCart, TrendingUp, Package, AlertTriangle, CheckCircle2, BarChart3, Activity, Users } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [onlineStaff, setOnlineStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Memuat data analitik utama
    apiClient.get('/dashboard/')
      .then(res => setData(res.data))
      .catch(err => console.error('Error fetching dashboard:', err));

    // Memuat data karyawan online secara terpisah
    apiClient.get('/users/online/')
      .then(res => setOnlineStaff(res.data))
      .catch(err => console.error('Error fetching online staff:', err))
      .finally(() => setLoading(false));
  }, []);

  const formatRupiah = (angka) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50/50">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-sm font-medium">Memuat analitik...</p>
      </div>
    </div>
  );

  // Cari nilai maksimum omset untuk skala grafik bar CSS
  const maxOmset = data?.omset_6_bulan?.reduce((max, item) => Math.max(max, item.total), 0) || 1;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-xs text-slate-500 mt-0.5">Ringkasan performa bisnis dan operasional</p>
      </div>

      {/* Kartu Ringkasan Utama (Premium Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-4 text-white shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-500"></div>
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-md">
              <ShoppingCart size={14} className="text-white" />
            </div>
            <span className="text-indigo-100 text-xs font-medium">Order Hari Ini</span>
          </div>
          <div className="relative z-10">
            <p className="text-2xl font-bold">{data?.total_order_hari_ini || 0}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-4 text-white shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-500"></div>
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-md">
              <Package size={14} className="text-white" />
            </div>
            <span className="text-blue-100 text-xs font-medium">Order Bulan Ini</span>
          </div>
          <div className="relative z-10">
            <p className="text-2xl font-bold">{data?.total_order_bulan_ini || 0}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl p-4 text-white shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-500"></div>
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-md">
              <TrendingUp size={14} className="text-white" />
            </div>
            <span className="text-emerald-100 text-xs font-medium">Omset Bulan Ini</span>
          </div>
          <div className="relative z-10">
            <p className="text-xl font-bold truncate">{formatRupiah(data?.omset_bulan_ini || 0)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Kolom Kiri: Grafik Omset & Status Order */}
        <div className="lg:col-span-2 space-y-4">

          {/* Grafik Omset 6 Bulan (CSS Bar Chart) */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-slate-900 font-bold text-sm flex items-center gap-1.5">
                  <BarChart3 className="text-indigo-600" size={16} /> Grafik Omset 6 Bulan
                </h2>
                <p className="text-slate-500 text-[10px] mt-0.5">Tren pendapatan kotor (IDR)</p>
              </div>
            </div>

            {data?.omset_6_bulan ? (
              <div className="h-32 flex items-end justify-between gap-1.5 px-1 relative">
                {/* Horizontal grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5 py-2">
                  <div className="border-b border-slate-900 w-full h-0"></div>
                  <div className="border-b border-slate-900 w-full h-0"></div>
                  <div className="border-b border-slate-900 w-full h-0"></div>
                </div>

                {data.omset_6_bulan.map((item, idx) => {
                  // Berikan tinggi minimum 1% jika data kosong agar terlihat garis tipis, bukan bar kotak besar
                  const heightPercent = item.total > 0 ? Math.max((item.total / maxOmset) * 100, 2) : 1;
                  return (
                    <div key={idx} className="flex flex-col items-center w-full group cursor-pointer h-full justify-end">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg pointer-events-none whitespace-nowrap z-20 -mt-2">
                        {formatRupiah(item.total)}
                      </div>

                      {/* Bar */}
                      <div className="w-full max-w-[24px] md:max-w-[40px] bg-indigo-50/50 rounded-t-sm relative overflow-hidden h-[85%] flex items-end">
                        <div
                          className={`w-full transition-all duration-700 ease-out rounded-t-sm ${item.total > 0 ? 'bg-indigo-500 group-hover:bg-indigo-600' : 'bg-slate-200'}`}
                          style={{ height: `${heightPercent}%` }}
                        ></div>
                      </div>

                      {/* Label Bulan */}
                      <span className="text-[10px] font-medium text-slate-600 mt-1">{item.bulan}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-slate-400 text-xs">Data grafik belum tersedia</div>
            )}
          </div>

          {/* Status Order */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-slate-900 font-bold text-sm flex items-center gap-1.5 mb-3">
              <Activity className="text-slate-600" size={16} /> Pipeline Pesanan
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {data?.order_per_status && Object.entries(data.order_per_status).map(([status, count]) => {
                let colorClass = 'bg-slate-50 border-slate-200 text-slate-800';
                if (status === 'selesai') colorClass = 'bg-emerald-50 border-emerald-200 text-emerald-700';
                if (status === 'batal') colorClass = 'bg-red-50 border-red-200 text-red-700';
                if (status === 'proses') colorClass = 'bg-blue-50 border-blue-200 text-blue-700';
                if (status === 'review') colorClass = 'bg-orange-50 border-orange-200 text-orange-700';

                return (
                  <div key={status} className={`rounded-lg p-2 text-center border shadow-sm transition-transform hover:-translate-y-0.5 ${colorClass}`}>
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5 opacity-80">{status}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Kolom Kanan: Top Staff & Stok Kritis */}
        <div className="space-y-4 flex flex-col">

          {/* Top Staff Leaderboard */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex-1">
            <div className="flex items-center gap-1.5 mb-3">
              <CheckCircle2 className="text-emerald-500" size={16} />
              <h2 className="text-slate-900 font-bold text-sm">Top Staff</h2>
            </div>

            <div className="space-y-2">
              {data?.top_staff?.length > 0 ? (
                data.top_staff.map((staff, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full font-bold text-[10px] shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-600' :
                          i === 1 ? 'bg-slate-200 text-slate-600' :
                            i === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-slate-50 text-slate-400'
                        }`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs capitalize">{staff.nama}</p>
                        <p className="text-[10px] text-slate-500 mt-0">{staff.jumlah_job_selesai} job selesai</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600 text-xs">{formatRupiah(staff.total_insentif)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 italic text-[10px]">Belum ada performa staff dicatat</div>
              )}
            </div>
          </div>

          {/* Stok Kritis Alert */}
          {data?.stok_kritis?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="text-red-600 animate-pulse" size={16} />
                <h2 className="text-red-800 font-bold text-sm">Stok Kritis</h2>
              </div>
              <div className="space-y-1.5">
                {data.stok_kritis.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px] p-2 bg-white/60 backdrop-blur-sm rounded-md border border-red-100 hover:bg-white transition-colors">
                    <span className="text-slate-800 font-medium truncate max-w-[120px]">{item.nama}</span>
                    <span className="text-red-700 font-bold bg-red-100 px-1.5 py-0.5 rounded">
                      {item.stok} / {item.min_stok}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Karyawan Aktif */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-slate-900 font-bold text-sm flex items-center gap-1.5">
                <Users className="text-blue-500" size={16} /> Status Karyawan
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                {onlineStaff?.total_online} / {onlineStaff?.total_staff} Aktif
              </span>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {onlineStaff?.staff?.length > 0 ? (
                onlineStaff.staff.map((staff, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-500 text-xs">
                          {staff.foto_profil ? (
                            <img src={staff.foto_profil} alt="" className="w-full h-full object-cover" />
                          ) : (
                            staff.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        {/* Dot Status Online/Offline */}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${staff.is_online ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-xs capitalize leading-tight">{staff.username}</p>
                        <p className="text-[10px] text-slate-500">
                          {staff.divisi_nama || staff.role}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {staff.absensi_hari_ini?.status === 'belum_absen' ? (
                        <span className="text-[10px] text-slate-400 italic">Belum Masuk</span>
                      ) : (
                        <span className="text-[10px] text-indigo-600 font-medium capitalize">
                          {staff.absensi_hari_ini?.status} 
                          {staff.absensi_hari_ini?.jam_masuk && ` (${staff.absensi_hari_ini.jam_masuk})`}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-400 italic text-xs">Belum ada data karyawan</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}