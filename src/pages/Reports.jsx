import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import { Briefcase, CheckCircle, AlertCircle, Search, Filter, Grid, Download } from 'lucide-react';

export default function Reports() {
  const [reportData, setReportData] = useState([]);
  const [range, setRange] = useState('bulan_ini');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReport = useCallback(() => {
    setLoading(true);
    apiClient
      .get(`/reports/staff-performance/?range=${range}`)
      .then((res) => {
        setReportData(res.data.data || []);
      })
      .catch((err) => {
        console.error('Gagal mengambil data laporan:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [range]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExportExcel = () => {
    setExporting(true);
    apiClient
      .get(`/export/staff-performance/?range=${range}`, {
        responseType: 'blob',
      })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
          'download',
          `kinerja_karyawan_${range}_${new Date().toISOString().slice(0, 10)}.xlsx`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error('Gagal mengunduh file Excel:', err);
      })
      .finally(() => {
        setExporting(false);
      });
  };

  const formatRupiah = (angka) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(angka || 0);

  // Perhitungan Agregasi
  const totalCompleted = reportData.reduce((sum, item) => sum + item.jobs_completed, 0);
  const totalInprogress = reportData.reduce((sum, item) => sum + item.jobs_in_progress, 0);
  const totalPending = reportData.reduce((sum, item) => sum + item.jobs_pending, 0);
  const totalFailed = reportData.reduce((sum, item) => sum + item.jobs_failed, 0);
  const totalConstraint = reportData.reduce((sum, item) => sum + item.jobs_constraint, 0);
  const totalJobs = reportData.reduce((sum, item) => sum + item.jobs_total, 0);

  // Agregasi Kehadiran
  const totalOntime = reportData.reduce((sum, item) => sum + item.att_ontime, 0);
  const totalLate = reportData.reduce((sum, item) => sum + item.att_late, 0);
  const totalAlpha = reportData.reduce((sum, item) => sum + item.att_alpha, 0);
  const totalAttendance = totalOntime + totalLate + totalAlpha;
  const totalPresent = totalOntime + totalLate;

  // Staff Highlights
  const mostProductiveStaff = [...reportData].sort(
    (a, b) => b.jobs_completed - a.jobs_completed
  )[0];
  const mostLateStaff = [...reportData]
    .filter((x) => x.att_late > 0)
    .sort((a, b) => b.att_late - a.att_late)[0];
  const mostOntimeStaff = [...reportData]
    .filter((x) => x.att_ontime > 0)
    .sort((a, b) => b.att_ontime - a.att_ontime)[0];

  // Group division contributions
  const divStats = reportData.reduce((acc, curr) => {
    const d = curr.divisi || 'Lainnya';
    acc[d] = (acc[d] || 0) + curr.jobs_completed;
    return acc;
  }, {});

  const divTotal = Object.values(divStats).reduce((s, v) => s + v, 0);

  // 1. Dapatkan Conic Gradient Kehadiran
  const pctOntime = totalAttendance > 0 ? (totalOntime / totalAttendance) * 100 : 100;
  const pctLate = totalAttendance > 0 ? (totalLate / totalAttendance) * 100 : 0;
  const attConic = `conic-gradient(
    #10b981 0% ${pctOntime}%,
    #f59e0b ${pctOntime}% ${pctOntime + pctLate}%,
    #ef4444 ${pctOntime + pctLate}% 100%
  )`;

  // 2. Dapatkan Conic Gradient Status Tugas
  const pctSelesai = totalJobs > 0 ? (totalCompleted / totalJobs) * 100 : 100;
  const pctDikerjakan = totalJobs > 0 ? (totalInprogress / totalJobs) * 100 : 0;
  const pctAntrean = totalJobs > 0 ? (totalPending / totalJobs) * 100 : 0;
  const pctKendala = totalJobs > 0 ? (totalConstraint / totalJobs) * 100 : 0;
  const jobConic = `conic-gradient(
    #10b981 0% ${pctSelesai}%,
    #3b82f6 ${pctSelesai}% ${pctSelesai + pctDikerjakan}%,
    #6366f1 ${pctSelesai + pctDikerjakan}% ${pctSelesai + pctDikerjakan + pctAntrean}%,
    #a855f7 ${pctSelesai + pctDikerjakan + pctAntrean}% ${pctSelesai + pctDikerjakan + pctAntrean + pctKendala}%,
    #ef4444 ${pctSelesai + pctDikerjakan + pctAntrean + pctKendala}% 100%
  )`;

  // 3. Dapatkan Conic Gradient Kontribusi Divisi (Maksimal 4 divisi)
  const divEntries = Object.entries(divStats);
  let divConic = 'conic-gradient(#cbd5e1 0% 100%)';
  let accumPct = 0;
  const divColors = ['#3b82f6', '#f59e0b', '#ec4899', '#6366f1', '#64748b'];
  if (divTotal > 0) {
    const gradients = divEntries.map(([name, val], idx) => {
      const pct = (val / divTotal) * 100;
      const start = accumPct;
      accumPct += pct;
      return `${divColors[idx % divColors.length]} ${start}% ${accumPct}%`;
    });
    divConic = `conic-gradient(${gradients.join(', ')})`;
  }

  // Filter staff berdasarkan search box
  const filteredStaff = reportData.filter(
    (staff) =>
      staff.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.divisi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-semibold tracking-widest uppercase">
            Membuat Dasbor Laporan Kinerja...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full text-slate-800 bg-[#f8fafc] p-6 rounded-3xl min-h-screen">
      {/* Title & Control Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            Laporan Kinerja & Kehadiran
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dasbor terpadu pemantauan produktivitas tugas produksi dan statistik kedisiplinan
            karyawan.
          </p>
        </div>

        {/* Tab Filters & Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setRange('bulan_ini')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                range === 'bulan_ini'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setRange('bulan_lalu')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                range === 'bulan_lalu'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Bulan Lalu
            </button>
            <button
              onClick={() => setRange('semua')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                range === 'semua'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua Waktu
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="flex items-center gap-2 bg-[#0fb981] hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            <Download size={14} />
            {exporting ? 'Mengekspor...' : 'Unduh Laporan Excel'}
          </button>
        </div>
      </div>

      {/* 4 Dashboard Cards (Mockup Deals Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Summary List */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Ringkasan Tugas
          </h3>
          <div className="space-y-3.5">
            {/* Row 1: Total Job */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Briefcase size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Total Tugas
                  </p>
                  <h4 className="text-sm font-black text-slate-800">{totalJobs} Job</h4>
                </div>
              </div>
            </div>

            {/* Row 2: Selesai */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Selesai
                  </p>
                  <h4 className="text-sm font-black text-slate-800">{totalCompleted} Job</h4>
                </div>
              </div>
            </div>

            {/* Row 3: Gagal & Batal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Gagal/Batal
                  </p>
                  <h4 className="text-sm font-black text-slate-800">{totalFailed} Job</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Kehadiran Staff (Attendance Score) */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm flex flex-col xl:flex-row items-center gap-4 min-w-0">
          <div
            style={{ background: attConic }}
            className="w-24 h-24 rounded-full flex items-center justify-center shrink-0"
          >
            <div className="w-16 h-16 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                Hadir
              </span>
              <span className="text-[11px] font-black text-slate-800">{totalPresent} Hari</span>
            </div>
          </div>
          <div className="flex-1 space-y-1.5 w-full min-w-0">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Skor Kehadiran
            </h3>
            <div className="flex items-center justify-between gap-2 text-xs w-full min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="text-slate-600 font-medium truncate">Tepat Waktu</span>
              </div>
              <span className="font-bold text-slate-700 shrink-0">{totalOntime}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs w-full min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                <span className="text-slate-600 font-medium truncate">Terlambat</span>
              </div>
              <span className="font-bold text-amber-600 shrink-0">{totalLate}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs w-full min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span className="text-slate-600 font-medium truncate">Mangkir</span>
              </div>
              <span className="font-bold text-rose-600 shrink-0">{totalAlpha}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Distribusi Status Job */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm flex flex-col xl:flex-row items-center gap-4 min-w-0">
          <div
            style={{ background: jobConic }}
            className="w-24 h-24 rounded-full flex items-center justify-center shrink-0"
          >
            <div className="w-16 h-16 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                Total
              </span>
              <span className="text-[11px] font-black text-slate-800">{totalJobs} Job</span>
            </div>
          </div>
          <div className="flex-1 space-y-1 w-full min-w-0 text-xs">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Status Pekerjaan
            </h3>
            <div className="flex items-center justify-between gap-2 w-full min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="text-slate-600 truncate">Selesai</span>
              </div>
              <span className="font-bold text-slate-700 shrink-0">{totalCompleted}</span>
            </div>
            <div className="flex items-center justify-between gap-2 w-full min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                <span className="text-slate-600 truncate">Kerja</span>
              </div>
              <span className="font-bold text-slate-700 shrink-0">{totalInprogress}</span>
            </div>
            <div className="flex items-center justify-between gap-2 w-full min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                <span className="text-slate-600 truncate">Antrean</span>
              </div>
              <span className="font-bold text-slate-700 shrink-0">{totalPending}</span>
            </div>
            <div className="flex items-center justify-between gap-2 w-full min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
                <span className="text-slate-600 truncate">Kendala</span>
              </div>
              <span className="font-bold text-slate-700 shrink-0">{totalConstraint}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Kontribusi Divisi */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm flex flex-col xl:flex-row items-center gap-4 min-w-0">
          <div
            style={{ background: divConic }}
            className="w-24 h-24 rounded-full flex items-center justify-center shrink-0"
          >
            <div className="w-16 h-16 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center">
                Divisi
              </span>
              <span className="text-[9px] font-black text-slate-800 text-center px-1 truncate w-full">
                {divEntries.length > 0 ? divEntries[0][0] : '-'}
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-1.5 w-full min-w-0 text-xs">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Kontribusi Divisi
            </h3>
            {divEntries.length > 0 ? (
              divEntries.slice(0, 3).map(([name, val], idx) => (
                <div key={name} className="flex items-center justify-between gap-2 w-full min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      style={{ backgroundColor: divColors[idx % divColors.length] }}
                      className="w-2 h-2 rounded-full shrink-0"
                    ></span>
                    <span className="text-slate-600 truncate capitalize">{name}</span>
                  </div>
                  <span className="font-bold text-slate-700 shrink-0">{val}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 italic">Belum ada divisi</p>
            )}
          </div>
        </div>
      </div>

      {/* Teks Analisis Gabungan (Kerja + Absensi) */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        <div className="lg:col-span-1 flex items-center justify-center">
          <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center border border-slate-200">
            <AlertCircle size={24} />
          </div>
        </div>
        <div className="lg:col-span-11 space-y-2">
          <h4 className="text-sm font-extrabold text-slate-800">
            Catatan Evaluasi Kinerja Karyawan
          </h4>
          <div className="text-xs leading-relaxed text-slate-600 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="font-bold text-slate-700">Ringkasan Produktivitas Kerja:</p>
              {mostProductiveStaff && mostProductiveStaff.jobs_completed > 0 ? (
                <p className="mt-1">
                  Penyelesaian tugas terbanyak dicatat oleh {mostProductiveStaff.nama_lengkap} dari
                  divisi {mostProductiveStaff.divisi} dengan total{' '}
                  {mostProductiveStaff.jobs_completed} job diselesaikan. Berdasarkan kontribusi
                  tersebut, akumulasi insentif yang diperoleh adalah{' '}
                  {formatRupiah(mostProductiveStaff.total_insentif)}.
                </p>
              ) : (
                <p className="mt-1 text-slate-500">
                  Belum ada tugas yang diselesaikan pada rentang tanggal ini.
                </p>
              )}
            </div>

            <div>
              <p className="font-bold text-slate-700">Ringkasan Kehadiran & Kedisiplinan:</p>
              <div className="mt-1 space-y-1">
                {mostOntimeStaff ? (
                  <p>
                    Kehadiran tepat waktu paling konsisten dicapai oleh{' '}
                    {mostOntimeStaff.nama_lengkap} dengan total {mostOntimeStaff.att_ontime} kali
                    hadir sesuai jadwal.
                  </p>
                ) : null}
                {mostLateStaff ? (
                  <p>
                    Catatan keterlambatan tertinggi diidentifikasi pada {mostLateStaff.nama_lengkap}{' '}
                    sebanyak {mostLateStaff.att_late} kali terlambat pada periode ini.
                  </p>
                ) : (
                  <p className="text-slate-500">
                    Seluruh staff yang hadir tercatat tepat waktu tanpa keterlambatan pada rentang
                    tanggal ini.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Kinerja & Kehadiran (Mockup Deals Style) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Toggles and Filters */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50 w-fit">
            <button className="px-4 py-1.5 rounded-md text-xs font-bold bg-white text-slate-800 shadow-sm flex items-center gap-1.5">
              <Grid size={12} />
              Daftar Kinerja Staff
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 gap-2 w-64">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama staff atau divisi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs bg-transparent border-none outline-none w-full text-slate-700 placeholder-slate-400"
              />
            </div>

            <div className="flex items-center justify-center p-2 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 cursor-pointer">
              <Filter size={14} />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-5 py-3.5 w-12 text-center">No</th>
                <th className="px-5 py-3.5">Nama Staff</th>
                <th className="px-3 py-3.5">Divisi</th>
                <th className="px-3 py-3.5 text-center">Total Job</th>
                <th className="px-3 py-3.5 text-center text-emerald-600">Selesai</th>
                <th className="px-3 py-3.5 text-center text-rose-500">Gagal</th>
                <th className="px-4 py-3.5 text-center">Status Absensi (Tepat / Telat / Alpha)</th>
                <th className="px-3 py-3.5 text-center">Kategori Kehadiran</th>
                <th className="px-5 py-3.5 text-right">Total Insentif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staff, index) => {
                  // Hitung kategori kedisiplinan
                  const totalPresentStaff = staff.att_ontime + staff.att_late;
                  const lateRatio = totalPresentStaff > 0 ? staff.att_late / totalPresentStaff : 0;

                  let disciplineBadge = (
                    <span className="bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      Tanpa Absensi
                    </span>
                  );

                  if (totalPresentStaff > 0) {
                    if (lateRatio === 0 && staff.att_alpha === 0) {
                      disciplineBadge = (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          Sangat Disiplin
                        </span>
                      );
                    } else if (lateRatio < 0.15) {
                      disciplineBadge = (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          Cepat & Rajin
                        </span>
                      );
                    } else {
                      disciplineBadge = (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                          Sering Terlambat
                        </span>
                      );
                    }
                  }

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 text-center text-slate-400 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-5 py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold capitalize border border-slate-200 shadow-sm shrink-0">
                          {staff.username.charAt(0)}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-800 capitalize">
                            {staff.nama_lengkap}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            @{staff.username}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border border-slate-200">
                          {staff.divisi}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-center font-black text-slate-800">
                        {staff.jobs_total}
                      </td>
                      <td className="px-3 py-4 text-center font-black text-emerald-600">
                        {staff.jobs_completed}
                      </td>
                      <td className="px-3 py-4 text-center font-black text-rose-500">
                        {staff.jobs_failed}
                      </td>

                      {/* Status Absensi Detail */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-100">
                            {staff.att_ontime} Tepat
                          </span>
                          <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-100">
                            {staff.att_late} Telat
                          </span>
                          <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-rose-100">
                            {staff.att_alpha} Alpha
                          </span>
                        </div>
                      </td>

                      {/* Kategori Kehadiran */}
                      <td className="px-3 py-4 text-center">{disciplineBadge}</td>

                      {/* Total Insentif */}
                      <td className="px-5 py-4 text-right font-extrabold text-emerald-600 text-sm">
                        {formatRupiah(staff.total_insentif)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="9"
                    className="text-center py-12 text-slate-400 font-medium bg-slate-50/20"
                  >
                    Tidak ditemukan data hasil kerja staff.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
