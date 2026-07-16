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
      <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5">
        <div>
          <h2 className="text-slate-800 font-bold text-[15px]">Daftar Diskon Penjualan</h2>
          <p className="text-slate-400 text-xs mt-0.5">{rows.length} Items</p>
        </div>
        <button
          type="button"
          onClick={() => setView('create')}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer transition-colors"
        >
          <Plus size={16} /> Tambah
        </button>
      </div>

      {error && <p className="px-6 pt-3 text-xs text-rose-600">{error}</p>}

      <div className="px-6 py-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              {['Min. Order', 'Diskon', 'Mulai', 'Kadaluarsa', 'Aksi'].map((c) => (
                <th key={c} className="px-2 py-3 text-sm font-semibold text-slate-600 whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-2 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-slate-400 mt-3">{loading ? 'Memuat...' : 'No Data'}</span>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-2 py-3 text-sm text-slate-600">{fmtRupiah(row.minimal_total_pesanan)}</td>
                  <td className="px-2 py-3 text-sm text-slate-600">{fmtDiskon(row)}</td>
                  <td className="px-2 py-3 text-sm text-slate-600">{fmtDate(row.tanggal_aktif)}</td>
                  <td className="px-2 py-3 text-sm text-slate-600">{row.tanpa_kadaluarsa ? 'Tanpa Kadaluarsa' : fmtDate(row.tanggal_kadaluarsa)}</td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <StatusToggle active={row.is_active} onToggle={() => handleToggle(row)} />
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(row);
                          setView('edit');
                        }}
                        className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                        title="Ubah"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 size={15} />
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
  );
}
