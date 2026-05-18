import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle, Package, AlertCircle } from 'lucide-react';
import api from '../api/apiClient';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hr/dashboard/staff/');
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching staff dashboard:', err);
      setError('Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      await api.post('/hr/absensi/clock-in/', { catatan: '' });
      fetchDashboardData(); // Refresh data
    } catch (err) {
      alert(err.response?.data?.detail || 'Gagal clock-in');
    }
  };

  const handleClockOut = async () => {
    try {
      await api.post('/hr/absensi/clock-out/', { catatan: '' });
      fetchDashboardData(); // Refresh data
    } catch (err) {
      alert(err.response?.data?.detail || 'Gagal clock-out');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Memuat Dashboard...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4 bg-red-50 rounded-lg">{error}</div>;
  }

  const { absensi_hari_ini, timecard_bulan_ini, job_aktif, total_job_aktif, pengumuman } = dashboardData;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Halo, {user?.username} 👋</h1>
          <p className="text-slate-500">Berikut adalah ringkasan hari ini.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card Absensi Hari Ini */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Status Kehadiran</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1 uppercase">
                {absensi_hari_ini?.status === 'belum_absen' ? 'Belum Masuk' : absensi_hari_ini?.status}
              </h3>
              {absensi_hari_ini?.jam_masuk && (
                <p className="text-xs text-slate-500 mt-1">Masuk: {absensi_hari_ini.jam_masuk}</p>
              )}
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Clock size={24} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleClockIn}
              disabled={absensi_hari_ini?.status !== 'belum_absen'}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Masuk
            </button>
            <button
              onClick={handleClockOut}
              disabled={absensi_hari_ini?.status === 'belum_absen' || absensi_hari_ini?.jam_keluar}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-slate-300 text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Card Papan Pekerjaan */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Pekerjaan Aktif</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{total_job_aktif}</h3>
              <p className="text-xs text-slate-500 mt-1">Yang sedang Anda kerjakan</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Package size={24} />
            </div>
          </div>
        </div>

        {/* Card Timecard Bulanan */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Statistik Bulan Ini</p>
              <div className="flex gap-6 mt-2">
                <div>
                  <p className="text-2xl font-bold text-slate-800">{timecard_bulan_ini?.total_hadir || 0}</p>
                  <p className="text-xs text-slate-500">Hari Masuk</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{timecard_bulan_ini?.total_jam_kerja || 0}</p>
                  <p className="text-xs text-slate-500">Jam Kerja</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">Rp {timecard_bulan_ini?.total_insentif?.toLocaleString('id-ID') || 0}</p>
                  <p className="text-xs text-slate-500">Estimasi Insentif</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info Pengumuman */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertCircle className="text-orange-500" size={20} />
            Pengumuman Terbaru
          </h3>
          <div className="space-y-4">
            {pengumuman && pengumuman.length > 0 ? (
              pengumuman.map(item => (
                <div key={item.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <h4 className="font-semibold text-slate-800">{item.judul}</h4>
                  <p className="text-sm text-slate-600 mt-1">{item.isi}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    Dari: {item.dibuat_oleh_nama} • {new Date(item.dibuat_pada).toLocaleDateString('id-ID')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Belum ada pengumuman.</p>
            )}
          </div>
        </div>

        {/* List Pekerjaan Teratas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Pekerjaan Aktif Saya</h3>
          <div className="space-y-3">
            {job_aktif && job_aktif.length > 0 ? (
              job_aktif.map(job => (
                <div key={job.job_id} className="p-4 bg-slate-50 rounded-lg flex justify-between items-center border border-slate-100">
                  <div>
                    <h4 className="font-semibold text-slate-800">{job.produk}</h4>
                    <p className="text-sm text-slate-500">{job.tahap} • Order ID: #{job.order_id}</p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full capitalize">
                    {job.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Tidak ada pekerjaan di antrean Anda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
