import { useState } from 'react';
import { Check, Calendar } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import { useAuth } from '../../../context/AuthContext';
import { extractApiError, inputCls } from '../format';
import { FormRow, Toggle, PercentNominalField, ErrorBanner } from './Common';
import TagPicker from './TagPicker';

/** Form "Tambah/Ubah Diskon Penjualan". */
export default function TambahDiskonForm({ initial, onCancel, onSaved }) {
  const { user, businessSettings } = useAuth();
  const accountName = businessSettings?.nama_bisnis || user?.name || user?.email || 'Akun';
  const [tanggalAktif, setTanggalAktif] = useState(initial?.tanggal_aktif || new Date().toISOString().slice(0, 10));
  const [noExpiry, setNoExpiry] = useState(initial ? initial.tanpa_kadaluarsa : true);
  const [tanggalKadaluarsa, setTanggalKadaluarsa] = useState(initial?.tanggal_kadaluarsa || '');
  const [minimalTotal, setMinimalTotal] = useState(initial ? String(initial.minimal_total_pesanan) : '0');
  const [discountType, setDiscountType] = useState(initial?.tipe_diskon || 'percent');
  const [jumlahDiskon, setJumlahDiskon] = useState(initial ? String(initial.jumlah_diskon) : '');
  const [tipePelanggan, setTipePelanggan] = useState(initial?.tipe_pelanggan || '');
  const [brand, setBrand] = useState(initial?.brand || '');
  const [catatan, setCatatan] = useState(initial?.catatan || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!tanggalAktif) {
      setError('Tanggal Aktif wajib diisi.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      tanggal_aktif: tanggalAktif,
      tanpa_kadaluarsa: noExpiry,
      tanggal_kadaluarsa: noExpiry ? null : tanggalKadaluarsa || null,
      minimal_total_pesanan: parseFloat(minimalTotal) || 0,
      tipe_diskon: discountType,
      jumlah_diskon: parseFloat(jumlahDiskon) || 0,
      tipe_pelanggan: tipePelanggan,
      brand,
      catatan,
    };
    try {
      if (initial?.id) {
        await apiClient.patch(`/sales-discounts/${initial.id}/`, payload);
      } else {
        await apiClient.post('/sales-discounts/', payload);
      }
      onSaved();
    } catch (err) {
      console.error('[VoucherDiskon] save sales discount error:', err);
      setError(extractApiError(err, 'Gagal menyimpan diskon penjualan.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-slate-100">
        <h2 className="text-slate-800 font-extrabold text-[15px]">{initial ? 'Ubah' : 'Tambah'} Diskon Penjualan</h2>
        <div className="flex items-center gap-4">
          <button type="button" onClick={onCancel} className="text-slate-500 hover:text-slate-700 text-xs font-bold cursor-pointer transition-colors">
            Batal
          </button>
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-400 leading-none mb-1 uppercase tracking-wider">Simpan di:</div>
            <select className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer">
              <option>{accountName}</option>
            </select>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60 text-white rounded-xl px-4.5 py-2.5 text-xs font-bold cursor-pointer transition-all active:scale-[0.98] shadow-md shadow-emerald-500/10"
          >
            <Check size={14} /> {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>

      <ErrorBanner message={error} />

      <div className="divide-y divide-slate-100">
        <FormRow label="Tanggal Aktif" required>
          <div className="relative">
            <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="date" value={tanggalAktif} onChange={(e) => setTanggalAktif(e.target.value)} className={`${inputCls} pl-9`} />
          </div>
        </FormRow>

        <FormRow label="Tanpa Kadaluarsa">
          <div className="flex items-center gap-2">
            <Toggle on={noExpiry} onChange={setNoExpiry} />
            <span className="text-sm text-slate-600">{noExpiry ? 'Ya' : 'Tidak'}</span>
          </div>
        </FormRow>

        {!noExpiry && (
          <FormRow label="Tanggal Kadaluarsa">
            <input type="date" value={tanggalKadaluarsa} onChange={(e) => setTanggalKadaluarsa(e.target.value)} className={inputCls} />
          </FormRow>
        )}

        <FormRow label="Minimal Total Harga Pesanan" help="Minimal jumlah pembelian untuk mendapatkan diskon ini">
          <input type="number" min="0" value={minimalTotal} onChange={(e) => setMinimalTotal(e.target.value)} className={inputCls} />
        </FormRow>

        <FormRow label="Jumlah Diskon" help="Cukup hanya masukkan angka saja, tanpa simbol persen (%), minimal: 0 dan maksimal: 100">
          <div className="space-y-2">
            <PercentNominalField value={discountType} onChange={setDiscountType} />
            <input
              type="number"
              min="0"
              placeholder="Masukkan angka contoh: 1234"
              value={jumlahDiskon}
              onChange={(e) => setJumlahDiskon(e.target.value)}
              className={inputCls}
            />
          </div>
        </FormRow>

        <FormRow label="Berlaku untuk pelanggan" help="Kosongkan jika berlaku untuk semua pelanggan">
          <TagPicker value={tipePelanggan} onChange={setTipePelanggan} fetchUrl="/contacts/" placeholder="Cari pelanggan..." />
        </FormRow>

        <FormRow label="Berlaku untuk brand" help="Kosongkan jika berlaku untuk semua brand">
          <TagPicker value={brand} onChange={setBrand} fetchUrl="/brands/" placeholder="Cari brand..." />
        </FormRow>

        <FormRow label="Catatan" help="Opsional">
          <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2} className={inputCls} />
        </FormRow>
      </div>
    </div>
  );
}
