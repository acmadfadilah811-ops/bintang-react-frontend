import { useState, useEffect } from 'react';
import {
  Boxes,
  Save,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  FileText,
  HelpCircle,
  Database,
} from 'lucide-react';
import { useTransaksiCrumb } from '../../transaksi/components/TransaksiContext';

export default function SistemStok() {
  const { setSubtitle } = useTransaksiCrumb();

  useEffect(() => {
    setSubtitle('Sistem Stok');
  }, [setSubtitle]);

  // State untuk setelan sistem stok
  const [valMethod, setValMethod] = useState('average');
  const [allowNegative, setAllowNegative] = useState(false);
  const [minStockAlert, setMinStockAlert] = useState(true);
  const [minStockValue, setMinStockValue] = useState('10');
  const [realtimeSync, setRealtimeSync] = useState(true);
  const [allowSpkNoStock, setAllowSpkNoStock] = useState(true);
  const [autoLogMutation, setAutoLogMutation] = useState(true);

  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 800);
  };

  const inputCls =
    'w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all';

  return (
    <div className="flex flex-col flex-1 bg-slate-50 min-h-screen p-6">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-800 animate-slide-up-fade">
          <CheckCircle size={16} className="text-emerald-400" />
          <span className="text-xs font-semibold">Pengaturan Sistem Stok berhasil disimpan!</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto w-full">
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Boxes size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Kebijakan & Sistem Stok</h3>
                <p className="text-[11px] text-slate-400">Kelola metode penilaian aset persediaan dan aturan logistik inventori.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-60 transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {saving ? 'Menyimpan...' : 'Simpan Setelan'}
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-6 divide-y divide-slate-100">
            
            {/* 1. Metode Penilaian Persediaan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-blue-500" /> Metode Valuasi
                </h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Metode akuntansi untuk menghitung Harga Pokok Penjualan (HPP) dan nilai inventori gudang.
                </p>
              </div>
              <div className="md:col-span-2">
                <select
                  value={valMethod}
                  onChange={(e) => setValMethod(e.target.value)}
                  className={inputCls}
                >
                  <option value="average">Weighted Average Cost (Rata-rata tertimbang - Direkomendasikan)</option>
                  <option value="fifo">FIFO (First In First Out - Pertama Masuk Pertama Keluar)</option>
                  <option value="lifo">LIFO (Last In First Out - Terakhir Masuk Pertama Keluar)</option>
                </select>
                <div className="mt-2 flex items-start gap-1.5 text-[10px] text-slate-450 text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <HelpCircle size={14} className="shrink-0 text-slate-400 mt-0.5" />
                  <span>
                    Metode <b>Average</b> membagi total biaya barang yang tersedia dengan jumlah unit untuk menghitung harga pokok rata-rata.
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Izinkan Stok Minus */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-500" /> Izinkan Stok Minus
                </h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Mengizinkan penjualan kasir di POS terus berlanjut meskipun jumlah stok fisik di sistem telah habis (0).
                </p>
              </div>
              <div className="md:col-span-2 flex items-center">
                <div className="flex items-center gap-3">
                  <Toggle active={allowNegative} onChange={() => setAllowNegative(!allowNegative)} />
                  <span className="text-[11px] font-semibold text-slate-600">
                    {allowNegative ? 'Aktif (Kasir dapat menjual tanpa batas stok)' : 'Nonaktif (Penjualan diblokir jika stok kosong)'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Peringatan Stok Minimum */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Bell size={14} className="text-rose-500" /> Alarm Stok Minimum
                </h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Berikan tanda peringatan kuning di dasbor jika stok barang berada di bawah jumlah batas aman.
                </p>
              </div>
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center gap-3">
                  <Toggle active={minStockAlert} onChange={() => setMinStockAlert(!minStockAlert)} />
                  <span className="text-[11px] font-semibold text-slate-600">
                    {minStockAlert ? 'Alarm Aktif' : 'Alarm Nonaktif'}
                  </span>
                </div>
                {minStockAlert && (
                  <div className="flex items-center gap-2 max-w-[200px] animate-fade-in">
                    <input
                      type="number"
                      value={minStockValue}
                      onChange={(e) => setMinStockValue(e.target.value)}
                      placeholder="10"
                      className={inputCls}
                      min="1"
                    />
                    <span className="text-xs text-slate-500 font-bold whitespace-nowrap">Pcs / Lembar</span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Sinkronisasi POS Real-time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <RefreshCw size={14} className="text-emerald-500" /> Sinkronisasi Real-Time
                </h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Lakukan pemotongan stok bahan otomatis di server awan sesaat setelah invoice POS dicetak.
                </p>
              </div>
              <div className="md:col-span-2 flex items-center">
                <div className="flex items-center gap-3">
                  <Toggle active={realtimeSync} onChange={() => setRealtimeSync(!realtimeSync)} />
                  <span className="text-[11px] font-semibold text-slate-600">
                    {realtimeSync ? 'Aktif (Instan & Sinkron)' : 'Nonaktif (Dijadwalkan tiap jam)'}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. SPK Cetak Tanpa Bahan Baku */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText size={14} className="text-indigo-500" /> Rilis Surat Kerja (SPK)
                </h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Tetap rilis SPK untuk dikerjakan tim produksi meskipun sistem mendeteksi bahan belum dibeli/stok kurang.
                </p>
              </div>
              <div className="md:col-span-2 flex items-center">
                <div className="flex items-center gap-3">
                  <Toggle active={allowSpkNoStock} onChange={() => setAllowSpkNoStock(!allowSpkNoStock)} />
                  <span className="text-[11px] font-semibold text-slate-600">
                    {allowSpkNoStock ? 'Izinkan Produksi Dahulu' : 'Tolak Cetak SPK (Harus PO bahan terlebih dahulu)'}
                  </span>
                </div>
              </div>
            </div>

            {/* 6. Pencatatan Mutasi Otomatis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Database size={14} className="text-teal-500" /> Audit Log Mutasi
                </h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Simpan riwayat mutasi masuk/keluar stok secara mendalam beserta data nama staf/kasir yang mengubahnya.
                </p>
              </div>
              <div className="md:col-span-2 flex items-center">
                <div className="flex items-center gap-3">
                  <Toggle active={autoLogMutation} onChange={() => setAutoLogMutation(!autoLogMutation)} />
                  <span className="text-[11px] font-semibold text-slate-600">
                    {autoLogMutation ? 'Log Audit Aktif (Direkomendasikan)' : 'Log Audit Nonaktif'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}

// Sub-komponen Toggle reusable
function Toggle({ active, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
        active ? 'bg-blue-600' : 'bg-slate-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          active ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
