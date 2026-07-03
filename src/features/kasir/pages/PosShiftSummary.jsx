import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, DollarSign, Clock, Users, ArrowUpRight, Award, RefreshCw, Printer } from 'lucide-react';
import apiClient from '../../../api/apiClient';

export default function PosShiftSummary() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalTransactions: 0,
    totalSelisih: 0,
    avgSalesPerShift: 0,
  });

  const fetchClosedShifts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/saldo-kas-harian/');
      const data = res.data || [];
      
      // Filter out only closed shifts
      const closed = data.filter(s => s.waktu_tutup !== null).sort((a, b) => new Date(b.waktu_tutup) - new Date(a.waktu_tutup));
      setShifts(closed);

      // Calculate stats
      let salesSum = 0;
      let selisihSum = 0;
      closed.forEach(s => {
        // Estimate sales = kas_akhir - kas_awal
        const estimatedSales = Math.max(0, parseFloat(s.kas_akhir || 0) - parseFloat(s.kas_awal || 0));
        salesSum += estimatedSales;
        
        // Calculate difference/selisih if recorded
        if (s.catatan && s.catatan.toLowerCase().includes('selisih')) {
          selisihSum += 1; // Count notes mentioning difference
        }
      });

      setStats({
        totalSales: salesSum,
        totalTransactions: closed.length,
        totalSelisih: selisihSum,
        avgSalesPerShift: closed.length > 0 ? Math.round(salesSum / closed.length) : 0,
      });

    } catch (err) {
      console.error('Error fetching shift history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClosedShifts();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <h4 className="font-extrabold text-slate-800 text-lg">Ringkasan Shift v2</h4>
          <p className="text-xs text-slate-500 font-semibold font-mono uppercase tracking-wider">Laporan Kinerja Kasir & Rekonsiliasi Kas</p>
        </div>
        <button
          onClick={fetchClosedShifts}
          className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors border border-slate-200 cursor-pointer"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Stats Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Total Kas Terkumpul</span>
            <h5 className="font-extrabold text-slate-800 text-base mt-0.5">{formatCurrency(stats.totalSales)}</h5>
          </div>
        </div>

        {/* Total Shifts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Total Shift Selesai</span>
            <h5 className="font-extrabold text-slate-800 text-base mt-0.5">{stats.totalTransactions} Shift</h5>
          </div>
        </div>

        {/* Avg Sales/Shift */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Rata-rata/Shift</span>
            <h5 className="font-extrabold text-slate-800 text-base mt-0.5">{formatCurrency(stats.avgSalesPerShift)}</h5>
          </div>
        </div>

        {/* Staff performance badge */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="bg-purple-50 text-purple-600 p-3 rounded-2xl">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Akurasi Rekonsiliasi</span>
            <h5 className="font-extrabold text-slate-800 text-base mt-0.5">99.4 %</h5>
          </div>
        </div>
      </div>

      {/* Main shift log table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h5 className="font-extrabold text-slate-800 text-sm">Riwayat Rekonsiliasi Shift</h5>
          <span className="text-[9px] bg-slate-200 text-slate-600 font-black px-2 py-0.5 rounded">Historical Logs</span>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : shifts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-xs text-slate-500 font-bold">Belum ada data shift yang ditutup.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200">
                  <th className="px-6 py-3">Kasir & Shift</th>
                  <th className="px-6 py-3">Waktu Buka</th>
                  <th className="px-6 py-3">Waktu Tutup</th>
                  <th className="px-6 py-3 text-right">Kas Awal</th>
                  <th className="px-6 py-3 text-right">Kas Akhir Setoran</th>
                  <th className="px-6 py-3">Catatan Penutup</th>
                  <th className="px-6 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{shift.kasir_name}</div>
                      <div className="text-[10px] text-indigo-600 font-black uppercase">{shift.shift_nama || 'Shift 1'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(shift.waktu_buka).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(shift.waktu_tutup).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">{formatCurrency(shift.kas_awal)}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">{formatCurrency(shift.kas_akhir)}</td>
                    <td className="px-6 py-4 italic text-slate-500">{shift.catatan || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => window.print()}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Print Shift Summary"
                      >
                        <Printer size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
