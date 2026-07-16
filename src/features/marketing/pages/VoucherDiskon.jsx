import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  ChevronDown,
  Check,
  Calendar,
  ChevronsUpDown,
  RefreshCw,
  Search,
  Copy,
  Trash2,
  Pencil,
  X,
} from 'lucide-react';
import apiClient from '../../../api/apiClient';
import { useAuth } from '../../../context/AuthContext';
import { useTransaksiCrumb } from '../../transaksi/components/TransaksiContext';

const TABS = [
  { id: 'diskon', label: 'Diskon Penjualan' },
  { id: 'kupon', label: 'Kupon Diskon' },
  { id: 'promosi', label: 'Promosi (POS)' },
];

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const fmtDate = (isoStr) => {
  if (!isoStr) return '-';
  const d = new Date(`${isoStr}T00:00:00`);
  if (isNaN(d.getTime())) return '-';
  return `${String(d.getDate()).padStart(2, '0')}-${MONTHS_ID[d.getMonth()]}-${d.getFullYear()}`;
};

const fmtDiskon = (row) => (row.tipe_diskon === 'percent' ? `${row.jumlah_diskon}%` : `Rp ${Number(row.jumlah_diskon).toLocaleString('id-ID')}`);

const fmtRupiah = (v) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`;

/** Ubah error response DRF (dict field->list, atau {error}/{detail}) jadi satu baris pesan. */
const extractApiError = (err, fallback) => {
  const data = err.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.error) return data.error;
  if (data.detail) return data.detail;
  const parts = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
  return parts.length ? parts.join(' | ') : fallback;
};

/** Sakelar on/off. */
function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
        on ? 'bg-blue-500' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          on ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
}

/** Sakelar Aktif/Nonaktif dipakai di kolom Aksi tiap daftar. */
function StatusToggle({ active, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={active ? 'Nonaktifkan' : 'Aktifkan'}
      className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
        active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
    >
      {active ? 'Aktif' : 'Nonaktif'}
    </button>
  );
}

/** Baris form: label (kanan) + helper, kontrol di kanan. */
function FormRow({ label, required, help, children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-2 md:gap-6 px-6 py-5">
      <div className="md:text-right md:pt-2">
        <label className="text-sm text-slate-600">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {help && <p className="text-[11px] text-orange-400 mt-1 leading-snug">{help}</p>}
      </div>
      <div className="max-w-xl">{children}</div>
    </div>
  );
}

const inputCls =
  'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 placeholder-slate-400';

/** Pilihan tipe diskon: % Persen / $ Nominal. */
function PercentNominalField({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => onChange('percent')}
        className={`px-4 py-1.5 text-sm font-semibold cursor-pointer transition-colors ${
          value === 'percent' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
        }`}
      >
        % Persen
      </button>
      <button
        type="button"
        onClick={() => onChange('nominal')}
        className={`px-4 py-1.5 text-sm font-semibold cursor-pointer transition-colors border-l border-slate-200 ${
          value === 'nominal' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
        }`}
      >
        $ Nominal
      </button>
    </div>
  );
}

/**
 * Input tag multi-pilih yang mengambil opsi dari data asli (produk/brand/grup/paket/pelanggan)
 * lewat apiClient, dipakai untuk field kriteria yang sebelumnya cuma teks bebas.
 * Value tersimpan sebagai string dipisah koma agar tetap kompatibel dengan CharField backend.
 */
function TagPicker({ value, onChange, fetchUrl, placeholder }) {
  const [options, setOptions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const tags = value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const loadOptions = async () => {
    if (loaded) return;
    try {
      const res = await apiClient.get(fetchUrl);
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setOptions(list.map((o) => o.nama).filter(Boolean));
      setLoaded(true);
    } catch (err) {
      console.error('[TagPicker] fetch error:', err);
    }
  };

  const addTag = (name) => {
    if (!tags.includes(name)) onChange([...tags, name].join(', '));
    setQuery('');
  };
  const removeTag = (name) => onChange(tags.filter((t) => t !== name).join(', '));

  const filteredOptions = options.filter((o) => !tags.includes(o) && o.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <div className="flex flex-wrap items-center gap-1.5 border border-slate-200 rounded-lg px-2 py-1.5 focus-within:border-blue-400">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-md">
            {t}
            <button type="button" onClick={() => removeTag(t)} className="hover:text-blue-900 cursor-pointer">
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setOpen(true);
            loadOptions();
          }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[100px] text-sm outline-none py-0.5 text-slate-700 placeholder-slate-400"
        />
      </div>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-full max-h-48 overflow-y-auto bg-white rounded-lg border border-slate-200 shadow-lg z-30 py-1">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400">{loaded ? 'Tidak ada hasil' : 'Memuat...'}</div>
          ) : (
            filteredOptions.slice(0, 20).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => addTag(o)}
                className="w-full text-left px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {o}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const ErrorBanner = ({ message }) =>
  message ? (
    <div className="mx-6 mt-4 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs">
      {message}
    </div>
  ) : null;

/* ============================== DISKON PENJUALAN ============================== */

/** Form "Tambah/Ubah Diskon Penjualan". */
function TambahDiskonForm({ initial, onCancel, onSaved }) {
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
        <h2 className="text-slate-800 font-bold text-[15px]">{initial ? 'Ubah' : 'Tambah'} Diskon Penjualan</h2>
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

        <FormRow label="Berlaku untuk tipe pelanggan" help="Kosongkan jika berlaku untuk semua tipe pelanggan">
          <input
            type="text"
            placeholder="Masukkan Tipe Pelanggan"
            value={tipePelanggan}
            onChange={(e) => setTipePelanggan(e.target.value)}
            className={inputCls}
          />
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

/** Tab "Diskon Penjualan". */
function DiskonPenjualanTab() {
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

/* ============================== KUPON DISKON ============================== */

const randomKode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < 12; i += 1) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
};

/** Form "Tambah/Ubah Kupon Diskon" — Rincian Diskon + Kriteria Diskon. */
function TambahKuponForm({ initial, onCancel, onSaved }) {
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
        <h2 className="text-slate-800 font-bold text-[15px]">{initial ? 'Ubah' : 'Tambah'} Kupon Diskon</h2>
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

      <div className="px-6 pt-5 text-sm font-semibold text-orange-500">Rincian Diskon</div>
      <div className="divide-y divide-slate-100">
        <FormRow label="Kode" required help="Harus unik dan max. 12 karakter">
          <div className="flex items-center gap-2">
            <input type="text" value={kode} onChange={(e) => setKode(e.target.value)} maxLength={12} className={inputCls} />
            <button
              type="button"
              onClick={() => setKode(randomKode())}
              title="Buat kode baru"
              className="shrink-0 p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw size={15} />
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

/** Tab "Kupon Diskon". */
function KuponDiskonTab() {
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

/* ============================== PROMOSI (POS) ============================== */

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
function TambahPromosiForm({ initial, onCancel, onSaved }) {
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

/** Tab "Promosi (POS)" — toggle antara daftar dan form tambah. */
function PromosiPosTab() {
  const [view, setView] = useState('list');
  const [editing, setEditing] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/pos-promotions/');
      setRows(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      console.error('[VoucherDiskon] fetch promotions error:', err);
      setError('Gagal memuat daftar promosi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  if (view === 'create' || view === 'edit') {
    return (
      <TambahPromosiForm
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
    <PromosiPosList
      rows={rows}
      loading={loading}
      error={error}
      onAdd={() => {
        setEditing(null);
        setView('create');
      }}
      onEdit={(row) => {
        setEditing(row);
        setView('edit');
      }}
      onRefresh={fetchRows}
    />
  );
}

/**
 * Dropdown Tipe Promosi. Nilai default 'Semua' tampil sebagai "Tipe Promosi"
 * di kolomnya; memilih tipe lain (DQ/BX/DA/FI) menampilkan tipe tsb.
 */
function PromoTipeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  const options = ['Semua', 'DQ', 'BX', 'DA', 'FI'];
  const isAll = value === 'Semua';
  return (
    <div className="relative min-w-[140px]" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white hover:border-slate-300 cursor-pointer"
      >
        <span className={isAll ? 'text-slate-400' : 'text-slate-700'}>{isAll ? 'Tipe Promosi' : value}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg z-30 py-1">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm cursor-pointer ${
                opt === value ? 'text-blue-600 font-semibold bg-blue-50/60' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Dropdown "Salin Diskon" — pilih promo yang sudah ada untuk diduplikasi jadi draft baru. */
function SalinDiskonButton({ rows, onCopied }) {
  const [open, setOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleCopy = async (row) => {
    setCopying(true);
    try {
      await apiClient.post(`/pos-promotions/${row.id}/duplicate/`);
      onCopied();
    } catch (err) {
      console.error('[VoucherDiskon] duplicate promotion error:', err);
    } finally {
      setCopying(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={rows.length === 0 || copying}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer transition-colors"
      >
        <Copy size={15} /> {copying ? 'Menyalin...' : 'Salin Diskon'}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 max-h-64 overflow-y-auto bg-white rounded-lg border border-slate-200 shadow-lg z-30 py-1">
          {rows.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400">Belum ada promosi</div>
          ) : (
            rows.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => handleCopy(row)}
                className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {row.judul}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** Daftar Promosi (POS) — toolbar filter + tabel. */
function PromosiPosList({ rows, loading, error, onAdd, onEdit, onRefresh }) {
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

export default function VoucherDiskon() {
  const [tab, setTab] = useState('diskon');
  const { setSubtitle } = useTransaksiCrumb();

  useEffect(() => {
    setSubtitle('Voucher & Diskon');
  }, [setSubtitle]);

  return (
    <div className="flex flex-col flex-1 min-h-full bg-white">
      <div className="flex border-b border-slate-200 bg-white shrink-0">
        {TABS.map((t) => {
          const isActive = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 px-4 py-4 text-sm font-semibold text-center whitespace-nowrap transition-colors cursor-pointer ${
                isActive ? 'text-blue-600 bg-blue-50/70 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/40'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 p-6">
        {tab === 'diskon' && <DiskonPenjualanTab />}
        {tab === 'kupon' && <KuponDiskonTab />}
        {tab === 'promosi' && <PromosiPosTab />}
      </div>
    </div>
  );
}
