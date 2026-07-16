import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import { fmtDate, fmtDiskon, fmtRupiah } from '../format';
import { StatusToggle } from './Common';
import TambahDiskonForm from './TambahDiskonForm';

/** Tab "Diskon Penjualan". */
export default function DiskonPenjualanTab() {
  const [view, setView] = useState('list');
  const [editing, setEditing] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/sales-discounts/');
      setRows(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      console.error('[VoucherDiskon] fetch sales discounts error:', err);
      setError('Gagal memuat daftar diskon penjualan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const handleToggle = async (row) => {
    try {
      const res = await apiClient.post(`/sales-discounts/${row.id}/toggle-status/`);
      setRows((prev) => prev.map((r) => (r.id === row.id ? res.data : r)));
    } catch (err) {
      console.error('[VoucherDiskon] toggle sales discount error:', err);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Hapus diskon penjualan ini?')) return;
    try {
      await apiClient.delete(`/sales-discounts/${row.id}/`);
      fetchRows();
    } catch (err) {
      console.error('[VoucherDiskon] delete sales discount error:', err);
    }
  };

  if (view === 'create' || view === 'edit') {
    return (
      <TambahDiskonForm
        initial={editing}
        onCancel={() => {
          setView('list');
          setEditing(null);
        }}
        onSaved={() => {
          setView('list');
          setEditing(null);
          fetchRows();
        }}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-slate-50">
        <div>
          <h2 className="text-slate-800 font-extrabold text-base">Daftar Diskon Penjualan</h2>
          <p className="text-slate-400 text-xs mt-0.5 font-medium">{rows.length} Items</p>
        </div>
        <button
          type="button"
          onClick={() => setView('create')}
          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs font-bold text-white rounded-xl px-4.5 py-2.5 cursor-pointer transition-all active:scale-[0.98] shadow-md shadow-blue-500/10"
        >
          <Plus size={14} /> Tambah
        </button>
      </div>

      {error && <p className="px-6 pt-3 text-xs text-rose-600 font-semibold">{error}</p>}

      <div className="px-6 py-4">
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Min. Order', 'Diskon', 'Mulai', 'Kadaluarsa', 'Aksi'].map((c) => (
                  <th key={c} className="px-4 py-3 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase whitespace-nowrap">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-slate-400">{loading ? 'Memuat...' : 'No Data'}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/30 transition-colors">
                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-700">{fmtRupiah(row.minimal_total_pesanan)}</td>
                    <td className="px-4 py-3.5 text-sm font-bold text-slate-800">{fmtDiskon(row)}</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-slate-500">{fmtDate(row.tanggal_aktif)}</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-slate-500">{row.tanpa_kadaluarsa ? 'Tanpa Kadaluarsa' : fmtDate(row.tanggal_kadaluarsa)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <StatusToggle active={row.is_active} onToggle={() => handleToggle(row)} />
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(row);
                            setView('edit');
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Ubah"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
