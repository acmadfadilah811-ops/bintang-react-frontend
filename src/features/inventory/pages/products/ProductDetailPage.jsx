import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { formatCurrency } from '../productInventoryData';
import apiClient from '../../../../api/apiClient';
import { PriceInput } from './VariantModal';

const DETAIL_TABS = [
  { id: 'profil', label: 'Profil' },
  { id: 'variant', label: 'Variant' },
  { id: 'bahan-resep', label: 'Bahan/Resep' },
  { id: 'tingkatan-harga', label: 'Tingkatan Harga' },
  { id: 'terkait', label: 'Terkait' },
  { id: 'seri', label: 'Seri' },
  { id: 'spesifikasi', label: 'Spesifikasi' },
  { id: 'satuan', label: 'Satuan' },
];

const yaTidak = (v) => (v ? 'Ya' : 'Tidak');

const formatTanggal = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

function Section({ title, headerRight, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 18px', borderBottom: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b', paddingTop: 6 }}>{title}</h3>
        {headerRight}
      </div>
      <div style={{ padding: '0 18px' }}>{children}</div>
    </div>
  );
}

function EditButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ background: '#026da7', color: '#fff', border: 0, borderRadius: 6, padding: '7px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
    >
      Ubah
    </button>
  );
}

function SaveCancelHeader({ storeName, onCancel, onSave, saving }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Simpan di:</div>
        <select disabled style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#334155', background: '#f8fafc' }}>
          <option>{storeName}</option>
        </select>
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        style={{ background: '#16a34a', color: '#fff', border: 0, borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}
      >
        {saving ? 'Menyimpan...' : 'Simpan'}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        style={{ background: '#fff', color: '#334155', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}
      >
        Batal
      </button>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ fontSize: 11, color: '#0284c7', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{value || value === 0 ? value : '-'}</div>
    </div>
  );
}

function ReferVarianCard({ label, aggregate }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px' }}>
      <div style={{ fontSize: 11, color: '#0284c7', marginBottom: 4 }}>{label}</div>
      <div style={{ background: '#eff6ff', color: '#0284c7', fontSize: 11, padding: '4px 8px', borderRadius: 6, marginBottom: aggregate === undefined ? 0 : 6 }}>
        Refer Ke varian
      </div>
      {aggregate !== undefined && (
        <div style={{ background: '#f1f5f9', color: '#334155', fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 6 }}>
          {aggregate}
        </div>
      )}
    </div>
  );
}

function PlainCard({ label, value }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px' }}>
      <div style={{ fontSize: 11, color: '#0284c7', marginBottom: 4 }}>{label}</div>
      <div style={{ background: '#f1f5f9', color: '#334155', fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 6 }}>
        {value}
      </div>
    </div>
  );
}

function FormRow({ label, desc, children }) {
  return (
    <div className="pi-create-row">
      <div className="pi-row-label-desc">
        <span className="pi-row-label">{label}</span>
        {desc && <span className="pi-row-desc">{desc}</span>}
      </div>
      <div className="pi-row-input">{children}</div>
    </div>
  );
}

