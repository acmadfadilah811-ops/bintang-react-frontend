import { useState } from 'react';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import { fmtDate } from '../format';
import { StatusToggle } from './Common';
import PromoTipeDropdown from './PromoTipeDropdown';
import SalinDiskonButton from './SalinDiskonButton';

/** Daftar Promosi (POS) — toolbar filter + tabel. */
export default function PromosiPosList({ rows, loading, error, onAdd, onEdit, onRefresh }) {
  const [tipe, setTipe] = useState('Semua');
  const [judul, setJudul] = useState('Judul');
  const [cari, setCari] = useState('');

  const handleToggle = async (row) => {
    try {
      await apiClient.post(`/pos-promotions/${row.id}/toggle-status/`);
      onRefresh();
    } catch (err) {
      console.error('[VoucherDiskon] toggle promotion error:', err);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Hapus promosi "${row.judul}"?`)) return;
    try {
      await apiClient.delete(`/pos-promotions/${row.id}/`);
      onRefresh();
    } catch (err) {
      console.error('[VoucherDiskon] delete promotion error:', err);
    }
  };

  const filtered = rows.filter((row) => {
    if (tipe !== 'Semua' && row.tipe_promosi !== tipe) return false;
    if (!cari.trim()) return true;
    const q = cari.trim().toLowerCase();
    if (judul === 'Judul') return row.judul.toLowerCase().includes(q);
    if (judul === 'Produk') return row.produk.toLowerCase().includes(q);
    if (judul === 'Grup Produk') return row.grup_produk.toLowerCase().includes(q);
    if (judul === 'Paket Produk') return row.paket_produk.toLowerCase().includes(q);
    if (judul === 'Brand') return row.brand.toLowerCase().includes(q);
    if (judul === 'Gratis Produk') return row.produk_gratis.toLowerCase().includes(q);
    return row.judul.toLowerCase().includes(q);
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex flex-wrap items-center gap-2">
        <PromoTipeDropdown value={tipe} onChange={setTipe} />

        <div className="flex-1 min-w-[260px] flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white focus-within:border-blue-400">
          <select value={judul} onChange={(e) => setJudul(e.target.value)} className="bg-transparent text-sm text-slate-700 px-3 py-2 outline-none cursor-pointer">
            <option>Judul</option>
            <option>Grup Produk</option>
            <option>Paket Produk</option>
            <option>Produk</option>
            <option>Brand</option>
            <option>Gratis Produk</option>
          </select>
          <div className="w-px h-6 bg-slate-200" />
          <div className="flex-1 flex items-center gap-2 px-3">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari"
              className="w-full text-sm bg-transparent outline-none text-slate-700 placeholder-slate-400 py-2"
            />
          </div>
        </div>

        <SalinDiskonButton rows={rows} onCopied={onRefresh} />
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer transition-colors"
        >
          <Plus size={16} /> Tambah
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col items-center justify-center py-16">
          <span className="text-sm text-slate-400 mt-3">{loading ? 'Memuat...' : 'Belum ada promosi'}</span>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                {['Judul', 'Tipe', 'Mulai', 'Kadaluarsa', 'Aksi'].map((c) => (
                  <th key={c} className="px-2 py-3 text-sm font-semibold text-slate-600 whitespace-nowrap">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-2 py-3 text-sm text-slate-600">{row.judul}</td>
                  <td className="px-2 py-3 text-sm text-slate-600">{row.tipe_promosi}</td>
                  <td className="px-2 py-3 text-sm text-slate-600">{fmtDate(row.tanggal_aktif)}</td>
                  <td className="px-2 py-3 text-sm text-slate-600">{row.tanpa_kadaluarsa ? 'Tanpa Kadaluarsa' : fmtDate(row.tanggal_kadaluarsa)}</td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <StatusToggle active={row.is_active} onToggle={() => handleToggle(row)} />
                      <button
                        type="button"
                        onClick={() => onEdit(row)}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
