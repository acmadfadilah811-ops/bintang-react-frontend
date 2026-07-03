import { useState } from 'react';
import { Calendar } from 'lucide-react';

const inputClass =
  'w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300';

function Field({ label, children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-1.5 md:gap-6 md:items-start">
      <label className="text-sm text-slate-500 md:pt-2.5">{label}</label>
      <div>{children}</div>
    </div>
  );
}

/**
 * Form "Tambah Pengembalian Pesanan" (mode create pada tab Pengembalian).
 */
export default function ReturnOrderForm({ onCancel, onSave }) {
  const [customer, setCustomer] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [mataUang, setMataUang] = useState('');
  const [catatan, setCatatan] = useState('');
  const canSave = customer.trim().length > 0;

  return (
    <div className="p-6">
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
          <h3 className="text-slate-800 font-bold text-[15px]">Tambah Pengembalian Pesanan</h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!canSave}
              onClick={() => onSave?.({ customer, orderNo, tanggal, mataUang, catatan })}
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

        <div className="p-6 space-y-8">
          {/* Pelanggan */}
          <section>
            <h4 className="text-blue-600 font-bold text-sm mb-4">
              Pelanggan <span className="text-rose-500">*</span>
            </h4>
            <div className="space-y-4">
              <Field label="Nama atau email">
                <input
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Cari Pelanggan"
                  className={inputClass}
                />
              </Field>
              <Field label="No. Pesanan">
                <input
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                  placeholder="Cari No. Pesanan"
                  className={inputClass}
                />
              </Field>
            </div>
          </section>

          {/* Pengembalian */}
          <section>
            <h4 className="text-blue-600 font-bold text-sm mb-4">
              Pengembalian <span className="text-rose-500">*</span>
            </h4>
            <div className="space-y-4">
              <Field label="Tanggal Pengembalian">
                <div className="relative max-w-xs">
                  <Calendar
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={tanggal}
                    placeholder="Pilih hari"
                    onFocus={(e) => (e.currentTarget.type = 'date')}
                    onBlur={(e) => {
                      if (!e.currentTarget.value) e.currentTarget.type = 'text';
                    }}
                    onChange={(e) => setTanggal(e.target.value)}
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </Field>
              <Field label="Mata Uang Dasar">
                <select
                  value={mataUang}
                  onChange={(e) => setMataUang(e.target.value)}
                  className={`${inputClass} max-w-xs cursor-pointer ${mataUang ? '' : 'text-slate-400'}`}
                >
                  <option value="" disabled>
                    Pilih salah satu
                  </option>
                  <option value="Rupiah">Rupiah</option>
                  <option value="USD">USD</option>
                  <option value="SGD">SGD</option>
                </select>
              </Field>
              <Field label="Catatan">
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={3}
                  placeholder="Masukkan Catatan"
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
