import { useState } from 'react';
import { Check, Calendar, RefreshCw } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import { useAuth } from '../../../context/AuthContext';
import { extractApiError, inputCls } from '../format';
import { FormRow, Toggle, PercentNominalField, ErrorBanner } from './Common';
import TagPicker from './TagPicker';

const randomKode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < 12; i += 1) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
};

/** Form "Tambah/Ubah Kupon Diskon" — Rincian Diskon + Kriteria Diskon. */
export default function TambahKuponForm({ initial, onCancel, onSaved }) {
  const { user, businessSettings } = useAuth();
  const accountName = businessSettings?.nama_bisnis || user?.name || user?.email || 'Akun';
  const [kode, setKode] = useState(initial?.kode || randomKode);
  const [judul, setJudul] = useState(initial?.judul || '');
  const [tanggalAktif, setTanggalAktif] = useState(initial?.tanggal_aktif || new Date().toISOString().slice(0, 10));
  const [minTotal, setMinTotal] = useState(initial ? String(initial.min_total_pesanan) : '1');
  const [batasPenggunaan, setBatasPenggunaan] = useState(initial?.batas_penggunaan ? String(initial.batas_penggunaan) : '');
  const [discountType, setDiscountType] = useState(initial?.tipe_diskon || 'percent');
  const [jumlahDiskon, setJumlahDiskon] = useState(initial ? String(initial.jumlah_diskon) : '');
  const [maksDiskon, setMaksDiskon] = useState(initial ? String(initial.maksimal_jumlah_diskon) : '0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [tg, setTg] = useState({
    noExpiry: initial ? initial.tanpa_kadaluarsa : true,
    unlimitedUsage: initial ? initial.unlimited_usage : true,
    showPos: initial ? initial.show_pos : true,
    showOnline: initial ? initial.show_online : false,
    oncePerCustomer: initial ? initial.once_per_customer : false,
    dailyReuse: initial ? initial.daily_reuse : false,
    dineIn: initial ? initial.dine_in : false,
    delivery: initial ? initial.delivery : false,
    takeAway: initial ? initial.take_away : false,
    reservasi: initial ? initial.reservasi : false,
    allCustomers: initial ? initial.all_customers : true,
    allProducts: initial ? initial.all_products : true,
    allPackages: initial ? initial.all_packages : true,
    allBrands: initial ? initial.all_brands : true,
  });
  const [tipePelanggan, setTipePelanggan] = useState(initial?.tipe_pelanggan || '');
  const [pelanggan, setPelanggan] = useState(initial?.pelanggan || '');
  const [grupProduk, setGrupProduk] = useState(initial?.grup_produk || '');
  const [produk, setProduk] = useState(initial?.produk || '');
  const [paketProduk, setPaketProduk] = useState(initial?.paket_produk || '');
  const [brand, setBrand] = useState(initial?.brand || '');
  const setT = (k) => (v) => setTg((p) => ({ ...p, [k]: v }));

  const toggleRow = (label, k, help) => (
    <FormRow label={label} help={help}>
      <div className="flex items-center gap-2">
        <Toggle on={tg[k]} onChange={setT(k)} />
        <span className="text-sm text-slate-600">{tg[k] ? 'Ya' : 'Tidak'}</span>
      </div>
    </FormRow>
  );

  const handleSave = async () => {
    if (!kode.trim() || !judul.trim()) {
      setError('Kode dan Judul wajib diisi.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      kode: kode.trim(),
      judul: judul.trim(),
      tanggal_aktif: tanggalAktif || null,
      tanpa_kadaluarsa: tg.noExpiry,
      min_total_pesanan: parseFloat(minTotal) || 0,
      unlimited_usage: tg.unlimitedUsage,
      batas_penggunaan: tg.unlimitedUsage ? null : parseInt(batasPenggunaan, 10) || null,
      show_pos: tg.showPos,
      show_online: tg.showOnline,
      once_per_customer: tg.oncePerCustomer,
      daily_reuse: tg.dailyReuse,
      dine_in: tg.dineIn,
      delivery: tg.delivery,
      take_away: tg.takeAway,
      reservasi: tg.reservasi,
      tipe_diskon: discountType,
      jumlah_diskon: parseFloat(jumlahDiskon) || 0,
      maksimal_jumlah_diskon: parseFloat(maksDiskon) || 0,
      all_customers: tg.allCustomers,
      tipe_pelanggan: tipePelanggan,
      pelanggan,
      all_products: tg.allProducts,
      grup_produk: grupProduk,
      produk,
      all_packages: tg.allPackages,
      paket_produk: paketProduk,
      all_brands: tg.allBrands,
      brand,
    };
    try {
      if (initial?.id) {
        await apiClient.patch(`/discount-coupons/${initial.id}/`, payload);
      } else {
        await apiClient.post('/discount-coupons/', payload);
      }
      onSaved();
    } catch (err) {
      console.error('[VoucherDiskon] save coupon error:', err);
      setError(extractApiError(err, 'Gagal menyimpan kupon diskon.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-slate-100">
        <h2 className="text-slate-800 font-extrabold text-[15px]">{initial ? 'Ubah' : 'Tambah'} Kupon Diskon</h2>
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

      <div className="px-6 pt-5 text-sm font-semibold text-orange-500">Rincian Diskon</div>
      <div className="divide-y divide-slate-100">
        <FormRow label="Kode" required help="Harus unik dan max. 12 karakter">
          <div className="flex items-center gap-2">
            <input type="text" value={kode} onChange={(e) => setKode(e.target.value)} maxLength={12} className={inputCls} />
            <button
              type="button"
              onClick={() => setKode(randomKode())}
              title="Buat kode baru"
              className="shrink-0 p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-500 transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </FormRow>

        <FormRow label="Judul" required>
          <input type="text" placeholder="Masukkan Judul" value={judul} onChange={(e) => setJudul(e.target.value)} className={inputCls} />
        </FormRow>

        <FormRow label="Tanggal Aktif">
          <div className="relative">
            <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="date" value={tanggalAktif} onChange={(e) => setTanggalAktif(e.target.value)} className={`${inputCls} pl-9`} />
          </div>
        </FormRow>

        {toggleRow('Tanpa Kadaluarsa', 'noExpiry')}

        <FormRow label="Min. Total Harga Pesanan" help="Minimal jumlah pembelian untuk mendapatkan diskon ini">
          <input type="number" min="0" value={minTotal} onChange={(e) => setMinTotal(e.target.value)} className={inputCls} />
        </FormRow>

        {toggleRow('Penggunaan Tidak Terbatas?', 'unlimitedUsage')}

        <FormRow label="Batas Penggunaan">
          <input
            type="number"
            min="0"
            placeholder="Batas Penggunaan"
            value={batasPenggunaan}
            onChange={(e) => setBatasPenggunaan(e.target.value)}
            disabled={tg.unlimitedUsage}
            className={`${inputCls} ${tg.unlimitedUsage ? 'bg-slate-50 cursor-not-allowed' : ''}`}
          />
        </FormRow>

        {toggleRow('Tampilkan di POS?', 'showPos')}
        {toggleRow('Tampilkan di Online Order?', 'showOnline')}
        {toggleRow('Digunakan sekali per pelanggan', 'oncePerCustomer')}
        {toggleRow('Penggunaan Ulang Harian', 'dailyReuse')}
        {toggleRow('Gunakan untuk Dine-in', 'dineIn')}
        {toggleRow('Gunakan untuk Delivery', 'delivery')}
        {toggleRow('Gunakan untuk Take Away', 'takeAway')}
        {toggleRow('Gunakan untuk Reservasi', 'reservasi')}

        <FormRow label="Jumlah Diskon" required help="Cukup hanya masukkan angka saja, tanpa simbol persen (%), minimal: 0 dan maksimal: 100">
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

        <FormRow label="Maksimal Jumlah Diskon">
          <input type="number" min="0" value={maksDiskon} onChange={(e) => setMaksDiskon(e.target.value)} className={inputCls} />
        </FormRow>
      </div>

      <div className="px-6 pt-5 text-sm font-semibold text-orange-500">Kriteria Diskon</div>
      <div className="divide-y divide-slate-100">
        {toggleRow('Berlakukan untuk semua pelanggan?', 'allCustomers')}
        {!tg.allCustomers && (
          <>
            <FormRow label="Berlaku untuk tipe pelanggan">
              <input type="text" placeholder="Masukkan Tipe Pelanggan" value={tipePelanggan} onChange={(e) => setTipePelanggan(e.target.value)} className={inputCls} />
            </FormRow>
            <FormRow label="Berlaku untuk pelanggan">
              <TagPicker value={pelanggan} onChange={setPelanggan} fetchUrl="/contacts/" placeholder="Cari pelanggan..." />
            </FormRow>
          </>
        )}

        {toggleRow('Berlakukan untuk semua produk?', 'allProducts')}
        {!tg.allProducts && (
          <>
            <FormRow label="Berlaku untuk grup produk">
              <TagPicker value={grupProduk} onChange={setGrupProduk} fetchUrl="/product-categories/" placeholder="Cari grup produk..." />
            </FormRow>
            <FormRow label="Berlaku untuk produk">
              <TagPicker value={produk} onChange={setProduk} fetchUrl="/products/" placeholder="Cari produk..." />
            </FormRow>
          </>
        )}

        {toggleRow('Berlakukan untuk semua paket produk?', 'allPackages')}
        {!tg.allPackages && (
          <FormRow label="Berlaku untuk paket produk">
            <TagPicker value={paketProduk} onChange={setPaketProduk} fetchUrl="/product-packages/" placeholder="Cari paket produk..." />
          </FormRow>
        )}

        {toggleRow('Berlakukan untuk semua brand?', 'allBrands')}
        {!tg.allBrands && (
          <FormRow label="Berlaku untuk brand">
            <TagPicker value={brand} onChange={setBrand} fetchUrl="/brands/" placeholder="Cari brand..." />
          </FormRow>
        )}
      </div>
    </div>
  );
}
