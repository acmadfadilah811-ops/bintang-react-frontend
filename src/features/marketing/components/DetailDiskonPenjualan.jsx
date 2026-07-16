import { useState } from 'react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import { fmtDate, fmtDiskon, fmtRupiah } from '../format';
import { StatusToggle } from './Common';

/** Tampilan detail untuk Diskon Penjualan */
export default function DetailDiskonPenjualan({ row, onCancel, onEdit, onSaved }) {
  const [active, setActive] = useState(row.is_active);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    try {
      const res = await apiClient.post(`/sales-discounts/${row.id}/toggle-status/`);
      setActive(res.data.is_active);
      if (onSaved) onSaved();
    } catch (err) {
      console.error('[DetailDiskonPenjualan] toggle error:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Hapus diskon penjualan ini?')) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/sales-discounts/${row.id}/`);
      if (onSaved) onSaved();
      onCancel();
    } catch (err) {
      console.error('[DetailDiskonPenjualan] delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100 mb-6">
        <h2 className="text-slate-800 font-extrabold text-base">Rincian Diskon</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft size={14} /> Kembali
          </button>
          <button
            type="button"
            onClick={() => onEdit(row)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Pencil size={14} /> Ubah
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Kiri & Tengah: Rincian & Badge */}
        <div className="md:col-span-2 flex flex-col sm:flex-row gap-6 items-start justify-between border border-slate-100 rounded-2xl p-6 bg-slate-50/20">
          <div className="space-y-4">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Min. Total Harga Pesanan</div>
              <div className="text-sm font-semibold text-slate-700">{fmtRupiah(row.minimal_total_pesanan)}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tanggal Aktif</div>
              <div className="text-sm font-semibold text-slate-700">{fmtDate(row.tanggal_aktif)}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tanggal Berakhir</div>
              <div className="text-sm font-semibold text-slate-700">
                {row.tanpa_kadaluarsa ? 'Tanpa kadaluarsa' : fmtDate(row.tanggal_kadaluarsa)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Keaktifan</div>
              <div className="flex items-center gap-2">
                <StatusToggle active={active} onToggle={handleToggle} />
                <span className="text-xs font-bold text-slate-500">{active ? 'Aktif' : 'Nonaktif'}</span>
              </div>
            </div>
          </div>

          <div className="bg-rose-500 text-white p-6 rounded-2xl flex flex-col justify-center items-center shadow-lg shadow-rose-500/10 w-full sm:w-44 h-28 shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-100 opacity-90 mb-1">Jumlah Diskon</span>
            <span className="text-3xl font-extrabold tracking-tight">{fmtDiskon(row)}</span>
          </div>
        </div>

        {/* Kolom Kanan: Kriteria */}
        <div className="space-y-4">
          <div className="border border-slate-150 rounded-2xl p-5 bg-white shadow-sm">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Berlaku untuk pelanggan</h3>
            <div className="text-xs text-slate-500 leading-relaxed font-semibold">
              {row.tipe_pelanggan ? row.tipe_pelanggan : 'Semua pelanggan'}
            </div>
          </div>

          <div className="border border-slate-150 rounded-2xl p-5 bg-white shadow-sm">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Berlaku untuk brand</h3>
            <div className="text-xs text-slate-500 leading-relaxed font-semibold">
              {row.brand ? row.brand : 'Semua brand'}
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Delete */}
      <div className="mt-8 pt-5 border-t border-slate-100 flex justify-start">
        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          className="flex items-center gap-1.5 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer"
        >
          <Trash2 size={14} /> {deleting ? 'Menghapus...' : 'Hapus'}
        </button>
      </div>
    </div>
  );
}
