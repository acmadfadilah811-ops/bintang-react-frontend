import { useState } from 'react';
import { Check } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import { useAuth } from '../../../context/AuthContext';
import { extractApiError, inputCls } from '../format';
import { FormRow, Toggle, ErrorBanner } from './Common';
import TagPicker from './TagPicker';

const PROMO_DAYS = [
  ['min', 'Minggu'],
  ['sen', 'Senin'],
  ['sel', 'Selasa'],
  ['rab', 'Rabu'],
  ['kam', 'Kamis'],
  ['jum', 'Jumat'],
  ['sab', 'Sabtu'],
];
const PROMO_DAY_KEYS = PROMO_DAYS.map(([k]) => k);

const TIPE_PROMOSI_LABEL = {
  BX: 'BX (Beli produk tertentu, gratis produk lain)',
  DQ: 'DQ (Diskon jika membeli produk dengan kuantitas tertentu)',
  DA: 'DA (Diskon jika memenuhi total transaksi yang ditentukan)',
  FI: 'FI (Gratis produk)',
};

/** Form "Tambah/Ubah Promosi (POS)". */
export default function TambahPromosiForm({ initial, onCancel, onSaved }) {
  const { user, businessSettings } = useAuth();
  const accountName = businessSettings?.nama_bisnis || user?.name || user?.email || 'Akun';
  const [judul, setJudul] = useState(initial?.judul || '');
  const [tipe, setTipe] = useState(initial?.tipe_promosi || 'BX');
  const [combineQty, setCombineQty] = useState(initial ? initial.combine_qty : true);
  const [combineQtyValue, setCombineQtyValue] = useState(initial ? String(initial.combine_qty_value) : '1');
  const [produk, setProduk] = useState(initial?.produk || '');
  const [grupProduk, setGrupProduk] = useState(initial?.grup_produk || '');
  const [paketProduk, setPaketProduk] = useState(initial?.paket_produk || '');
  const [brand, setBrand] = useState(initial?.brand || '');
  const [berlakuMembeli, setBerlakuMembeli] = useState(initial?.berlaku_membeli || 'semua');
  const [produkGratis, setProdukGratis] = useState(initial?.produk_gratis || '');
  const [kelipatan, setKelipatan] = useState(initial ? initial.berlaku_kelipatan : false);
  const [allCustomers, setAllCustomers] = useState(initial ? initial.all_customers : true);
  const [tipePelanggan, setTipePelanggan] = useState(initial?.tipe_pelanggan || '');
  const [pelanggan, setPelanggan] = useState(initial?.pelanggan || '');
  const [tanggalAktif, setTanggalAktif] = useState(initial?.tanggal_aktif || new Date().toISOString().slice(0, 10));
  const [noExpiry, setNoExpiry] = useState(initial ? initial.tanpa_kadaluarsa : true);
  const [tanggalKadaluarsa, setTanggalKadaluarsa] = useState(initial?.tanggal_kadaluarsa || '');
  const [jam24, setJam24] = useState(initial ? initial.jam_24 : true);
  const [jamMulai, setJamMulai] = useState(initial?.jam_mulai || '');
  const [jamBerakhir, setJamBerakhir] = useState(initial?.jam_berakhir || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const initialDayKeys = initial?.hari ? initial.hari.split(',') : PROMO_DAY_KEYS;
  const [days, setDays] = useState(() => {
    const d = { all: PROMO_DAY_KEYS.every((k) => initialDayKeys.includes(k)) };
    PROMO_DAY_KEYS.forEach((k) => {
      d[k] = initialDayKeys.includes(k);
    });
    return d;
  });

  const toggleField = (label, on, setOn) => (
    <FormRow label={label}>
      <div className="flex items-center gap-2">
        <Toggle on={on} onChange={setOn} />
        <span className="text-sm text-slate-600">{on ? 'Ya' : 'Tidak'}</span>
      </div>
    </FormRow>
  );

  const toggleDay = (k) => setDays((p) => ({ ...p, [k]: !p[k] }));
  const toggleAllDays = () =>
    setDays((p) => {
      const v = !p.all;
      const next = { all: v };
      PROMO_DAY_KEYS.forEach((k) => {
        next[k] = v;
      });
      return next;
    });

  const handleSave = async () => {
    if (!judul.trim() || !tanggalAktif) {
      setError('Judul dan Tanggal Aktif wajib diisi.');
      return;
    }
    setSaving(true);
    setError(null);
    const hariStr = PROMO_DAY_KEYS.filter((k) => days[k]).join(',');
    const payload = {
      judul: judul.trim(),
      tipe_promosi: tipe,
      combine_qty: combineQty,
      combine_qty_value: parseInt(combineQtyValue, 10) || 1,
      produk,
      grup_produk: grupProduk,
      paket_produk: paketProduk,
      brand,
      berlaku_membeli: berlakuMembeli,
      produk_gratis: produkGratis,
      berlaku_kelipatan: kelipatan,
      all_customers: allCustomers,
      tipe_pelanggan: tipePelanggan,
      pelanggan,
      tanggal_aktif: tanggalAktif,
      tanpa_kadaluarsa: noExpiry,
      tanggal_kadaluarsa: noExpiry ? null : tanggalKadaluarsa || null,
      jam_24: jam24,
      jam_mulai: jam24 ? null : jamMulai || null,
      jam_berakhir: jam24 ? null : jamBerakhir || null,
      hari: hariStr || 'min,sen,sel,rab,kam,jum,sab',
    };
    try {
      if (initial?.id) {
        await apiClient.patch(`/pos-promotions/${initial.id}/`, payload);
      } else {
        await apiClient.post('/pos-promotions/', payload);
      }
      onSaved();
    } catch (err) {
      console.error('[VoucherDiskon] save promotion error:', err);
      setError(extractApiError(err, 'Gagal menyimpan promosi.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
        <h2 className="text-slate-800 font-bold text-[15px]">{initial ? 'Ubah' : 'Tambah'} Promosi (POS)</h2>
        <div className="flex items-center gap-4">
          <button type="button" onClick={onCancel} className="text-blue-600 text-sm font-semibold cursor-pointer hover:underline">
            Batal
          </button>
          <div className="text-right">
            <div className="text-[11px] text-slate-400 leading-none mb-1">Simpan di:</div>
            <select className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-600 bg-white outline-none focus:border-blue-400 cursor-pointer">
              <option>{accountName}</option>
            </select>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer transition-colors"
          >
            <Check size={16} /> {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>

      <ErrorBanner message={error} />

      <div className="divide-y divide-slate-100">
        <FormRow label="Judul" required>
          <input type="text" placeholder="Masukkan Judul" value={judul} onChange={(e) => setJudul(e.target.value)} className={inputCls} />
        </FormRow>
        <FormRow label="Tipe Promosi">
          <select value={tipe} onChange={(e) => setTipe(e.target.value)} className={`${inputCls} cursor-pointer`}>
            {Object.entries(TIPE_PROMOSI_LABEL).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </FormRow>
      </div>

      <div className="px-6 pt-5 text-sm font-semibold text-orange-500">Aturan Promo</div>
      <div className="divide-y divide-slate-100">
        <FormRow label="Kombinasikan qty pembelian dari produk-produk di bawah">
          <div className="space-y-2 max-w-md">
            <Toggle on={combineQty} onChange={setCombineQty} />
            <input type="number" min="1" value={combineQtyValue} onChange={(e) => setCombineQtyValue(e.target.value)} className={inputCls} />
          </div>
        </FormRow>
        <FormRow label="Produk-produk mana saja yang diperbolehkan untuk diskon ini?">
          <TagPicker value={produk} onChange={setProduk} fetchUrl="/products/" placeholder="Cari produk..." />
        </FormRow>
        <FormRow label="Grup produk mana saja yang diperbolehkan untuk diskon ini?">
          <TagPicker value={grupProduk} onChange={setGrupProduk} fetchUrl="/product-categories/" placeholder="Cari grup produk..." />
        </FormRow>
        <FormRow label="Paket produk mana saja yang diperbolehkan untuk diskon ini?">
          <TagPicker value={paketProduk} onChange={setPaketProduk} fetchUrl="/product-packages/" placeholder="Cari paket produk..." />
        </FormRow>
        <FormRow label="Brand mana saja yang diperbolehkan untuk diskon ini? (tidak berlaku untuk POS)">
          <TagPicker value={brand} onChange={setBrand} fetchUrl="/brands/" placeholder="Cari brand..." />
        </FormRow>
        <FormRow label="Promo berlaku apabila membeli:">
          <div className="space-y-2 text-sm text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="berlakuMembeli" checked={berlakuMembeli === 'salah-satu'} onChange={() => setBerlakuMembeli('salah-satu')} />
              Salah satu produk yang diatur
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="berlakuMembeli" checked={berlakuMembeli === 'semua'} onChange={() => setBerlakuMembeli('semua')} />
              Semua produk yang diatur
            </label>
          </div>
        </FormRow>
        <FormRow label="Produk yang didapat secara gratis">
          <TagPicker value={produkGratis} onChange={setProdukGratis} fetchUrl="/products/" placeholder="Cari produk..." />
        </FormRow>
        {toggleField('Berlaku kelipatan', kelipatan, setKelipatan)}
      </div>

      <div className="px-6 pt-5 text-sm font-semibold text-orange-500">Pelanggan</div>
      <div className="divide-y divide-slate-100">
        {toggleField('Berlakukan untuk semua pelanggan/anggota', allCustomers, setAllCustomers)}
        {!allCustomers && (
          <>
            <FormRow label="Berlaku untuk tipe pelanggan">
              <input type="text" placeholder="Masukkan Tipe Pelanggan" value={tipePelanggan} onChange={(e) => setTipePelanggan(e.target.value)} className={inputCls} />
            </FormRow>
            <FormRow label="Berlaku untuk pelanggan">
              <TagPicker value={pelanggan} onChange={setPelanggan} fetchUrl="/contacts/" placeholder="Cari pelanggan..." />
            </FormRow>
          </>
        )}
      </div>

      <div className="px-6 pt-5 text-sm font-semibold text-orange-500">Masa Berlaku Promo</div>
      <div className="divide-y divide-slate-100">
        <FormRow label="Tanggal Aktif" required>
          <input type="date" value={tanggalAktif} onChange={(e) => setTanggalAktif(e.target.value)} className={inputCls} />
        </FormRow>
        <FormRow label="Tanpa Kadaluarsa">
          <div className="space-y-2 max-w-md">
            <Toggle on={noExpiry} onChange={setNoExpiry} />
            {!noExpiry && <input type="date" value={tanggalKadaluarsa} onChange={(e) => setTanggalKadaluarsa(e.target.value)} className={inputCls} />}
          </div>
        </FormRow>
        <FormRow label="Berlaku 24 Jam">
          <div className="space-y-2 max-w-md">
            <Toggle on={jam24} onChange={setJam24} />
            {!jam24 && (
              <>
                <input type="time" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} placeholder="Mulai" className={inputCls} />
                <input type="time" value={jamBerakhir} onChange={(e) => setJamBerakhir(e.target.value)} placeholder="Berakhir" className={inputCls} />
              </>
            )}
          </div>
        </FormRow>
        <FormRow label="Berlaku pada hari">
          <div className="space-y-1.5 text-sm text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input type="checkbox" checked={days.all} onChange={toggleAllDays} /> Pilih Semua
            </label>
            {PROMO_DAYS.map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={days[k]} onChange={() => toggleDay(k)} /> {label}
              </label>
            ))}
          </div>
        </FormRow>
      </div>
    </div>
  );
}
