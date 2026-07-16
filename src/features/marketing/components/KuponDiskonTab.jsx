import { useState, useEffect } from 'react';
import { Plus, ChevronsUpDown, Pencil, Trash2 } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import { fmtDate, fmtDiskon } from '../format';
import { StatusToggle } from './Common';
import TambahKuponForm from './TambahKuponForm';

/** Tab "Kupon Diskon". */
export default function KuponDiskonTab() {
  const [view, setView] = useState('list');
  const [editing, setEditing] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const fetchRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/discount-coupons/');
      setRows(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      console.error('[VoucherDiskon] fetch coupons error:', err);
      setError('Gagal memuat daftar kupon diskon.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const handleToggle = async (row) => {
    try {
      const res = await apiClient.post(`/discount-coupons/${row.id}/toggle-status/`);
      setRows((prev) => prev.map((r) => (r.id === row.id ? res.data : r)));
    } catch (err) {
      console.error('[VoucherDiskon] toggle coupon error:', err);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Hapus kupon "${row.kode}"?`)) return;
    try {
      await apiClient.delete(`/discount-coupons/${row.id}/`);
      fetchRows();
    } catch (err) {
      console.error('[VoucherDiskon] delete coupon error:', err);
    }
  };

  if (view === 'create' || view === 'edit') {
    return (
      <TambahKuponForm
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

  const cols = [
    { key: 'kode', label: 'Kode' },
    { key: 'judul', label: 'Judul' },
    { key: null, label: 'Diskon' },
    { key: 'tanggal_aktif', label: 'Mulai' },
    { key: null, label: 'Berakhir' },
    { key: null, label: 'Kadaluarsa' },
    { key: null, label: 'Penggunaan' },
    { key: null, label: 'Aksi' },
  ];

  const sortedRows = sortKey
    ? [...rows].sort((a, b) => {
        const va = String(a[sortKey] || '');
        const vb = String(b[sortKey] || '');
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      })
    : rows;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5">
        <div>
          <h2 className="text-slate-800 font-bold text-[15px]">Daftar Kupon Diskon</h2>
          <p className="text-slate-400 text-xs mt-0.5">{rows.length} Item</p>
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

      <div className="px-6 py-4 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              {cols.map((c) => (
                <th
                  key={c.label}
                  onClick={() => c.key && (setSortKey(c.key), setSortDir((d) => (sortKey === c.key && d === 'asc' ? 'desc' : 'asc')))}
                  className={`px-2 py-3 text-sm font-semibold text-slate-600 whitespace-nowrap ${c.key ? 'cursor-pointer select-none' : ''}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.label}
                    {c.key && <ChevronsUpDown size={13} className={sortKey === c.key ? 'text-blue-500' : 'text-slate-300'} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="px-2 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-slate-400 mt-3">{loading ? 'Memuat...' : 'No Data'}</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => (
                <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-2 py-3 text-sm font-semibold text-blue-600 whitespace-nowrap">{row.kode}</td>
                  <td className="px-2 py-3 text-sm text-slate-600">{row.judul}</td>
                  <td className="px-2 py-3 text-sm text-slate-600">{fmtDiskon(row)}</td>
                  <td className="px-2 py-3 text-sm text-slate-600">{fmtDate(row.tanggal_aktif)}</td>
                  <td className="px-2 py-3 text-sm text-slate-600">{row.tanpa_kadaluarsa ? '-' : fmtDate(row.tanggal_kadaluarsa)}</td>
                  <td className="px-2 py-3 text-sm text-slate-600">{row.tanpa_kadaluarsa ? 'Tanpa Kadaluarsa' : 'Ya'}</td>
                  <td className="px-2 py-3 text-sm text-slate-600">
                    {row.unlimited_usage ? `${row.penggunaan_count} (Tidak Terbatas)` : `${row.penggunaan_count} / ${row.batas_penggunaan ?? '-'}`}
                  </td>
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
