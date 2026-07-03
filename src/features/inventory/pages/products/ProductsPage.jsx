import { useEffect, useState } from 'react';
import { MoreHorizontal, Plus, Trash2, MoreVertical, Upload, Download, Copy, ChevronUp } from 'lucide-react';
import DataTable from '../components/DataTable';
import { Button, PageHeader, Select, StatusBadge, Toolbar } from '../components/PageShell';
import { formatCurrency } from '../productInventoryData';
import { useAuth } from '../../../../context/AuthContext';
import apiClient from '../../../../api/apiClient';
import VariantModal from './VariantModal';

export default function ProductsPage() {
  const { businessSettings } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isCreating, setIsCreating] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  // Form states matching screenshot
  const [formNama, setFormNama] = useState('');
  const [formNamaAlt, setFormNamaAlt] = useState('');
  const [formKategori, setFormKategori] = useState('');
  const [formHargaToko, setFormHargaToko] = useState('');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [onlinePriceSame, setOnlinePriceSame] = useState(true);
  const [trackInventory, setTrackInventory] = useState(false);
  const [formRack, setFormRack] = useState('');
  const [formQtyStok, setFormQtyStok] = useState('');
  const [formStokMinimum, setFormStokMinimum] = useState('');
  const [formQtyFastMoving, setFormQtyFastMoving] = useState('');
  const [hasVariants, setHasVariants] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [variantTrackInventory, setVariantTrackInventory] = useState(false);
  const [variantTypes, setVariantTypes] = useState([{ name: '', values: [] }]);
  const [variantRows, setVariantRows] = useState([]);
  const [removedVariantLabels, setRemovedVariantLabels] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);

  const updateVariantTypeName = (idx, name) =>
    setVariantTypes((prev) => prev.map((t, i) => (i === idx ? { ...t, name } : t)));
  const addVariantTypeValue = (idx, value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setVariantTypes((prev) =>
      prev.map((t, i) => (i === idx && !t.values.includes(trimmed) ? { ...t, values: [...t.values, trimmed] } : t))
    );
  };
  const removeVariantTypeValue = (idx, value) =>
    setVariantTypes((prev) => prev.map((t, i) => (i === idx ? { ...t, values: t.values.filter((v) => v !== value) } : t)));
  const addVariantType = () => setVariantTypes((prev) => [...prev, { name: '', values: [] }]);
  const removeVariantType = (idx) => setVariantTypes((prev) => prev.filter((_, i) => i !== idx));
  const updateVariantRow = (label, key, value) =>
    setVariantRows((prev) => prev.map((r) => (r.label === label ? { ...r, [key]: value } : r)));
  const removeVariantRow = (label) => {
    setRemovedVariantLabels((prev) => [...prev, label]);
    setVariantRows((prev) => prev.filter((r) => r.label !== label));
  };

  useEffect(() => {
    if (!hasVariants) return;
    const cleaned = variantTypes
      .map((t) => ({ name: t.name.trim(), values: t.values }))
      .filter((t) => t.name && t.values.length > 0);
    // Urutan mengikuti Olsera: tipe yang ditambahkan belakangan berganti paling lambat (outer loop),
    // tipe yang ditambahkan duluan berganti paling cepat (inner loop) — mis. warna,ukuran -> hijau,s / biru,s / hijau,m / biru,m
    const labels = cleaned.length
      ? [...cleaned]
          .reverse()
          .reduce((acc, type) => acc.flatMap((combo) => type.values.map((v) => [v, ...combo])), [[]])
          .map((combo) => combo.join(','))
      : [];
    setVariantRows((prev) => {
      const prevByLabel = Object.fromEntries(prev.map((r) => [r.label, r]));
      return labels
        .filter((label) => !removedVariantLabels.includes(label))
        .map(
          (label) =>
            prevByLabel[label] || {
              label,
              nama_alternatif: '',
              barcode: '',
              sku: '',
              harga_beli: '',
              harga_pasar: '',
              harga_jual_online: '',
              harga_jual_toko: '',
              berat: '1',
              qty_stok: '',
              rack: '',
            }
        );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantTypes, hasVariants]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.kategori = categoryFilter;
      const res = await apiClient.get('/products/', { params });
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      const filtered = brandFilter ? data.filter((p) => String(p.brand) === String(brandFilter)) : data;
      setProducts(filtered);
    } catch (err) {
      console.error('[ProductsPage] fetch products error:', err);
      setError('Gagal memuat daftar produk.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          apiClient.get('/product-categories/'),
          apiClient.get('/brands/'),
        ]);
        setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.results || []);
        setBrands(Array.isArray(brandRes.data) ? brandRes.data : brandRes.data?.results || []);
      } catch (err) {
        console.error('[ProductsPage] fetch categories/brands error:', err);
      }
    })();
  }, []);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter, brandFilter]);

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(products.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const resetForm = () => {
    setFormNama('');
    setFormNamaAlt('');
    setFormKategori('');
    setFormHargaToko('');
    setFormDeskripsi('');
    setOnlinePriceSame(true);
    setTrackInventory(false);
    setFormRack('');
    setFormQtyStok('');
    setFormStokMinimum('');
    setFormQtyFastMoving('');
    setHasVariants(false);
    setShowVariantModal(false);
    setVariantTrackInventory(false);
    setVariantTypes([{ name: '', values: [] }]);
    setVariantRows([]);
    setRemovedVariantLabels([]);
    setDetailOpen(false);
    setSelectedPhoto(null);
    setPhotoPreviewUrl(null);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedPhoto(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const handleSaveProduct = async () => {
    if (!formNama.trim() || saving) return;
    setSaving(true);
    try {
      const trackingAtProductLevel = trackInventory && !hasVariants;
      const res = await apiClient.post('/products/', {
        nama: formNama,
        nama_alternatif: formNamaAlt || null,
        kategori: formKategori || null,
        harga_jual_toko: formHargaToko || 0,
        harga_online_sama: onlinePriceSame,
        lacak_inventori: trackInventory,
        rack: trackingAtProductLevel ? formRack || '' : '',
        qty_stok: trackingAtProductLevel ? formQtyStok || 0 : 0,
        stok_minimum: trackingAtProductLevel ? formStokMinimum || 0 : 0,
        qty_fast_moving: trackingAtProductLevel ? formQtyFastMoving || 0 : 0,
        has_variant: hasVariants,
        deskripsi: formDeskripsi || null,
      });
      if (hasVariants && variantRows.length > 0) {
        await Promise.all(
          variantRows.map((row) =>
            apiClient.post('/product-variants/', {
              product: res.data.id,
              nama_varian: row.label,
              nama_alternatif: row.nama_alternatif || null,
              barcode: row.barcode || null,
              sku: row.sku || null,
              harga_beli: row.harga_beli || 0,
              harga_pasar: row.harga_pasar || 0,
              harga_jual_online: row.harga_jual_online || 0,
              harga_jual_toko: row.harga_jual_toko || 0,
              lacak_inventori: variantTrackInventory,
              qty_stok: variantTrackInventory ? row.qty_stok || 0 : 0,
              rack: variantTrackInventory ? row.rack || '' : '',
              berat: row.berat || null,
            })
          )
        );
      }
      if (selectedPhoto) {
        const fd = new FormData();
        fd.append('product', res.data.id);
        fd.append('is_primary', 'true');
        fd.append('foto', selectedPhoto);
        await apiClient.post('/product-images/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      resetForm();
      setIsCreating(false);
      await fetchProducts();
    } catch (err) {
      console.error('[ProductsPage] create product error:', err);
      setError('Gagal menyimpan produk.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map((id) => apiClient.delete(`/products/${id}/`)));
      setSelectedIds([]);
      await fetchProducts();
    } catch (err) {
      console.error('[ProductsPage] delete products error:', err);
      setError('Gagal menghapus produk terpilih.');
    }
  };

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectedIds.length === products.length && products.length > 0}
          onChange={toggleSelectAll}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => toggleSelectRow(row.id)}
        />
      ),
    },
    { key: 'photo', label: 'Foto', render: (row) => (
      row.fotos?.[0]?.foto
        ? <img src={row.fotos[0].foto} alt={row.nama} className="pi-product-thumb" style={{ objectFit: 'cover' }} />
        : <div className="pi-product-thumb" />
    ) },
    { key: 'nama', label: 'Nama Produk' },
    { key: 'variant', label: 'Variant', render: (row) => (row.has_variant ? `${row.variants?.length || 0} varian` : '-') },
    { key: 'sku', label: 'SKU', render: (row) => row.sku || '-' },
    { key: 'barcode', label: 'Barcode', render: (row) => row.barcode || '-' },
    { key: 'qty_stok', label: 'Qty Stok', render: (row) => (row.lacak_inventori ? row.qty_stok : '-') },
    { key: 'satuan', label: 'Satuan' },
    { key: 'harga_beli', label: 'Harga Beli', render: (row) => formatCurrency(row.harga_beli) },
    { key: 'harga_jual_toko', label: 'Harga Jual di Toko', render: (row) => formatCurrency(row.harga_jual_toko) },
    { key: 'harga_jual_online', label: 'Harga Jual Online', render: (row) => formatCurrency(row.harga_jual_online) },
    { key: 'tersedia_online', label: 'Tersedia Online', render: (row) => <StatusBadge active={row.tersedia_online} label={row.tersedia_online ? 'Ya' : 'Tidak'} /> },
    { key: 'action', label: '', render: () => <button className="pi-icon-button"><MoreHorizontal size={16} /></button> },
  ];

  if (isCreating) {
    return (
      <div className="pi-create-container">
        <div className="pi-create-header">
          <h2>Tambah Produk</h2>
          <div className="pi-create-actions">
            <button className="pi-btn pi-btn-secondary" onClick={() => { resetForm(); setIsCreating(false); }}>
              Batal
            </button>
            <div className="pi-store-select-group">
              <span>Simpan di:</span>
              <select className="pi-store-select">
                <option>{businessSettings?.nama_bisnis || 'Bintang Advertising'}</option>
              </select>
            </div>
            <button
              className="pi-btn pi-btn-secondary"
              disabled={!formNama.trim() || saving}
              onClick={handleSaveProduct}
              style={!formNama.trim() || saving ? { background: '#e2e8f0', color: '#94a3b8', border: '0' } : undefined}
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>

        <div className="pi-form-rows">
          {/* Gambar Produk */}
          <div className="pi-create-row">
            <div className="pi-row-label-desc">
              <span className="pi-row-label">Gambar Produk</span>
              <span className="pi-row-desc">
                Rekomendasi: 3-5 Gambar Produk. Gunakan foto terbaik untuk produk ini. (Format: JPG, JPEG, PNG, WEBP, max 2 MB)
              </span>
            </div>
            <div className="pi-row-input">
              <label className="pi-upload-square" style={{ cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {photoPreviewUrl ? (
                  <img src={photoPreviewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Plus size={24} />
                )}
                <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {/* Nama Produk */}
          <div className="pi-create-row">
            <div className="pi-row-label-desc">
              <span className="pi-row-label">Nama Produk</span>
              <span className="pi-row-desc">
                Tulis nama produk sesuai jenis, merek, dan varian produk *
              </span>
            </div>
            <div className="pi-row-input">
              <input type="text" placeholder="Masukkan Nama Produk" value={formNama} onChange={(e) => setFormNama(e.target.value)} />
            </div>
          </div>

          {/* Nama Produk Alternatif */}
          <div className="pi-create-row">
            <div className="pi-row-label-desc">
              <span className="pi-row-label">Nama Produk Alternatif</span>
              <span className="pi-row-desc">
                Tulis alternatif nama produk dalam bahasa Mandarin / Latin
              </span>
            </div>
            <div className="pi-row-input">
              <input type="text" placeholder="Masukkan Nama Produk Alternatif" value={formNamaAlt} onChange={(e) => setFormNamaAlt(e.target.value)} />
            </div>
          </div>

          {/* Kategori Produk */}
          <div className="pi-create-row">
            <div className="pi-row-label-desc">
              <span className="pi-row-label">Kategori Produk</span>
              <span className="pi-row-desc">
                Pilih dari yang ada atau tambahkan yang baru
              </span>
            </div>
            <div className="pi-row-input">
              <select value={formKategori} onChange={(e) => setFormKategori(e.target.value)}>
                <option value="" disabled>Pilih salah satu</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nama}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Harga Jual di Toko */}
          <div className="pi-create-row">
            <div className="pi-row-label-desc">
              <span className="pi-row-label">Harga Jual di Toko</span>
            </div>
            <div className="pi-row-input">
              <input type="text" placeholder="Rp. 0,00" value={formHargaToko} onChange={(e) => setFormHargaToko(e.target.value)} />
            </div>
          </div>

          {/* Harga jual online sama dengan harga jual toko */}
          <div className="pi-create-row">
            <div className="pi-row-label-desc">
              <span className="pi-row-label">Harga jual online sama dengan harga jual toko</span>
            </div>
            <div className="pi-row-input">
              <label className="pi-switch">
                <input
                  type="checkbox"
                  checked={onlinePriceSame}
                  onChange={(e) => setOnlinePriceSame(e.target.checked)}
                />
                <span className="pi-slider">
                  <span className="pi-slider-text">{onlinePriceSame ? 'Ya' : 'Tidak'}</span>
                </span>
              </label>
            </div>
          </div>

          {/* Lacak Inventori */}
          <div className="pi-create-row">
            <div className="pi-row-label-desc">
              <span className="pi-row-label">Lacak Inventori</span>
              <span className="pi-row-desc">
                Jika anda mengaktifkan lacak inventori, sistem akan mengecek ketersediaan stok barang sebelum menjual ke pembeli
              </span>
            </div>
            <div className="pi-row-input">
              <label className="pi-switch">
                <input
                  type="checkbox"
                  checked={trackInventory}
                  onChange={(e) => setTrackInventory(e.target.checked)}
                />
                <span className="pi-slider">
                  <span className="pi-slider-text">{trackInventory ? 'Ya' : 'Tidak'}</span>
                </span>
              </label>
            </div>
          </div>

          {trackInventory && !hasVariants && (
            <>
              <div className="pi-create-row">
                <div className="pi-row-label-desc">
                  <span className="pi-row-label">Rack</span>
                </div>
                <div className="pi-row-input">
                  <input type="text" placeholder="Masukkan Rack" value={formRack} onChange={(e) => setFormRack(e.target.value)} />
                </div>
              </div>
              <div className="pi-create-row">
                <div className="pi-row-label-desc">
                  <span className="pi-row-label">Jumlah stok yang tersedia saat ini</span>
                  <span className="pi-row-desc">
                    Jika produk ini memiliki beberapa varian/pilihan, maka sistem akan mengecek ketersediaan stok berdasarkan masing-masing varian/pilihan.
                  </span>
                </div>
                <div className="pi-row-input">
                  <input type="text" placeholder="Masukkan angka contoh: 1234" value={formQtyStok} onChange={(e) => setFormQtyStok(e.target.value)} />
                </div>
              </div>
              <div className="pi-create-row">
                <div className="pi-row-label-desc">
                  <span className="pi-row-label">Peringatan Sisa Stok</span>
                  <span className="pi-row-desc">Jika stok sudah mencapai batas, maka sistem akan memberi peringatan sebelum stok habis</span>
                </div>
                <div className="pi-row-input">
                  <input type="text" placeholder="Masukkan angka contoh: 1234" value={formStokMinimum} onChange={(e) => setFormStokMinimum(e.target.value)} />
                </div>
              </div>
              <div className="pi-create-row">
                <div className="pi-row-label-desc">
                  <span className="pi-row-label">Qty Fast Moving</span>
                </div>
                <div className="pi-row-input">
                  <input type="text" placeholder="Masukkan angka contoh: 1234" value={formQtyFastMoving} onChange={(e) => setFormQtyFastMoving(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* Varian */}
          <div className="pi-create-row">
            <div className="pi-row-label-desc">
              <span className="pi-row-label">Varian</span>
              <span className="pi-row-desc">
                Aktifkan jika produk memiliki varian misalnya varian, warna atau ukuran
              </span>
            </div>
            <div className="pi-row-input">
              <label className="pi-switch">
                <input
                  type="checkbox"
                  checked={hasVariants}
                  onChange={(e) => setHasVariants(e.target.checked)}
                />
                <span className="pi-slider">
                  <span className="pi-slider-text">{hasVariants ? 'Ya' : 'Tidak'}</span>
                </span>
              </label>
            </div>
          </div>

          {hasVariants && (
            <div className="pi-create-row">
              <div className="pi-row-label-desc">
                <span className="pi-row-label">Kelola Varian</span>
                <span className="pi-row-desc">Atur tipe varian (mis. Warna, Ukuran) dan detail tiap kombinasinya</span>
              </div>
              <div className="pi-row-input" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                {variantRows.length === 0 && (
                  <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>(Varian harus diisi)</span>
                )}
                <button type="button" className="pi-btn pi-btn-secondary" onClick={() => setShowVariantModal(true)}>
                  Manage Variant
                </button>
                {variantRows.length > 0 && (
                  <span style={{ fontSize: 12, color: '#64748b' }}>{variantRows.length} varian dikonfigurasi</span>
                )}
              </div>
            </div>
          )}
        </div>

        <VariantModal
          open={showVariantModal}
          onClose={() => setShowVariantModal(false)}
          variantTypes={variantTypes}
          onUpdateTypeName={updateVariantTypeName}
          onAddTypeValue={addVariantTypeValue}
          onRemoveTypeValue={removeVariantTypeValue}
          onAddType={addVariantType}
          onRemoveType={removeVariantType}
          variantRows={variantRows}
          onUpdateRow={updateVariantRow}
          onRemoveRow={removeVariantRow}
          trackInventory={variantTrackInventory}
          onTrackInventoryChange={setVariantTrackInventory}
          storeName={businessSettings?.nama_bisnis || 'Bintang Advertising'}
        />

        {/* Informasi Detail Collapsible */}
        <div className="pi-collapsible-section">
          <button className="pi-collapsible-trigger" onClick={() => setDetailOpen(!detailOpen)}>
            <span>Informasi Detail (opsional)</span>
            {detailOpen ? <ChevronUp size={16} /> : <Plus size={16} />}
          </button>
          {detailOpen && (
            <div className="pi-collapsible-content">
              <div className="pi-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <label>
                  Deskripsi Produk
                  <textarea
                    placeholder="Masukkan deskripsi produk..."
                    value={formDeskripsi}
                    onChange={(e) => setFormDeskripsi(e.target.value)}
                    style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', minHeight: '100px', font: 'inherit', width: '100%', boxSizing: 'border-box' }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Produk"
        description="Kelola katalog produk jual, harga, SKU, barcode, varian, dan status online."
        actions={<Button variant="success" onClick={() => setIsCreating(true)}><Plus size={16} /> Tambah Produk</Button>}
      />
      <Toolbar
        searchPlaceholder="Cari Produk / SKU / Barcode"
        searchValue={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        left={
          <>
            <button
              className="pi-btn-icon-only"
              title="Hapus Terpilih"
              disabled={selectedIds.length === 0}
              onClick={handleDeleteSelected}
            >
              <Trash2 size={16} />
            </button>
            <div className="pi-dropdown-container">
              <button
                className="pi-btn-icon-only"
                title="Fitur Lainnya"
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              >
                <MoreVertical size={16} />
              </button>
              {moreMenuOpen && (
                <div className="pi-dropdown-menu">
                  <button className="pi-dropdown-item" onClick={() => setMoreMenuOpen(false)}><Upload size={14} /> Import Produk</button>
                  <button className="pi-dropdown-item" onClick={() => setMoreMenuOpen(false)}><Upload size={14} /> Import Bahan / Resep</button>
                  <button className="pi-dropdown-item" onClick={() => setMoreMenuOpen(false)}><Download size={14} /> Export</button>
                  <button className="pi-dropdown-item" onClick={() => setMoreMenuOpen(false)}><Copy size={14} /> Salin Product</button>
                </div>
              )}
            </div>
            <select className="pi-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nama}</option>
              ))}
            </select>
            <select className="pi-select" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
              <option value="">Brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.nama}</option>
              ))}
            </select>
          </>
        }
        right={
          <Button variant="success" onClick={() => setIsCreating(true)}>
            <Plus size={16} /> Tambah
          </Button>
        }
      />

      {error && <p className="pi-table-error" style={{ color: '#dc2626', fontSize: 13, margin: '8px 0' }}>{error}</p>}

      <DataTable columns={columns} rows={products} emptyText={loading ? 'Memuat...' : 'Tidak ada data'} />

      <div className="pi-pagination-container">
        <div className="pi-pagination-left">
          <button
            className="pi-btn-icon-only"
            title="Hapus Terpilih"
            disabled={selectedIds.length === 0}
            onClick={handleDeleteSelected}
          >
            <Trash2 size={16} />
          </button>
        </div>
        <div className="pi-pagination-right">
          <Select defaultValue="10">
            <option value="10">10/page</option>
            <option value="20">20/page</option>
            <option value="50">50/page</option>
          </Select>
          <span>Total {products.length}</span>
          <div className="pi-pagination-pages">
            <button className="pi-pagination-btn" disabled>&lt;</button>
            <span className="pi-pagination-active-page">1</span>
            <button className="pi-pagination-btn" disabled>&gt;</button>
          </div>
          <div className="pi-pagination-goto">
            <span>Go to</span>
            <input type="text" defaultValue="1" readOnly style={{ width: '40px', textAlign: 'center', height: '28px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
          </div>
        </div>
      </div>
    </>
  );
}