export default function ProductDetailPage({ product, onBack, onUpdated, categories = [], brands = [], storeName = 'Bintang Advertising' }) {
  const [activeTab, setActiveTab] = useState('profil');
  const [editingSection, setEditingSection] = useState(null);
  const [savingSection, setSavingSection] = useState(false);
  
  const [localCategories, setLocalCategories] = useState(categories);
  const [localBrands, setLocalBrands] = useState(brands);
  const [collections, setCollections] = useState([]);

  const [formNama, setFormNama] = useState('');
  const [formNamaAlt, setFormNamaAlt] = useState('');
  const [formKategori, setFormKategori] = useState('');
  const [formKoleksi, setFormKoleksi] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formKondisi, setFormKondisi] = useState('Baru');
  const [formBebasPajak, setFormBebasPajak] = useState(false);
  const [formBebasBiayaLayanan, setFormBebasBiayaLayanan] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);

  const [isCopying, setIsCopying] = useState(false);
  const [savingCopy, setSavingCopy] = useState(false);
  const [copyPhoto, setCopyPhoto] = useState(false);
  const [copyVariant, setCopyVariant] = useState(false);
  const [copyTiers, setCopyTiers] = useState(false);
  const [copyBom, setCopyBom] = useState(false);
  const [formHargaSama, setFormHargaSama] = useState(true);
  const [formHargaOnline, setFormHargaOnline] = useState('Rp. 0');
  const [formLacakInventori, setFormLacakInventori] = useState(true);
  const [formRack, setFormRack] = useState('');
  const [formQtyStok, setFormQtyStok] = useState(0);
  const [formStokMinimum, setFormStokMinimum] = useState(5);
  const [formQtyFastMoving, setFormQtyFastMoving] = useState(0);

  // New optional detail fields states
  const [showDetailOptional, setShowDetailOptional] = useState(false);
  const [formHargaDinamis, setFormHargaDinamis] = useState(false);
  const [formSatuan, setFormSatuan] = useState('pcs');
  const [formStokKosong, setFormStokKosong] = useState(false);
  const [formButuhPengiriman, setFormButuhPengiriman] = useState(true);
  const [formBerat, setFormBerat] = useState('0.2000');
  const [formTersediaOnline, setFormTersediaOnline] = useState(true);
  const [formTanggalTersediaOnline, setFormTanggalTersediaOnline] = useState('');
  const [formTidakTersediaOfflinePos, setFormTidakTersediaOfflinePos] = useState(false);
  const [formMetaKeywords, setFormMetaKeywords] = useState('');
  const [formMetaDescription, setFormMetaDescription] = useState('');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formCatatan, setFormCatatan] = useState('');

  // Harga section edit states
  const [hargaDinamisEdit, setHargaDinamisEdit] = useState(false);
  const [hargaPasarEdit, setHargaPasarEdit] = useState('0');
  const [hargaBeliEdit, setHargaBeliEdit] = useState('0');
  const [hargaJualOnlineEdit, setHargaJualOnlineEdit] = useState('0');
  const [hargaJualTokoEdit, setHargaJualTokoEdit] = useState('0');
  const [komisiEdit, setKomisiEdit] = useState('0');
  const [komisiTipeEdit, setKomisiTipeEdit] = useState('nominal'); // 'nominal' or 'persen'
  const [minimalPesananEdit, setMinimalPesananEdit] = useState(1);
  const [maksimalPesananEdit, setMaksimalPesananEdit] = useState(0);

  const refreshDropdowns = async () => {
    try {
      const [catRes, brandRes, collRes] = await Promise.all([
        apiClient.get('/product-categories/'),
        apiClient.get('/brands/'),
        apiClient.get('/collections/'),
      ]);
      setLocalCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.results || []);
      setLocalBrands(Array.isArray(brandRes.data) ? brandRes.data : brandRes.data?.results || []);
      setCollections(Array.isArray(collRes.data) ? collRes.data : collRes.data?.results || []);
    } catch (err) {
      console.error('[ProductDetailPage] refreshDropdowns error:', err);
    }
  };

  const startCopyProduct = () => {
    refreshDropdowns(); // dynamically refresh dropdown data in the background
    setFormNama(product.nama || '');
    setFormNamaAlt(product.nama_alternatif || '');
    setFormKategori(product.kategori ? String(product.kategori) : '');
    setFormKoleksi(product.koleksi ? String(product.koleksi) : '');
    setFormBrand(product.brand ? String(product.brand) : '');
    setFormSku(product.sku || '');
    setFormBarcode(product.barcode || '');
    setFormKondisi(product.kondisi || 'Baru');
    setFormBebasPajak(!!product.bebas_pajak);
    setFormBebasBiayaLayanan(!!product.bebas_biaya_layanan);
    setFormHargaSama(!!product.harga_online_sama);
    const initialPriceOnline = product.harga_jual_online ? 'Rp. ' + parseInt(product.harga_jual_online).toLocaleString('id-ID') : 'Rp. 0';
    setFormHargaOnline(initialPriceOnline);
    setFormLacakInventori(!!product.lacak_inventori);
    setFormRack(product.rack || '');
    setFormQtyStok(0);
    setFormStokMinimum(product.stok_minimum || 5);
    setFormQtyFastMoving(product.qty_fast_moving || 0);
    setCopyPhoto(false);
    setCopyVariant(false);
    setCopyTiers(false);
    setCopyBom(false);

    // Populate optional fields
    setFormHargaDinamis(!!product.harga_dinamis);
    setFormSatuan(product.satuan || 'pcs');
    setFormStokKosong(Number(product.qty_stok) <= 0);
    setFormButuhPengiriman(!!product.butuh_pengiriman);
    setFormBerat(product.berat !== null && product.berat !== undefined ? String(product.berat) : '0.2000');
    setFormTersediaOnline(!!product.tersedia_online);
    
    const today = new Date().toISOString().split('T')[0];
    setFormTanggalTersediaOnline(product.tanggal_tersedia_online || today);
    setFormTidakTersediaOfflinePos(!!product.tidak_tersedia_offline_pos);
    setFormMetaKeywords(product.meta_keywords || '');
    setFormMetaDescription(product.meta_description || '');
    setFormDeskripsi(product.deskripsi || '');
    setFormCatatan(product.catatan || '');
    
    setShowDetailOptional(false);
    setIsCopying(true);
  };

  const handleSaveCopy = async () => {
    if (savingCopy) return;
    setSavingCopy(true);
    try {
      const digits = formHargaOnline.replace(/\D/g, '');
      const numericOnlinePrice = digits ? parseInt(digits, 10) : 0;

      const res = await apiClient.post(`/products/${product.id}/copy/`, {
        nama: formNama,
        nama_alternatif: formNamaAlt || null,
        kategori_id: formKategori || null,
        harga_jual_online: numericOnlinePrice,
        harga_online_sama: formHargaSama,
        lacak_inventori: formLacakInventori,
        rack: formRack || '',
        qty_stok: formQtyStok ? parseFloat(formQtyStok) : 0.00,
        stok_minimum: formStokMinimum ? parseFloat(formStokMinimum) : 0.00,
        qty_fast_moving: formQtyFastMoving ? parseFloat(formQtyFastMoving) : 0.00,
        copy_photo: copyPhoto,
        copy_variant: copyVariant,
        copy_tiers: copyTiers,
        copy_bom: copyBom,

        // Optional detail fields
        sku: formSku || null,
        barcode: formBarcode || null,
        koleksi_id: formKoleksi || null,
        brand_id: formBrand || null,
        kondisi: formKondisi,
        deskripsi: formDeskripsi || null,
        catatan: formCatatan || '',
        harga_dinamis: formHargaDinamis,
        satuan: formSatuan,
        butuh_pengiriman: formButuhPengiriman,
        berat: formBerat ? parseFloat(formBerat) : null,
        bebas_pajak: formBebasPajak,
        bebas_biaya_layanan: formBebasBiayaLayanan,
        tersedia_online: formTersediaOnline,
        tanggal_tersedia_online: formTanggalTersediaOnline || null,
        tidak_tersedia_offline_pos: formTidakTersediaOfflinePos,
        meta_keywords: formMetaKeywords || '',
        meta_description: formMetaDescription || ''
      });

      alert('Produk berhasil disalin!');
      onUpdated?.(res.data);
      setIsCopying(false);
    } catch (err) {
      console.error('[ProductDetailPage] copy product error:', err);
      alert('Gagal menyalin produk.');
    } finally {
      setSavingCopy(false);
    }
  };

  useEffect(() => {
    const el = document.querySelector('.pi-content-topbar h1');
    if (el) {
      const original = el.innerText;
      if (isCopying) {
        el.innerText = 'Katalog Produk / Product Copy';
      } else {
        el.innerText = 'Katalog Produk / Detail Produk';
      }
      return () => {
        el.innerText = original;
      };
    }
  }, [isCopying]);

  useEffect(() => {
    apiClient
      .get('/collections/')
      .then((res) => setCollections(Array.isArray(res.data) ? res.data : res.data?.results || []))
      .catch((err) => console.error('[ProductDetailPage] fetch collections error:', err));
  }, []);

  if (!product) return null;

  const hasVariant = product.has_variant && product.variants?.length > 0;
  const firstVariant = hasVariant ? product.variants[0] : null;

  const stokKosong = hasVariant
    ? product.variants.every((v) => Number(v.qty_stok) <= 0)
    : Number(product.qty_stok) <= 0;

  const startEditInfoUmum = () => {
    refreshDropdowns(); // dynamically refresh dropdown data
    setFormNama(product.nama || '');
    setFormNamaAlt(product.nama_alternatif || '');
    setFormKategori(product.kategori ? String(product.kategori) : '');
    setFormKoleksi(product.koleksi ? String(product.koleksi) : '');
    setFormBrand(product.brand ? String(product.brand) : '');
    setFormSku(product.sku || '');
    setFormBarcode(product.barcode || '');
    setFormKondisi(product.kondisi || 'Baru');
    setFormBebasPajak(!!product.bebas_pajak);
    setFormBebasBiayaLayanan(!!product.bebas_biaya_layanan);
    setSelectedPhoto(null);
    setPhotoPreviewUrl(product.fotos?.[0]?.foto || null);
    setEditingSection('info_umum');
  };

  const cancelEdit = () => setEditingSection(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedPhoto(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const saveInfoUmum = async () => {
    if (savingSection) return;
    setSavingSection(true);
    try {
      await apiClient.patch(`/products/${product.id}/`, {
        nama: formNama,
        nama_alternatif: formNamaAlt || null,
        kategori: formKategori || null,
        koleksi: formKoleksi || null,
        brand: formBrand || null,
        sku: formSku || null,
        barcode: formBarcode || null,
        kondisi: formKondisi,
        bebas_pajak: formBebasPajak,
        bebas_biaya_layanan: formBebasBiayaLayanan,
      });
      if (selectedPhoto) {
        const fd = new FormData();
        fd.append('product', product.id);
        fd.append('is_primary', 'true');
        fd.append('foto', selectedPhoto);
        await apiClient.post('/product-images/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      const fresh = await apiClient.get(`/products/${product.id}/`);
      onUpdated?.(fresh.data);
      setEditingSection(null);
    } catch (err) {
      console.error('[ProductDetailPage] save info umum error:', err);
      alert('Gagal menyimpan perubahan.');
    } finally {
      setSavingSection(false);
    }
  };

  const startEditHarga = () => {
    setHargaDinamisEdit(!!product.harga_dinamis);
    setHargaPasarEdit(product.harga_pasar ? String(Math.round(parseFloat(product.harga_pasar))) : '0');
    setHargaBeliEdit(product.harga_beli ? String(Math.round(parseFloat(product.harga_beli))) : '0');
    setHargaJualOnlineEdit(product.harga_jual_online ? String(Math.round(parseFloat(product.harga_jual_online))) : '0');
    setHargaJualTokoEdit(product.harga_jual_toko ? String(Math.round(parseFloat(product.harga_jual_toko))) : '0');
    setKomisiEdit(product.komisi ? String(Math.round(parseFloat(product.komisi))) : '0');
    setKomisiTipeEdit('nominal');
    setMinimalPesananEdit(product.minimal_pesanan !== null && product.minimal_pesanan !== undefined ? product.minimal_pesanan : 1);
    setMaksimalPesananEdit(product.maksimal_pesanan !== null && product.maksimal_pesanan !== undefined ? product.maksimal_pesanan : 0);
    setEditingSection('harga');
  };

  const saveHarga = async () => {
    if (savingSection) return;
    setSavingSection(true);
    try {
      const payload = {
        harga_dinamis: hargaDinamisEdit,
        minimal_pesanan: parseInt(minimalPesananEdit, 10) || 1,
        maksimal_pesanan: parseInt(maksimalPesananEdit, 10) || 0,
      };

      if (!hasVariant) {
        payload.harga_pasar = parseFloat(hargaPasarEdit) || 0;
        payload.harga_beli = parseFloat(hargaBeliEdit) || 0;
        payload.harga_jual_online = parseFloat(hargaJualOnlineEdit) || 0;
        payload.harga_jual_toko = parseFloat(hargaJualTokoEdit) || 0;
        payload.komisi = parseFloat(komisiEdit) || 0;
      }

      await apiClient.patch(`/products/${product.id}/`, payload);
      const fresh = await apiClient.get(`/products/${product.id}/`);
      alert('Harga berhasil diperbarui!');
      onUpdated?.(fresh.data);
      setEditingSection(null);
    } catch (err) {
      console.error('[ProductDetailPage] saveHarga error:', err);
      alert('Gagal memperbarui harga.');
    } finally {
      setSavingSection(false);
    }
  };

  if (isCopying) {
    return (
      <div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Tambah Produk</h3>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setIsCopying(false)}
                disabled={savingCopy}
                style={{ color: '#64748b', fontSize: 13, fontWeight: 600, border: 0, background: 'none', cursor: 'pointer', marginRight: 20 }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveCopy}
                disabled={savingCopy}
                style={{ background: '#0284c7', color: '#fff', border: 0, borderRadius: 6, padding: '8px 24px', fontSize: 13, fontWeight: 700, cursor: savingCopy ? 'default' : 'pointer' }}
              >
                {savingCopy ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
          <div style={{ padding: '0 18px' }}>
            <FormRow label="Salin Foto" desc="Salin foto dari produk asli">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label className="pi-switch">
                  <input type="checkbox" checked={copyPhoto} onChange={(e) => setCopyPhoto(e.target.checked)} />
                  <span className="pi-slider">
                    <span className="pi-slider-text">{copyPhoto ? 'Ya' : 'Tidak'}</span>
                  </span>
                </label>
                <span style={{ fontSize: 12, color: '#64748b' }}>{copyPhoto ? 'Ya' : 'Tidak'}</span>
              </div>
            </FormRow>

            <FormRow label="Nama Produk" desc="Tulis nama produk sesuai jenis, merek, dan rincian produk *">
              <input type="text" value={formNama} onChange={(e) => setFormNama(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', fontSize: 13 }} />
            </FormRow>

            <FormRow label="Nama Produk Alternatif" desc="Tulis alternatif nama produk dalam bahasa Mandarin / Latin">
              <input type="text" value={formNamaAlt} onChange={(e) => setFormNamaAlt(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', fontSize: 13 }} />
            </FormRow>

            <FormRow label="Kategori Produk" desc="Pilih dari yang ada atau tambahkan yang baru *">
              <select value={formKategori ? String(formKategori) : ''} onChange={(e) => setFormKategori(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', fontSize: 13, background: '#fff' }}>
                <option value="">Pilih salah satu</option>
                {localCategories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>{cat.nama}</option>
                ))}
              </select>
            </FormRow>

            <FormRow label="Harga jual online sama dengan harga jual toko">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label className="pi-switch">
                  <input type="checkbox" checked={formHargaSama} onChange={(e) => setFormHargaSama(e.target.checked)} />
                  <span className="pi-slider">
                    <span className="pi-slider-text">{formHargaSama ? 'Ya' : 'Tidak'}</span>
                  </span>
                </label>
                <span style={{ fontSize: 12, color: '#64748b' }}>{formHargaSama ? 'Ya' : 'Tidak'}</span>
              </div>
            </FormRow>

            {!formHargaSama && (
              <FormRow label="Harga Jual Online">
                <div style={{ width: '100%' }}>
                  <PriceInput value={formHargaOnline} onChange={setFormHargaOnline} />
                </div>
              </FormRow>
            )}

            <FormRow label="Lacak Inventori" desc="Jika anda mengaktifkan lacak inventori, sistem akan mengecek ketersediaan stok barang sebelum menjual ke pembeli">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label className="pi-switch">
                  <input type="checkbox" checked={formLacakInventori} onChange={(e) => setFormLacakInventori(e.target.checked)} />
                  <span className="pi-slider">
                    <span className="pi-slider-text">{formLacakInventori ? 'Ya' : 'Tidak'}</span>
                  </span>
                </label>
                <span style={{ fontSize: 12, color: '#64748b' }}>{formLacakInventori ? 'Ya' : 'Tidak'}</span>
              </div>
            </FormRow>

            <FormRow label="Rack">
              <input type="text" placeholder="Masukkan Rack" value={formRack} onChange={(e) => setFormRack(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', fontSize: 13 }} />
            </FormRow>

            {formLacakInventori && (
              <FormRow label="Jumlah stok yang tersedia saat ini" desc="Sistem akan mengecek ketersediaan stok barang sebelum menjual ke pembeli. Jika produk memiliki varian, sistem mengecek stok per varian.">
                <input type="number" value={formQtyStok} onChange={(e) => setFormQtyStok(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', fontSize: 13 }} />
              </FormRow>
            )}

            <FormRow label="Peringatan Sisa Stok" desc="Jika stok sudah mencapai batas, maka sistem akan memberi peringatan sebelum stok habis.">
              <input type="number" value={formStokMinimum} onChange={(e) => setFormStokMinimum(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', fontSize: 13 }} />
            </FormRow>

            <FormRow label="Qty Fast Moving">
              <input type="number" value={formQtyFastMoving} onChange={(e) => setFormQtyFastMoving(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', fontSize: 13 }} />
            </FormRow>

            <FormRow label="Salin Variant" desc="Salin variant dari produk asli">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label className="pi-switch">
                  <input type="checkbox" checked={copyVariant} onChange={(e) => setCopyVariant(e.target.checked)} />
                  <span className="pi-slider">
                    <span className="pi-slider-text">{copyVariant ? 'Ya' : 'Tidak'}</span>
                  </span>
                </label>
                <span style={{ fontSize: 12, color: '#64748b' }}>{copyVariant ? 'Ya' : 'Tidak'}</span>
              </div>
            </FormRow>

            <FormRow label="Salin Tingkatan Harga" desc="Salin tingkatan harga dari produk asli">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label className="pi-switch">
                  <input type="checkbox" checked={copyTiers} onChange={(e) => setCopyTiers(e.target.checked)} />
                  <span className="pi-slider">
                    <span className="pi-slider-text">{copyTiers ? 'Ya' : 'Tidak'}</span>
                  </span>
                </label>
                <span style={{ fontSize: 12, color: '#64748b' }}>{copyTiers ? 'Ya' : 'Tidak'}</span>
              </div>
            </FormRow>

            <FormRow label="Salin Bahan/Resep" desc="Salin Bahan/Resep dari produk asli">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label className="pi-switch">
                  <input type="checkbox" checked={copyBom} onChange={(e) => setCopyBom(e.target.checked)} />
                  <span className="pi-slider">
                    <span className="pi-slider-text">{copyBom ? 'Ya' : 'Tidak'}</span>
                  </span>
                </label>
                <span style={{ fontSize: 12, color: '#64748b' }}>{copyBom ? 'Ya' : 'Tidak'}</span>
              </div>
            </FormRow>

            <div style={{ borderTop: '1px solid #e2e8f0', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1e293b', fontWeight: 600 }}>
              <span>Informasi Detail (opsional)</span>
              <button
                type="button"
                onClick={() => setShowDetailOptional(!showDetailOptional)}
                style={{ background: '#f1f5f9', border: 0, borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                {showDetailOptional ? (
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#475569' }}>-</span>
                ) : (
                  <Plus size={16} />
                )}
              </button>
            </div>

            {showDetailOptional && (
              <div style={{ padding: '0 18px 18px 18px', borderTop: '1px solid #f1f5f9' }}>
                <FormRow label="SKU" desc="SKU (Stock Keeping Unit) atau Barcode dapat dipergunakan untuk pencarian produk">
                  <input type="text" placeholder="Masukkan SKU" value={formSku} onChange={(e) => setFormSku(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', fontSize: 13 }} />
                </FormRow>

                <FormRow label="Barcode" desc="Barcode untuk produk Anda">
                  <input type="text" placeholder="Masukkan Barcode" value={formBarcode} onChange={(e) => setFormBarcode(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', fontSize: 13 }} />
                </FormRow>

                 <FormRow label="Koleksi" desc="Nama koleksi produk, e.g. Koleksi Hari Raya, dll.">
                  <select value={formKoleksi ? String(formKoleksi) : ''} onChange={(e) => setFormKoleksi(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', fontSize: 13, background: '#fff' }}>
                    <option value="">Pilih salah satu</option>
                    {collections.map((col) => (
                      <option key={col.id} value={String(col.id)}>{col.nama}</option>
                    ))}
                  </select>
                </FormRow>

                <FormRow label="Brand" desc="Pilih dari yang ada atau tambahkan yang baru">
                  <select value={formBrand ? String(formBrand) : ''} onChange={(e) => setFormBrand(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', fontSize: 13, background: '#fff' }}>
                    <option value="">Pilih salah satu</option>
                    {localBrands.map((b) => (
                      <option key={b.id} value={String(b.id)}>{b.nama}</option>
                    ))}
                  </select>
                </FormRow>

                <FormRow label="Kondisi" desc="Pilih salah satu">
                  <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden', width: 'fit-content' }}>
                    {['Tidak ada', 'Baru', 'Pembaharuan', 'Bekas'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormKondisi(opt)}
                        style={{
                          padding: '8px 16px',
                          fontSize: 13,
                          fontWeight: formKondisi === opt ? 700 : 500,
                          background: formKondisi === opt ? '#f1f5f9' : '#fff',
                          color: '#1e293b',
                          border: 0,
                          borderRight: opt !== 'Bekas' ? '1px solid #cbd5e1' : 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </FormRow>

                <FormRow label="Deskripsi Produk">
                  <textarea value={formDeskripsi} onChange={(e) => setFormDeskripsi(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', fontSize: 13, minHeight: 80 }} />
                </FormRow>

                <FormRow label="Catatan">
                  <textarea placeholder="Masukkan Catatan" value={formCatatan} onChange={(e) => setFormCatatan(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', fontSize: 13, minHeight: 80 }} />
                </FormRow>

                {/* Harga Produk */}
                <div style={{ padding: '14px 0 8px 0', borderBottom: '1px solid #e2e8f0', marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#475569' }}>
                  Harga Produk
                </div>
                <FormRow label="Harga jual di toko bersifat dinamis" desc="Kasir bisa mengubah harga jual">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label className="pi-switch">
                      <input type="checkbox" checked={formHargaDinamis} onChange={(e) => setFormHargaDinamis(e.target.checked)} />
                      <span className="pi-slider">
                        <span className="pi-slider-text">{formHargaDinamis ? 'Ya' : 'Tidak'}</span>
                      </span>
                    </label>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{formHargaDinamis ? 'Ya' : 'Tidak'}</span>
                  </div>
                </FormRow>

                {/* Pemesanan */}
                <div style={{ padding: '14px 0 8px 0', borderBottom: '1px solid #e2e8f0', marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#475569' }}>
                  Pemesanan
                </div>

                {/* Inventori */}
                <div style={{ padding: '14px 0 8px 0', borderBottom: '1px solid #e2e8f0', marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#475569' }}>
                  Inventori
                </div>
                <FormRow label="Unit Pengukuran">
                  <input type="text" value={formSatuan} onChange={(e) => setFormSatuan(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', fontSize: 13 }} />
                </FormRow>
                <FormRow label="Stok kosong" desc="Aktifkan jika stok produk sedang kosong">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label className="pi-switch">
                      <input type="checkbox" checked={formStokKosong} onChange={(e) => setFormStokKosong(e.target.checked)} />
                      <span className="pi-slider">
                        <span className="pi-slider-text">{formStokKosong ? 'Ya' : 'Tidak'}</span>
                      </span>
                    </label>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{formStokKosong ? 'Ya' : 'Tidak'}</span>
                  </div>
                </FormRow>

                {/* Pengiriman */}
                <div style={{ padding: '14px 0 8px 0', borderBottom: '1px solid #e2e8f0', marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#475569' }}>
                  Pengiriman
                </div>
                <FormRow label="Butuh Pengiriman" desc="Jika pengiriman dibutuhkan, pastikan daftar harga pengiriman telah diisi dengan benar di bagian menu &quot;Pengaturan > Pengiriman&quot;">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label className="pi-switch">
                      <input type="checkbox" checked={formButuhPengiriman} onChange={(e) => setFormButuhPengiriman(e.target.checked)} />
                      <span className="pi-slider">
                        <span className="pi-slider-text">{formButuhPengiriman ? 'Ya' : 'Tidak'}</span>
                      </span>
                    </label>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{formButuhPengiriman ? 'Ya' : 'Tidak'}</span>
                  </div>
                </FormRow>
                <FormRow label="Berat Produk" desc="Berat produk dalam kilogram (kg). Gunakan titik &quot;.&quot; untuk desimal">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                    <input type="text" value={formBerat} onChange={(e) => setFormBerat(e.target.value)} style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', fontSize: 13 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>kg</span>
                  </div>
                </FormRow>

                {/* Informasi Tambahan */}
                <div style={{ padding: '14px 0 8px 0', borderBottom: '1px solid #e2e8f0', marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#475569' }}>
                  Informasi Tambahan
                </div>
                <FormRow label="Harga produk sudah termasuk pajak" desc="Aktifkan jika produk bebas pajak">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label className="pi-switch">
                      <input type="checkbox" checked={formBebasPajak} onChange={(e) => setFormBebasPajak(e.target.checked)} />
                      <span className="pi-slider">
                        <span className="pi-slider-text">{formBebasPajak ? 'Ya' : 'Tidak'}</span>
                      </span>
                    </label>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{formBebasPajak ? 'Ya' : 'Tidak'}</span>
                  </div>
                </FormRow>
                <FormRow label="Produk tidak dikenakan biaya layanan">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label className="pi-switch">
                      <input type="checkbox" checked={formBebasBiayaLayanan} onChange={(e) => setFormBebasBiayaLayanan(e.target.checked)} />
                      <span className="pi-slider">
                        <span className="pi-slider-text">{formBebasBiayaLayanan ? 'Ya' : 'Tidak'}</span>
                      </span>
                    </label>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{formBebasBiayaLayanan ? 'Ya' : 'Tidak'}</span>
                  </div>
                </FormRow>
                <FormRow label="Siap publikasikan untuk dijual" desc="Ketika produk anda dipublikasikan untuk dijual, maka pembeli bisa membeli lewat toko online atau POS (Point of Sale), sesuai dengan tanggal mulai dijual/diaktifkan">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label className="pi-switch">
                      <input type="checkbox" checked={formTersediaOnline} onChange={(e) => setFormTersediaOnline(e.target.checked)} />
                      <span className="pi-slider">
                        <span className="pi-slider-text">{formTersediaOnline ? 'Ya' : 'Tidak'}</span>
                      </span>
                    </label>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{formTersediaOnline ? 'Ya' : 'Tidak'}</span>
                  </div>
                </FormRow>
                <FormRow label="Tanggal mulai jual">
                  <input type="date" value={formTanggalTersediaOnline} onChange={(e) => setFormTanggalTersediaOnline(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', fontSize: 13 }} />
                </FormRow>
                <FormRow label="Tidak muncul di Point Of Sale" desc="Dengan tidak memunculkan di Point Of Sale, anda tidak akan melihat dan tidak akan bisa menjual produk ini">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label className="pi-switch">
                      <input type="checkbox" checked={formTidakTersediaOfflinePos} onChange={(e) => setFormTidakTersediaOfflinePos(e.target.checked)} />
                      <span className="pi-slider">
                        <span className="pi-slider-text">{formTidakTersediaOfflinePos ? 'Ya' : 'Tidak'}</span>
                      </span>
                    </label>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{formTidakTersediaOfflinePos ? 'Ya' : 'Tidak'}</span>
                  </div>
                </FormRow>

                {/* SEO */}
                <div style={{ padding: '14px 0 8px 0', borderBottom: '1px solid #e2e8f0', marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#475569' }}>
                  SEO (Search Engine Optimization)
                </div>
                <FormRow label="Meta Keywords" desc="Kata-kata kunci/hashtags yang sesuai dengan produk Anda. Buatlah 10-15 kata kunci/hashtags yang mewakili produk ini. Tekan &quot;Enter&quot; untuk mengakhiri sebuah kata atau kombinasi kata">
                  <input type="text" value={formMetaKeywords} onChange={(e) => setFormMetaKeywords(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', fontSize: 13 }} />
                </FormRow>
                <FormRow label="Meta Description" desc="Paragraf pendek yang menjelaskan produk Anda. Meta description akan muncul di halaman hasil pencarian search engine (google/bing), sehingga sangat penting untuk menulis penjelasan singkat yang menarik.">
                  <textarea value={formMetaDescription} onChange={(e) => setFormMetaDescription(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', fontSize: 13, minHeight: 60 }} />
                </FormRow>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer',
            fontSize: 13, fontWeight: 700, color: '#026da7', padding: '8px 16px',
          }}
        >
          Kembali
        </button>
        {DETAIL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 0,
              borderBottom: activeTab === tab.id ? '2px solid #026da7' : '2px solid transparent',
              color: activeTab === tab.id ? '#026da7' : '#0f172a',
              fontWeight: 700,
              fontSize: 13,
              padding: '8px 0',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab !== 'profil' ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
          Tab ini belum dibangun — kirim contoh tampilannya dari Olsera untuk saya bangun berikutnya.
        </div>
      ) : (
        <>
          <Section
            title="Info Umum"
            headerRight={
              editingSection === 'info_umum' ? (
                <SaveCancelHeader storeName={storeName} onCancel={cancelEdit} onSave={saveInfoUmum} saving={savingSection} />
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <EditButton onClick={startEditInfoUmum} />
                  <button
                    type="button"
                    onClick={startCopyProduct}
                    style={{ background: '#fff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: 6, padding: '7px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Salin
                  </button>
                </div>
              )
            }
          >
            {editingSection === 'info_umum' ? (
              <>
                <FormRow label="Foto" desc="Rekomendasi: 3-5 Gambar Produk. Gunakan 5 foto terbaik untuk produk ini. (Format: JPG, JPEG, PNG, WEBP, max 1 MB)">
                  <label className="pi-upload-square" style={{ cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {photoPreviewUrl ? (
                      <img src={photoPreviewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Plus size={24} />
                    )}
                    <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                  </label>
                </FormRow>
                <FormRow label="Nama Produk" desc="Tulis nama produk sesuai jenis, merek, dan rincian produk">
                  <input type="text" value={formNama} onChange={(e) => setFormNama(e.target.value)} />
                </FormRow>
                <FormRow label="Nama Produk Alternatif" desc="Tulis alternatif nama produk dalam bahasa Mandarin / Latin">
                  <input type="text" value={formNamaAlt} onChange={(e) => setFormNamaAlt(e.target.value)} />
                </FormRow>
                <FormRow label="Grup" desc="Pilih dari yang ada atau tambahkan yang baru">
                  <select value={formKategori ? String(formKategori) : ''} onChange={(e) => setFormKategori(e.target.value)}>
                    <option value="">Pilih salah satu</option>
                    {localCategories.map((cat) => (
                      <option key={cat.id} value={String(cat.id)}>{cat.nama}</option>
                    ))}
                  </select>
                </FormRow>
                <FormRow label="Koleksi" desc="Nama koleksi produk, e.g. Koleksi Hari Raya, dll">
                  <select value={formKoleksi ? String(formKoleksi) : ''} onChange={(e) => setFormKoleksi(e.target.value)}>
                    <option value="">Pilih salah satu</option>
                    {collections.map((col) => (
                      <option key={col.id} value={String(col.id)}>{col.nama}</option>
                    ))}
                  </select>
                </FormRow>
                <FormRow label="Brand" desc="Pilih dari yang ada atau tambahkan yang baru">
                  <select value={formBrand ? String(formBrand) : ''} onChange={(e) => setFormBrand(e.target.value)}>
                    <option value="">Pilih salah satu</option>
                    {localBrands.map((b) => (
                      <option key={b.id} value={String(b.id)}>{b.nama}</option>
                    ))}
                  </select>
                </FormRow>
                <FormRow label="SKU" desc="SKU (Stock Keeping Unit) atau Barcode dapat dipergunakan untuk pencarian produk">
                  <input type="text" value={formSku} onChange={(e) => setFormSku(e.target.value)} />
                </FormRow>
                <FormRow label="Barcode" desc="Barcode untuk produk Anda">
                  <input type="text" value={formBarcode} onChange={(e) => setFormBarcode(e.target.value)} />
                </FormRow>
                <FormRow label="Kondisi">
                  <select value={formKondisi} onChange={(e) => setFormKondisi(e.target.value)}>
                    <option value="Baru">Baru</option>
                    <option value="Bekas">Bekas</option>
                  </select>
                </FormRow>
                <FormRow label="Product bebas pajak" desc="Aktifkan jika produk bebas pajak">
                  <label className="pi-switch">
                    <input type="checkbox" checked={formBebasPajak} onChange={(e) => setFormBebasPajak(e.target.checked)} />
                    <span className="pi-slider">
                      <span className="pi-slider-text">{formBebasPajak ? 'Ya' : 'Tidak'}</span>
                    </span>
                  </label>
                </FormRow>
                <FormRow label="Produk tidak dikenakan biaya layanan">
                  <label className="pi-switch">
                    <input type="checkbox" checked={formBebasBiayaLayanan} onChange={(e) => setFormBebasBiayaLayanan(e.target.checked)} />
                    <span className="pi-slider">
                      <span className="pi-slider-text">{formBebasBiayaLayanan ? 'Ya' : 'Tidak'}</span>
                    </span>
                  </label>
                </FormRow>
              </>
            ) : (
              <>
                <Row label="Nama Produk" value={product.nama} />
                <Row label="Nama Produk Alternatif" value={product.nama_alternatif} />
                <Row label="Klasifikasi" value={product.klasifikasi} />
                <Row label="Produk Grup" value={product.kategori_nama} />
                <Row label="Koleksi" value={product.koleksi_nama} />
                <Row label="SKU" value={product.sku} />
                <Row label="Barcode" value={product.barcode} />
                <Row label="Brand" value={product.brand_nama} />
              </>
            )}
          </Section>

          <Section
            title="Harga"
            headerRight={
              editingSection === 'harga' ? (
                <SaveCancelHeader
                  storeName={storeName}
                  onCancel={cancelEdit}
                  onSave={saveHarga}
                  saving={savingSection}
                />
              ) : (
                <EditButton onClick={startEditHarga} />
              )
            }
          >
            {editingSection === 'harga' ? (
              <>
                <Row label="Harga jual di toko bersifat dinamis">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '6px 0' }}>
                    <label className="pi-switch">
                      <input
                        type="checkbox"
                        checked={hargaDinamisEdit}
                        onChange={(e) => setHargaDinamisEdit(e.target.checked)}
                      />
                      <span className="pi-slider">
                        <span className="pi-slider-text">{hargaDinamisEdit ? 'Ya' : 'Tidak'}</span>
                      </span>
                    </label>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                      {hargaDinamisEdit ? 'Ya' : 'Tidak'}
                    </span>
                  </div>
                </Row>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '14px 0' }}>
                  {/* Card 1: Harga Pasar */}
                  {hasVariant ? (
                    <ReferVarianCard label="Harga Pasar" aggregate={formatCurrency(firstVariant.harga_pasar)} />
                  ) : (
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', background: '#fff' }}>
                      <div style={{ fontSize: 11, color: '#0284c7', marginBottom: 6 }}>Harga Pasar</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 8px' }}>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>IDR</span>
                        <input
                          type="number"
                          value={hargaPasarEdit}
                          onChange={(e) => setHargaPasarEdit(e.target.value)}
                          style={{ border: 0, background: 'transparent', fontSize: 13, fontWeight: 700, color: '#334155', width: '100%', outline: 'none', padding: 0 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Card 2: Harga Beli */}
                  {hasVariant ? (
                    <ReferVarianCard
                      label={
                        <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <span>Harga Beli</span>
                          <span style={{ cursor: 'pointer', color: '#64748b' }}>👁️</span>
                        </span>
                      }
                      aggregate={formatCurrency(firstVariant.harga_beli)}
                    />
                  ) : (
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', background: '#fff' }}>
                      <div style={{ fontSize: 11, color: '#0284c7', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Harga Beli</span>
                        <span style={{ cursor: 'pointer', color: '#64748b' }}>👁️</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 8px' }}>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>IDR</span>
                        <input
                          type="number"
                          value={hargaBeliEdit}
                          onChange={(e) => setHargaBeliEdit(e.target.value)}
                          style={{ border: 0, background: 'transparent', fontSize: 13, fontWeight: 700, color: '#334155', width: '100%', outline: 'none', padding: 0 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Card 3: Harga Jual Online */}
                  {hasVariant ? (
                    <ReferVarianCard label="Harga Jual Online" aggregate={formatCurrency(firstVariant.harga_jual_online)} />
                  ) : (
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', background: '#fff' }}>
                      <div style={{ fontSize: 11, color: '#0284c7', marginBottom: 6 }}>Harga Jual Online</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 8px' }}>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>IDR</span>
                        <input
                          type="number"
                          value={hargaJualOnlineEdit}
                          onChange={(e) => setHargaJualOnlineEdit(e.target.value)}
                          style={{ border: 0, background: 'transparent', fontSize: 13, fontWeight: 700, color: '#334155', width: '100%', outline: 'none', padding: 0 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Card 4: Harga Jual di Toko */}
                  {hasVariant ? (
                    <ReferVarianCard label="Harga Jual di Toko" aggregate={formatCurrency(firstVariant.harga_jual_toko)} />
                  ) : (
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', background: '#fff' }}>
                      <div style={{ fontSize: 11, color: '#0284c7', marginBottom: 6 }}>Harga Jual di Toko</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 8px' }}>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>IDR</span>
                        <input
                          type="number"
                          value={hargaJualTokoEdit}
                          onChange={(e) => setHargaJualTokoEdit(e.target.value)}
                          style={{ border: 0, background: 'transparent', fontSize: 13, fontWeight: 700, color: '#334155', width: '100%', outline: 'none', padding: 0 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Card 5: Komisi */}
                  {hasVariant ? (
                    <ReferVarianCard label="Komisi" aggregate={formatCurrency(firstVariant.komisi || 0)} />
                  ) : (
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', background: '#fff' }}>
                      <div style={{ fontSize: 11, color: '#0284c7', marginBottom: 6 }}>Komisi</div>
                      {/* IDR vs % Button Group */}
                      <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden', marginBottom: 6, width: 'fit-content' }}>
                        <button
                          type="button"
                          onClick={() => setKomisiTipeEdit('nominal')}
                          style={{
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: komisiTipeEdit === 'nominal' ? 700 : 500,
                            background: komisiTipeEdit === 'nominal' ? '#0284c7' : '#fff',
                            color: komisiTipeEdit === 'nominal' ? '#fff' : '#64748b',
                            border: 0,
                            cursor: 'pointer',
                            borderRight: '1px solid #cbd5e1',
                          }}
                        >
                          IDR
                        </button>
                        <button
                          type="button"
                          onClick={() => setKomisiTipeEdit('persen')}
                          style={{
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: komisiTipeEdit === 'persen' ? 700 : 500,
                            background: komisiTipeEdit === 'persen' ? '#0284c7' : '#fff',
                            color: komisiTipeEdit === 'persen' ? '#fff' : '#64748b',
                            border: 0,
                            cursor: 'pointer',
                          }}
                        >
                          %
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 8px' }}>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                          {komisiTipeEdit === 'nominal' ? 'IDR' : '%'}
                        </span>
                        <input
                          type="number"
                          value={komisiEdit}
                          onChange={(e) => setKomisiEdit(e.target.value)}
                          style={{ border: 0, background: 'transparent', fontSize: 13, fontWeight: 700, color: '#334155', width: '100%', outline: 'none', padding: 0 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Card 6: Minimal Pesanan */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', background: '#fff' }}>
                    <div style={{ fontSize: 11, color: '#0284c7', marginBottom: 6 }}>Minimal Pesanan</div>
                    <input
                      type="number"
                      value={minimalPesananEdit}
                      onChange={(e) => setMinimalPesananEdit(e.target.value)}
                      style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 8px', fontSize: 13, fontWeight: 700, color: '#334155', width: '100%', background: '#f8fafc', outline: 'none' }}
                    />
                  </div>

                  {/* Card 7: Maksimal Pesanan */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', background: '#fff' }}>
                    <div style={{ fontSize: 11, color: '#0284c7', marginBottom: 6 }}>Maksimal Pesanan</div>
                    <input
                      type="number"
                      value={maksimalPesananEdit}
                      onChange={(e) => setMaksimalPesananEdit(e.target.value)}
                      style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 8px', fontSize: 13, fontWeight: 700, color: '#334155', width: '100%', background: '#f8fafc', outline: 'none' }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <Row label="Harga jual di toko bersifat dinamis" value={yaTidak(product.harga_dinamis)} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '14px 0' }}>
                  {hasVariant ? (
                    <>
                      <ReferVarianCard label="Harga Pasar" aggregate={formatCurrency(firstVariant.harga_pasar)} />
                      <ReferVarianCard
                        label={
                          <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span>Harga Beli</span>
                            <span style={{ cursor: 'pointer', color: '#64748b' }}>👁️</span>
                          </span>
                        }
                        aggregate={formatCurrency(firstVariant.harga_beli)}
                      />
                      <ReferVarianCard label="Harga Jual Online" aggregate={formatCurrency(firstVariant.harga_jual_online)} />
                      <ReferVarianCard label="Harga Jual di Toko" aggregate={formatCurrency(firstVariant.harga_jual_toko)} />
                      <ReferVarianCard label="Komisi" aggregate={formatCurrency(firstVariant.komisi || 0)} />
                      <PlainCard label="Minimal Pesanan" value={product.minimal_pesanan} />
                      <PlainCard label="Maksimal Pesanan" value={product.maksimal_pesanan} />
                    </>
                  ) : (
                    <>
                      <PlainCard label="Harga Pasar" value={formatCurrency(product.harga_pasar)} />
                      <PlainCard
                        label={
                          <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span>Harga Beli</span>
                            <span style={{ cursor: 'pointer', color: '#64748b' }}>👁️</span>
                          </span>
                        }
                        value={formatCurrency(product.harga_beli)}
                      />
                      <PlainCard label="Harga Jual Online" value={formatCurrency(product.harga_jual_online)} />
                      <PlainCard label="Harga Jual di Toko" value={formatCurrency(product.harga_jual_toko)} />
                      <PlainCard label="Komisi" value={formatCurrency(product.komisi)} />
                      <PlainCard label="Minimal Pesanan" value={product.minimal_pesanan} />
                      <PlainCard label="Maksimal Pesanan" value={product.maksimal_pesanan} />
                    </>
                  )}
                </div>
              </>
            )}
          </Section>

          <Section title="Inventori" headerRight={<EditButton onClick={() => {}} />}>
            <Row label="Lacak Inventori" value={yaTidak(product.lacak_inventori)} />
            <div style={{ padding: '13px 0', borderBottom: '1px solid #f1f5f9' }}>
              <ReferVarianCard label="On hold qty" />
            </div>
            <Row label="Peringatan jika stock sisa" value={product.stok_minimum} />
            <div style={{ padding: '13px 0', borderBottom: '1px solid #f1f5f9' }}>
              {hasVariant ? (
                <ReferVarianCard label="Qty Stok" aggregate={firstVariant.qty_stok} />
              ) : (
                <Row label="Qty Stok" value={product.qty_stok} />
              )}
            </div>
            <div style={{ padding: '13px 0', borderBottom: '1px solid #f1f5f9' }}>
              <ReferVarianCard label="Qty Fast Moving" />
            </div>
            <Row label="Unit Pengukuran" value={product.satuan} />
            <Row label="Stok kosong" value={yaTidak(stokKosong)} />
          </Section>

          <Section title="Pengiriman" headerRight={<EditButton onClick={() => {}} />}>
            <Row label="Butuh Pengiriman" value={yaTidak(product.butuh_pengiriman)} />
            <Row label="Berat Produk" value={product.berat ? `${product.berat} kg` : '-'} />
          </Section>

          <Section title="Penjualan" headerRight={<EditButton onClick={() => {}} />}>
            <Row label="Pesanan disertai pengisian No Seri." value={yaTidak(product.pesanan_no_seri)} />
          </Section>

          <Section title="Kategori Tambahan" headerRight={<EditButton onClick={() => {}} />}>
            <Row label="Kategorikan sebagai Unggulan" value={yaTidak(product.kategori_unggulan)} />
            <Row label="Kategorikan sebagai Sale" value={yaTidak(product.kategori_sale)} />
            <Row label="Kategorikan sebagai Pre-order" value={yaTidak(product.kategori_preorder)} />
            <Row label="Kategorikan sebagai Rilis terbaru" value={yaTidak(product.kategori_rilis_terbaru)} />
            <Row label="Kategorikan sebagai Populer" value={yaTidak(product.kategori_populer)} />
            <Row label="Kategorikan sebagai Bahan Mentah" value={yaTidak(product.kategori_bahan_mentah)} />
          </Section>

          <Section title="Deskripsi" headerRight={<EditButton onClick={() => {}} />}>
            <Row label="Deskripsi" value={product.deskripsi || '-'} />
          </Section>

          <Section title="SEO (Search Engine Optimization)" headerRight={<EditButton onClick={() => {}} />}>
            <Row label="Meta Keywords" value={product.meta_keywords || '-'} />
            <Row label="Meta Description" value={product.meta_description || '-'} />
          </Section>

          <Section title="Ketersediaan" headerRight={<EditButton onClick={() => {}} />}>
            <Row label="Tersedia Online" value={yaTidak(product.tersedia_online)} />
            <Row label="Tanggal tersedia Online" value={formatTanggal(product.tanggal_tersedia_online)} />
            <Row label="Tidak tersedia Offline (di POS)" value={yaTidak(product.tidak_tersedia_offline_pos)} />
          </Section>

          <Section title="Catatan" headerRight={<EditButton onClick={() => {}} />}>
            <Row label="Catatan tambahan untuk produk ini" value={product.catatan || '-'} />
          </Section>
        </>
      )}
    </div>
  );
}
