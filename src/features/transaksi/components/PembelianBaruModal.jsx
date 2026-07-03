import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import PolarBearEmpty from './PolarBearEmpty';

const inputClass =
  'w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300';

/**
 * Modal "Pembelian Baru" — langkah awal membuat transaksi pembelian.
 * Pilih supplier dahulu (empty-state beruang kutub), lalu isi tanggal,
 * mata uang, dan catatan. Tombol Simpan aktif setelah supplier dipilih.
 */
export default function PembelianBaruModal({ onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10);
  const [supplier, setSupplier] = useState('');
  const [tanggal, setTanggal] = useState(today);
  const [mataUang, setMataUang] = useState('Rupiah');
  const [catatan, setCatatan] = useState('');
  const canSave = supplier.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-12 bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg">Pembelian Baru</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg px-4 py-2 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!canSave}
              onClick={() => onSave?.({ supplier, tanggal, mataUang, catatan })}
              className={`text-sm font-semibold rounded-lg px-5 py-2 transition-colors ${
                canSave
                  ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-sm'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Simpan
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Supplier */}
          <div>
            <label className="block text-sm text-slate-600 mb-1.5">Supplier</label>
            <input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Cari Supplier"
              className={inputClass}
            />
          </div>

          {/* Empty-state: pilih supplier dahulu */}
          {!canSave && (
            <div className="rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col items-center justify-center py-6">
              <PolarBearEmpty />
              <p className="text-slate-500 text-sm font-medium -mt-2">
                Pilih supplier terlebih dahulu
              </p>
            </div>
          )}

          {/* Tanggal & Mata Uang */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1.5">Tanggal Beli</label>
              <div className="relative">
                <Calendar
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1.5">Mata Uang Pembelian</label>
              <div className="relative">
                <select
                  value={mataUang}
                  onChange={(e) => setMataUang(e.target.value)}
                  className={`${inputClass} appearance-none cursor-pointer pr-9`}
                >
                  <option value="Rupiah">Rupiah</option>
                  <option value="USD">USD</option>
                  <option value="SGD">SGD</option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-sm text-slate-600 mb-1.5">Catatan</label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              placeholder="Catatan"
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
