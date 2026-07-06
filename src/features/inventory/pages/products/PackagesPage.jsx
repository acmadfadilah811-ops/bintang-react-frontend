import { useEffect, useState } from 'react';
import { Plus, Search, Copy, Download, ChevronRight, Calendar, GripVertical, Trash2, ArrowLeft, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import { StatusBadge } from '../components/PageShell';
import { formatCurrency } from '../productInventoryData';
import { useAuth } from '../../../../context/AuthContext';
import apiClient from '../../../../api/apiClient';

const formatToRupiahInput = (num) => {
  if (num === null || num === undefined) return 'Rp. 0,00';
  const val = parseFloat(num);
  const formatted = new Intl.NumberFormat('id-ID').format(Math.floor(val));
  return `Rp. ${formatted},00`;
};

const parseRupiah = (raw) => {
  if (!raw) return 0;
  let clean = String(raw).replace(/Rp\./g, '').replace(/\s/g, '').replace(/\./g, '');
  if (clean.endsWith(',00')) {
    clean = clean.slice(0, -3);
  }
  const value = parseFloat(clean);
  return Number.isNaN(value) ? 0 : value;
};

const formatDateLabel = (dateStr) => {
  if (!dateStr) return 'Draft';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Draft';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return 'Draft';
  }
};

export function PackagesPage({ onToggleCreate }) {
  const { businessSettings } = useAuth();
  
  // Package list states
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState('10');

  // Sorting states
  const [sortColumn, setSortColumn] = useState('nama');
  const [sortDirection, setSortDirection] = useState('asc');

  // Available products for package items autocomplete
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Form states - General
  const [namaPaket, setNamaPaket] = useState('');
  const [sku, setSku] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [hargaBeli, setHargaBeli] = useState('Rp. 0,00');
  const [hargaPasar, setHargaPasar] = useState('Rp. 0,00');
  const [hargaJualOnline, setHargaJualOnline] = useState('Rp. 0,00');
  const [hargaJualToko, setHargaJualToko] = useState('Rp. 0,00');
  const [komisi, setKomisi] = useState('Rp. 0,00');
  const [minimalPesanan, setMinimalPesanan] = useState(1);
  const [maksimalPesanan, setMaksimalPesanan] = useState(0);
  const [hargaDinamis, setHargaDinamis] = useState(false);
  const [siapPublikasi, setSiapPublikasi] = useState(false);
  const [tanggalMulaiJual, setTanggalMulaiJual] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  // Form states - Additional Fields
  const [butuhPengiriman, setButuhPengiriman] = useState(true);
  const [bebasPajak, setBebasPajak] = useState(false);
  const [bebasBiayaLayanan, setBebasBiayaLayanan] = useState(false);
  const [tampilPos, setTampilPos] = useState(true);
  const [habisStok, setHabisStok] = useState(false);
  const [seoKeywords, setSeoKeywords] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [packagePhotoFile, setPackagePhotoFile] = useState(null);
  const [packagePhotoPreview, setPackagePhotoPreview] = useState(null);

  // Viewing detail package state
  const [viewingPackage, setViewingPackage] = useState(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [showManageItemsModal, setShowManageItemsModal] = useState(false);

  // Import CSV states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const fetchPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/product-packages/');
      setPackages(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      console.error('[PackagesPage] fetch error:', err);
      setError('Gagal memuat daftar paket produk.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await apiClient.get('/products/');
      setAvailableProducts(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      console.error('Error fetching available products:', err);
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchProducts();
  }, []);

  const resetForm = () => {
    setNamaPaket('');
    setSku('');
    setDeskripsi('');
    setHargaBeli('Rp. 0,00');
    setHargaPasar('Rp. 0,00');
    setHargaJualOnline('Rp. 0,00');
    setHargaJualToko('Rp. 0,00');
    setKomisi('Rp. 0,00');
    setMinimalPesanan(1);
    setMaksimalPesanan(0);
    setHargaDinamis(false);
    setSiapPublikasi(false);
    setTanggalMulaiJual('');
    setSelectedItems([]);
    setButuhPengiriman(true);
    setBebasPajak(false);
    setBebasBiayaLayanan(false);
    setTampilPos(true);
    setHabisStok(false);
    setSeoKeywords('');
    setSeoDescription('');
    setLoyaltyPoints(0);
    setPackagePhotoFile(null);
    setPackagePhotoPreview(null);
  };

  const handleSetIsCreating = (val) => {
    setIsCreating(val);
    if (onToggleCreate) {
      onToggleCreate(val);
    }
    if (val) {
      resetForm();
    }
  };

  const handleSort = (key) => {
    if (sortColumn === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(key);
      setSortDirection('asc');
    }
  };

  const handleAddItem = (prod) => {
    if (selectedItems.some(item => (item.product || item.product_id) === prod.id)) return;
    const newItem = {
      product: prod.id,
      product_id: prod.id,
      product_nama: prod.nama,
      product_sku: prod.sku,
      product_foto: prod.fotos?.[0]?.foto || null,
      variant: prod.variants?.[0]?.id || null,
      variant_id: prod.variants?.[0]?.id || null,
      product_varian_nama: prod.variants?.[0]?.nama_varian || 'Varian Default',
      qty: 1
    };
    setSelectedItems([...selectedItems, newItem]);
    setProductSearchQuery('');
    setShowProductDropdown(false);
  };

  const handleRemoveItem = (prodId) => {
    setSelectedItems(selectedItems.filter(item => (item.product || item.product_id) !== prodId));
  };

  const handleUpdateItemQty = (prodId, newQty) => {
    setSelectedItems(selectedItems.map(item => 
      (item.product || item.product_id) === prodId ? { ...item, qty: Math.max(1, newQty) } : item
    ));
  };

  const handleUpdateItemVariant = (prodId, newVariantName) => {
    const prod = availableProducts.find(p => p.id === prodId);
    const variantObj = prod?.variants?.find(v => v.nama_varian === newVariantName);
    setSelectedItems(selectedItems.map(item => 
      (item.product || item.product_id) === prodId ? { 
        ...item, 
        variant: variantObj ? variantObj.id : null,
        variant_id: variantObj ? variantObj.id : null,
        product_varian_nama: newVariantName 
      } : item
    ));
  };

  const canSave = namaPaket.trim() && parseRupiah(hargaJualOnline) > 0 && selectedItems.length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('nama', namaPaket);
      if (sku) fd.append('sku', sku);
      if (deskripsi) fd.append('deskripsi', deskripsi);
      fd.append('harga_beli', String(parseRupiah(hargaBeli)));
      fd.append('harga_pasar', String(parseRupiah(hargaPasar)));
      fd.append('harga_jual_offline', String(parseRupiah(hargaJualToko)));
      fd.append('harga_jual_online', String(parseRupiah(hargaJualOnline)));
      fd.append('komisi', String(parseRupiah(komisi)));
      fd.append('minimal_pesanan', String(minimalPesanan));
      fd.append('maksimal_pesanan', String(maksimalPesanan));
      fd.append('harga_dinamis', String(hargaDinamis));
      fd.append('publikasi', String(siapPublikasi));
      if (tanggalMulaiJual) fd.append('periode_mulai', tanggalMulaiJual);
      fd.append('butuh_pengiriman', String(butuhPengiriman));
      fd.append('bebas_pajak', String(bebasPajak));
      fd.append('bebas_biaya_layanan', String(bebasBiayaLayanan));
      fd.append('tampil_pos', String(tampilPos));
      fd.append('habis_stok', String(habisStok));
      if (seoKeywords) fd.append('seo_keywords', seoKeywords);
      if (seoDescription) fd.append('seo_description', seoDescription);
      fd.append('loyalty_points', String(loyaltyPoints));
      fd.append('items', JSON.stringify(selectedItems.map(item => ({ 
        product: item.product || item.product_id, 
        variant: item.variant || item.variant_id || null, 
        qty: item.qty 
      }))));
      if (packagePhotoFile) {
        fd.append('foto', packagePhotoFile);
      }

      await apiClient.post('/product-packages/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      resetForm();
      handleSetIsCreating(false);
      await fetchPackages();
    } catch (err) {
      console.error('[PackagesPage] save error:', err);
      setError('Gagal menyimpan paket produk.');
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetail = (pkg) => {
    setViewingPackage(pkg);
    setNamaPaket(pkg.nama || '');
    setSku(pkg.sku || '');
    setDeskripsi(pkg.deskripsi || '');
    setHargaBeli(formatToRupiahInput(pkg.harga_beli));
    setHargaPasar(formatToRupiahInput(pkg.harga_pasar));
    setHargaJualOnline(formatToRupiahInput(pkg.harga_jual_online));
    setHargaJualToko(formatToRupiahInput(pkg.harga_jual_offline));
    setKomisi(formatToRupiahInput(pkg.komisi));
    setMinimalPesanan(pkg.minimal_pesanan ?? 1);
    setMaksimalPesanan(pkg.maksimal_pesanan ?? 0);
    setHargaDinamis(pkg.harga_dinamis ?? false);
    setSiapPublikasi(pkg.publikasi ?? false);
    setTanggalMulaiJual(pkg.periode_mulai ? pkg.periode_mulai.substring(0, 10) : '');
    setButuhPengiriman(pkg.butuh_pengiriman ?? true);
    setBebasPajak(pkg.bebas_pajak ?? false);
    setBebasBiayaLayanan(pkg.bebas_biaya_layanan ?? false);
    setTampilPos(pkg.tampil_pos ?? true);
    setHabisStok(pkg.habis_stok ?? false);
    setSeoKeywords(pkg.seo_keywords || '');
    setSeoDescription(pkg.seo_description || '');
    setSelectedItems(pkg.items || []);
    setLoyaltyPoints(pkg.loyalty_points ?? 0);
    setPackagePhotoFile(null);
    setPackagePhotoPreview(pkg.foto || null);
    setIsEditingDetail(false);
    setShowManageItemsModal(false);
  };

  const handleUpdateDetail = async () => {
    if (!namaPaket.trim() || saving) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('nama', namaPaket);
      if (sku) fd.append('sku', sku);
      if (deskripsi) fd.append('deskripsi', deskripsi);
      fd.append('harga_beli', String(parseRupiah(hargaBeli)));
      fd.append('harga_pasar', String(parseRupiah(hargaPasar)));
      fd.append('harga_jual_offline', String(parseRupiah(hargaJualToko)));
      fd.append('harga_jual_online', String(parseRupiah(hargaJualOnline)));
      fd.append('komisi', String(parseRupiah(komisi)));
      fd.append('minimal_pesanan', String(minimalPesanan));
      fd.append('maksimal_pesanan', String(maksimalPesanan));
      fd.append('harga_dinamis', String(hargaDinamis));
      fd.append('publikasi', String(siapPublikasi));
      if (tanggalMulaiJual) fd.append('periode_mulai', tanggalMulaiJual);
      fd.append('butuh_pengiriman', String(butuhPengiriman));
      fd.append('bebas_pajak', String(bebasPajak));
      fd.append('bebas_biaya_layanan', String(bebasBiayaLayanan));
      fd.append('tampil_pos', String(tampilPos));
      fd.append('habis_stok', String(habisStok));
      if (seoKeywords) fd.append('seo_keywords', seoKeywords);
      if (seoDescription) fd.append('seo_description', seoDescription);
      fd.append('loyalty_points', String(loyaltyPoints));
      fd.append('items', JSON.stringify(selectedItems.map(item => ({ 
        product: item.product || item.product_id, 
        variant: item.variant || item.variant_id || null, 
        qty: item.qty 
      }))));
      if (packagePhotoFile) {
        fd.append('foto', packagePhotoFile);
      }

      const res = await apiClient.put(`/product-packages/${viewingPackage.id}/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setViewingPackage(res.data);
      setIsEditingDetail(false);
      setShowManageItemsModal(false);
      await fetchPackages();
    } catch (err) {
      console.error('[PackagesPage] update error:', err);
      setError('Gagal memperbarui paket produk.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePackage = async () => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus paket produk "${viewingPackage.nama}"?`)) return;
    setSaving(true);
    try {
      await apiClient.delete(`/product-packages/${viewingPackage.id}/`);
      setViewingPackage(null);
      await fetchPackages();
    } catch (err) {
      console.error('[PackagesPage] delete error:', err);
      setError('Gagal menghapus paket produk.');
    } finally {
      setSaving(false);
    }
  };

  const handleImportCsv = async () => {
    if (!importFile || importing) return;
    setImporting(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append('file', importFile);
      const res = await apiClient.post('/product-packages/import-csv/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult({ errors: res.data.errors || [], createdCount: res.data.created?.length || 0 });
      setImportFile(null);
      await fetchPackages();
    } catch (err) {
      console.error('[PackagesPage] import csv error:', err);
      setImportResult({ errors: [err.response?.data?.error || 'Gagal mengimpor file CSV.'], createdCount: 0 });
    } finally {
      setImporting(false);
    }
  };

  const handleCurrencyInputChange = (rawVal, setter) => {
    let clean = rawVal.replace(/[^0-9]/g, '');
    if (!clean) {
      setter('Rp. 0,00');
      return;
    }
    const formatted = new Intl.NumberFormat('id-ID').format(parseInt(clean));
    setter(`Rp. ${formatted},00`);
  };

  // Sort logic for list table
  const filteredPackages = packages.filter(pkg =>
    pkg.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedPackages = [...filteredPackages].sort((a, b) => {
    let valA = a[sortColumn];
    let valB = b[sortColumn];

    if (sortColumn === 'qty') {
      valA = a.items?.length || 0;
      valB = b.items?.length || 0;
    } else if (sortColumn === 'harga_jual_online') {
      valA = parseFloat(a.harga_jual_online) || 0;
      valB = parseFloat(b.harga_jual_online) || 0;
    } else if (sortColumn === 'harga_jual_offline') {
      valA = parseFloat(a.harga_jual_offline) || 0;
      valB = parseFloat(b.harga_jual_offline) || 0;
    } else if (sortColumn === 'publikasi') {
      valA = a.publikasi ? 1 : 0;
      valB = b.publikasi ? 1 : 0;
    } else {
      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredDropdownProducts = availableProducts.filter(prod => {
    const isMatched = prod.nama.toLowerCase().includes(productSearchQuery.toLowerCase()) || 
                      (prod.sku && prod.sku.toLowerCase().includes(productSearchQuery.toLowerCase()));
    const notSelected = !selectedItems.some(item => (item.product || item.product_id) === prod.id);
    return isMatched && notSelected;
  });

  const renderHeaderLabel = (key, text) => {
    const isSorted = sortColumn === key;
    return (
      <div 
        onClick={() => handleSort(key)} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          cursor: 'pointer',
          userSelect: 'none',
          width: '100%',
          height: '100%'
        }}
      >
        <span>{text}</span>
        <span style={{ fontSize: '11px', color: isSorted ? '#0284c7' : '#94a3b8' }}>
          {isSorted ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </div>
    );
  };

  // ----------------------------------------------------
  // RENDER DETAIL VIEW
  // ----------------------------------------------------
  if (viewingPackage) {
    return (
      <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
        <style>{`
          .package-detail-grid {
            display: grid;
            grid-template-columns: 1.5fr 1fr;
            gap: 24px;
          }
          @media (max-width: 1024px) {
            .package-detail-grid {
              grid-template-columns: 1fr;
            }
          }
          .detail-row-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #f1f5f9;
            font-size: 13px;
          }
          .detail-row-label {
            color: #64748b;
            font-weight: 500;
          }
          .detail-row-value {
            color: #0f172a;
            font-weight: 600;
            text-align: right;
          }
          .pkg-item-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            background: #fff;
            margin-bottom: 10px;
          }
          .pkg-item-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .pkg-item-thumb {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
            background: #f1f5f9;
          }
          .btn-kembali {
            background: #ffffff;
            border: 1px solid #16a34a;
            color: #16a34a;
            border-radius: 6px;
            padding: 6px 16px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: background-color 0.15s;
          }
          .btn-kembali:hover {
            background-color: #f0fdf4;
          }
          .btn-ubah {
            background: #0284c7;
            border: 0;
            color: #ffffff;
            border-radius: 6px;
            padding: 6px 16px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: background-color 0.15s;
          }
          .btn-ubah:hover {
            background-color: #025887;
          }

          /* iOS Toggle Switch */
          .pi-simple-switch {
            position: relative;
            display: inline-block;
            width: 40px;
            height: 22px;
          }
          .pi-simple-switch input {
            opacity: 0;
            width: 0;
            height: 0;
          }
          .pi-simple-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #cbd5e1;
            transition: .2s;
            border-radius: 22px;
          }
          .pi-simple-slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .2s;
            border-radius: 50%;
          }
          input:checked + .pi-simple-slider {
            background-color: #0284c7;
          }
          input:checked + .pi-simple-slider:before {
            transform: translateX(18px);
          }

          /* Input labels */
          .form-group-label {
            font-size: 12px;
            font-weight: bold;
            color: #475569;
            margin-bottom: 4px;
            display: block;
          }
        `}</style>

        {/* Header Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <button 
            type="button" 
            onClick={() => setViewingPackage(null)} 
            style={{ background: 'none', border: 0, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>Detail Paket Produk</h2>
        </div>

        <div className="package-detail-grid">
          {/* KIRI: Detail Form */}
          <div className="pi-category-card">
            <div className="pi-category-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{namaPaket || 'Detail Paket'}</h3>
                
                {/* Store Badge */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Simpan di:</span>
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 8px', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>
                      {businessSettings?.nama_bisnis || 'Bayu mart'}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>×</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {isEditingDetail ? (
                  <>
                    <button 
                      type="button" 
                      style={{ background: 'transparent', border: 0, color: '#0284c7', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '6px 12px' }}
                      onClick={() => setIsEditingDetail(false)}
                    >
                      Batal
                    </button>
                    <button 
                      type="button" 
                      className="pi-btn"
                      style={{ background: '#22c55e', color: '#fff', border: 0, borderRadius: 6, padding: '6px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={handleUpdateDetail}
                    >
                      ✓ Simpan
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      type="button" 
                      className="btn-kembali" 
                      onClick={() => setViewingPackage(null)}
                    >
                      Kembali
                    </button>
                    <button 
                      type="button" 
                      className="btn-ubah"
                      onClick={() => setIsEditingDetail(true)}
                    >
                      Ubah
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="pi-category-card-body" style={{ padding: '24px' }}>
              {/* Product Photo Block */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{
                  width: '100%',
                  maxWidth: '240px',
                  height: '200px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  overflow: 'hidden'
                }}>
                  {packagePhotoPreview ? (
                    <img src={packagePhotoPreview} alt="Package" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  )}
                </div>
                {isEditingDetail && (
                  <label 
                    style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', color: '#64748b', cursor: 'pointer', display: 'inline-block' }}
                  >
                    📷 Ganti Foto
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setPackagePhotoFile(file);
                          setPackagePhotoPreview(URL.createObjectURL(file));
                        }
                      }} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                )}
              </div>

              {/* Form Grid Area */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
                {/* General Info Column */}
                <div>
                  {isEditingDetail ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label className="form-group-label">Nama Paket Produk</label>
                        <input type="text" className="pi-input-text w-full" value={namaPaket} onChange={(e) => setNamaPaket(e.target.value)} />
                      </div>
                      
                      <div>
                        <label className="form-group-label">SKU</label>
                        <input type="text" className="pi-input-text w-full" value={sku} onChange={(e) => setSku(e.target.value)} />
                      </div>

                      <div>
                        <label className="form-group-label">Deskripsi</label>
                        <textarea className="pi-input-text w-full" style={{ height: '60px', resize: 'vertical' }} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label className="form-group-label">Harga Beli</label>
                          <input type="text" className="pi-input-text w-full" value={hargaBeli} onChange={(e) => handleCurrencyInputChange(e.target.value, setHargaBeli)} />
                        </div>
                        <div>
                          <label className="form-group-label">Harga Pasar</label>
                          <input type="text" className="pi-input-text w-full" value={hargaPasar} onChange={(e) => handleCurrencyInputChange(e.target.value, setHargaPasar)} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label className="form-group-label">Harga Jual Online</label>
                          <input type="text" className="pi-input-text w-full" value={hargaJualOnline} onChange={(e) => handleCurrencyInputChange(e.target.value, setHargaJualOnline)} />
                        </div>
                        <div>
                          <label className="form-group-label">Harga Jual di Toko</label>
                          <input type="text" className="pi-input-text w-full" value={hargaJualToko} onChange={(e) => handleCurrencyInputChange(e.target.value, setHargaJualToko)} />
                        </div>
                      </div>

                      <div className="detail-row-item">
                        <span className="detail-row-label">Harga jual di toko bersifat dinamis</span>
                        <label className="pi-simple-switch">
                          <input type="checkbox" checked={hargaDinamis} onChange={(e) => setHargaDinamis(e.target.checked)} />
                          <span className="pi-simple-slider"></span>
                        </label>
                      </div>

                      <div className="detail-row-item">
                        <span className="detail-row-label">Telah Dipublikasikan</span>
                        <label className="pi-simple-switch">
                          <input type="checkbox" checked={siapPublikasi} onChange={(e) => setSiapPublikasi(e.target.checked)} />
                          <span className="pi-simple-slider"></span>
                        </label>
                      </div>

                      <div>
                        <label className="form-group-label">Tanggal Publikasi</label>
                        <div style={{ position: 'relative' }}>
                          <Calendar size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                          <input type="date" className="pi-input-text" style={{ paddingLeft: '32px', width: '100%', boxSizing: 'border-box' }} value={tanggalMulaiJual} onChange={(e) => setTanggalMulaiJual(e.target.value)} />
                        </div>
                      </div>

                      <div>
                        <label className="form-group-label">Komisi</label>
                        <input type="text" className="pi-input-text w-full" value={komisi} onChange={(e) => handleCurrencyInputChange(e.target.value, setKomisi)} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label className="form-group-label">Minimal Pesanan</label>
                          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', width: 'fit-content' }}>
                            <button type="button" onClick={() => setMinimalPesanan(Math.max(1, minimalPesanan - 1))} style={{ width: '32px', height: '32px', border: 0, background: '#f1f5f9', cursor: 'pointer', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>-</button>
                            <span style={{ width: '48px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>{minimalPesanan}</span>
                            <button type="button" onClick={() => setMinimalPesanan(minimalPesanan + 1)} style={{ width: '32px', height: '32px', border: 0, background: '#f1f5f9', cursor: 'pointer', borderLeft: '1px solid #cbd5e1', fontWeight: 'bold' }}>+</button>
                          </div>
                        </div>
                        <div>
                          <label className="form-group-label">Maksimal Pesanan</label>
                          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', width: 'fit-content' }}>
                            <button type="button" onClick={() => setMaksimalPesanan(Math.max(0, maksimalPesanan - 1))} style={{ width: '32px', height: '32px', border: 0, background: '#f1f5f9', cursor: 'pointer', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>-</button>
                            <span style={{ width: '48px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>{maksimalPesanan}</span>
                            <button type="button" onClick={() => setMaksimalPesanan(maksimalPesanan + 1)} style={{ width: '32px', height: '32px', border: 0, background: '#f1f5f9', cursor: 'pointer', borderLeft: '1px solid #cbd5e1', fontWeight: 'bold' }}>+</button>
                          </div>
                        </div>
                      </div>

                      <div className="detail-row-item">
                        <span className="detail-row-label">Butuh Pengiriman</span>
                        <label className="pi-simple-switch">
                          <input type="checkbox" checked={butuhPengiriman} onChange={(e) => setButuhPengiriman(e.target.checked)} />
                          <span className="pi-simple-slider"></span>
                        </label>
                      </div>

                      <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                        <div className="detail-row-item" style={{ borderBottom: 0, paddingBottom: 0 }}>
                          <span className="detail-row-label">Tidak dikenakan pajak</span>
                          <label className="pi-simple-switch">
                            <input type="checkbox" checked={bebasPajak} onChange={(e) => setBebasPajak(e.target.checked)} />
                            <span className="pi-simple-slider"></span>
                          </label>
                        </div>
                        <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '2px' }}>{bebasPajak ? 'Ya' : 'Tidak'}</span>
                      </div>

                      <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                        <div className="detail-row-item" style={{ borderBottom: 0, paddingBottom: 0 }}>
                          <span className="detail-row-label">Produk tidak dikenakan biaya layanan</span>
                          <label className="pi-simple-switch">
                            <input type="checkbox" checked={bebasBiayaLayanan} onChange={(e) => setBebasBiayaLayanan(e.target.checked)} />
                            <span className="pi-simple-slider"></span>
                          </label>
                        </div>
                        <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '2px' }}>{bebasBiayaLayanan ? 'Ya' : 'Tidak'}</span>
                      </div>

                      <div className="detail-row-item">
                        <span className="detail-row-label">Dijual di POS (Aplikasi Kasir)</span>
                        <label className="pi-simple-switch">
                          <input type="checkbox" checked={tampilPos} onChange={(e) => setTampilPos(e.target.checked)} />
                          <span className="pi-simple-slider"></span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    // VIEW MODE - General Info
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div className="detail-row-item">
                        <span className="detail-row-label">Nama Paket Produk</span>
                        <span className="detail-row-value">{viewingPackage.nama}</span>
                      </div>
                      <div className="detail-row-item">
                        <span className="detail-row-label">SKU</span>
                        <span className="detail-row-value">{viewingPackage.sku || '-'}</span>
                      </div>
                      <div className="detail-row-item">
                        <span className="detail-row-label">Deskripsi</span>
                        <span className="detail-row-value">{viewingPackage.deskripsi || '-'}</span>
                      </div>
                      <div className="detail-row-item">
                        <span className="detail-row-label">Harga Beli</span>
                        <span className="detail-row-value">{formatToRupiahInput(viewingPackage.harga_beli)}</span>
                      </div>
                      <div className="detail-row-item">
                        <span className="detail-row-label">Harga Pasar</span>
                        <span className="detail-row-value">{formatToRupiahInput(viewingPackage.harga_pasar)}</span>
                      </div>
                      <div className="detail-row-item">
                        <span className="detail-row-label">Harga Jual Online</span>
                        <span className="detail-row-value">{formatToRupiahInput(viewingPackage.harga_jual_online)}</span>
                      </div>
                      <div className="detail-row-item">
                        <span className="detail-row-label">Harga Jual di Toko</span>
                        <span className="detail-row-value">{formatToRupiahInput(viewingPackage.harga_jual_offline)}</span>
                      </div>
                      <div className="detail-row-item">
                        <span className="detail-row-label">Harga jual di toko bersifat dinamis</span>
                        <span className="detail-row-value">{viewingPackage.harga_dinamis ? 'Ya' : 'Tidak'}</span>
                      </div>
                      <div className="detail-row-item">
                        <span className="detail-row-label">Telah Dipublikasikan</span>
                        <span className="detail-row-value">{viewingPackage.publikasi ? 'Ya' : 'Tidak'}</span>
                      </div>
                      <div className="detail-row-item">
                        <span className="detail-row-label">Tanggal Publikasi</span>
                        <span className="detail-row-value">{viewingPackage.periode_mulai ? viewingPackage.periode_mulai.substring(0, 10) : '-'}</span>
                      </div>
                      <div className="detail-row-item">
                        <span className="detail-row-label">Komisi</span>
                        <span className="detail-row-value">{formatToRupiahInput(viewingPackage.komisi)}</span>
                      </div>
                      <div className="detail-row-item">
                        <span className="detail-row-label">Minimal Pesanan</span>
                        <span className="detail-row-value">{viewingPackage.minimal_pesanan || 1}</span>
                      </div>
                      <div className="detail-row-item">
                        <span className="detail-row-label">Maksimal Pesanan</span>
                        <span className="detail-row-value">{viewingPackage.maksimal_pesanan || 'Tidak dibatasi'}</span>
                      </div>
                      <div className="detail-row-item">
                        <span className="detail-row-label">Butuh Pengiriman</span>
                        <span className="detail-row-value">{viewingPackage.butuh_pengiriman ? 'Ya' : 'Tidak'}</span>
                      </div>
                      <div className="detail-row-item">
                        <span className="detail-row-label">Tidak dikenakan pajak</span>
                        <span className="detail-row-value">{viewingPackage.bebas_pajak ? 'Ya' : 'Tidak'}</span>
                      </div>
                      <div className="detail-row-item">
                        <span className="detail-row-label">Produk tidak dikenakan biaya layanan</span>
                        <span className="detail-row-value">{viewingPackage.bebas_biaya_layanan ? 'Ya' : 'Tidak'}</span>
                      </div>
                      <div className="detail-row-item">
                        <span className="detail-row-label">Dijual di POS (Aplikasi Kasir)</span>
                        <span className="detail-row-value">{viewingPackage.tampil_pos ? 'Ya' : 'Tidak'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Info Column */}
                <div>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 'bold', color: '#1e293b', borderBottom: '2px solid #0284c7', paddingBottom: '6px' }}>
                    Informasi Tambahan
                  </h4>

                  {isEditingDetail ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="detail-row-item">
                        <span className="detail-row-label">Habis Stok</span>
                        <label className="pi-simple-switch">
                          <input type="checkbox" checked={habisStok} onChange={(e) => setHabisStok(e.target.checked)} />
                          <span className="pi-simple-slider"></span>
                        </label>
                      </div>

                      <div>
                        <label className="form-group-label">Loyalty Point</label>
                        <input type="number" className="pi-input-text w-full" value={loyaltyPoints} onChange={(e) => setLoyaltyPoints(parseInt(e.target.value) || 0)} />
                      </div>

                      <div>
                        <label className="form-group-label">SEO (Search Engine Optimization) - Meta Keywords</label>
                        <input type="text" className="pi-input-text w-full" placeholder="Please input" value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} />
                      </div>

                      <div>
                        <label className="form-group-label">SEO (Search Engine Optimization) - Meta Description</label>
                        <textarea className="pi-input-text w-full" style={{ height: '80px', resize: 'vertical' }} placeholder="Please input" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
                      </div>
                    </div>
                  ) : (
                    // VIEW MODE - Additional Info
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div className="detail-row-item">
                        <span className="detail-row-label">Habis Stok</span>
                        <span className="detail-row-value">{viewingPackage.habis_stok ? 'Ya' : 'Tidak'}</span>
                      </div>
                      <div className="detail-row-item">
                        <span className="detail-row-label">Loyalty Point</span>
                        <span className="detail-row-value">{viewingPackage.loyalty_points || '0.00'}</span>
                      </div>
                      <div className="detail-row-item">
                        <span className="detail-row-label">SEO Meta Keywords</span>
                        <span className="detail-row-value">{viewingPackage.seo_keywords || '-'}</span>
                      </div>
                      <div className="detail-row-item">
                        <span className="detail-row-label">SEO Meta Description</span>
                        <span className="detail-row-value">{viewingPackage.seo_description || '-'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Delete Button */}
              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-start', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={handleDeletePackage}
                  style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <Trash2 size={16} /> Hapus
                </button>
              </div>
            </div>
          </div>

          {/* KANAN: Produk dalam Paket */}
          <div className="pi-category-card">
            <div className="pi-category-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>Produk dalam Paket</h3>
              <button 
                type="button" 
                className="btn-ubah"
                onClick={() => setShowManageItemsModal(true)}
              >
                Ubah
              </button>
            </div>

            <div className="pi-category-card-body" style={{ padding: '20px' }}>
              {/* Add Product text link button like in screenshot */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <button 
                  type="button"
                  onClick={() => setShowManageItemsModal(true)}
                  style={{ background: 'none', border: 0, color: '#0284c7', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  + Tambah Produk
                </button>
              </div>

              <div>
                {selectedItems.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center' }}>Tidak ada produk di dalam paket ini</p>
                ) : (
                  selectedItems.map((item, idx) => {
                    const id = item.product || item.product_id;
                    return (
                      <div key={id || idx} className="pkg-item-card">
                        <div className="pkg-item-info">
                          {/* Drag handle cross design from screenshot */}
                          <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', cursor: 'grab', fontSize: '18px', userSelect: 'none', marginRight: '4px' }}>
                            ✛
                          </div>
                          {item.product_foto ? (
                            <img src={item.product_foto} alt="thumb" className="pkg-item-thumb" />
                          ) : (
                            <div className="pkg-item-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', background: '#f1f5f9' }}>P</div>
                          )}
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{item.product_nama}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{item.product_varian_nama || 'Varian Default'}</div>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', marginTop: '2px' }}>{item.qty}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MODAL: KELOLA PRODUK DALAM PAKET */}
        {showManageItemsModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#ffffff', borderRadius: '12px', width: '90%', maxWidth: '640px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Kelola</h3>
                <button
                  type="button"
                  onClick={() => setShowManageItemsModal(false)}
                  style={{ background: 'none', border: 0, cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Autocomplete Product Add Box inside Modal */}
              <div style={{ marginBottom: '16px', position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  placeholder="Cari & Tambah Produk baru..."
                  value={productSearchQuery}
                  onChange={(e) => { setProductSearchQuery(e.target.value); setShowProductDropdown(true); }}
                  onFocus={() => setShowProductDropdown(true)}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 10px 8px 30px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />

                {showProductDropdown && productSearchQuery && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    zIndex: 1100,
                    maxHeight: '160px',
                    overflowY: 'auto',
                    marginTop: '4px'
                  }}>
                    {filteredDropdownProducts.length === 0 ? (
                      <div style={{ padding: '10px', fontSize: '12px', color: '#64748b' }}>Tidak ditemukan produk</div>
                    ) : (
                      filteredDropdownProducts.map(prod => (
                        <div 
                          key={prod.id} 
                          onClick={() => handleAddItem(prod)}
                          style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f1f5f9', background: '#fff' }}
                          onMouseEnter={(e) => e.target.style.background = '#f0f9ff'}
                          onMouseLeave={(e) => e.target.style.background = '#fff'}
                        >
                          <div style={{ fontWeight: '600', color: '#0f172a' }}>{prod.nama}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>SKU: {prod.sku || '-'}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Items List inside Modal */}
              <div style={{ maxHeight: '320px', overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {selectedItems.map((item, idx) => {
                  const id = item.product || item.product_id;
                  const originalProd = availableProducts.find(p => p.id === id);
                  const hasVariants = originalProd && originalProd.variants && originalProd.variants.length > 0;

                  return (
                    <div key={id || idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                      {/* Delete circle button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(id)}
                        style={{
                          background: '#f87171',
                          color: '#ffffff',
                          border: 0,
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          flexShrink: 0
                        }}
                      >
                        ×
                      </button>

                      {/* Image Thumbnail */}
                      {item.product_foto ? (
                        <img src={item.product_foto} alt="thumb" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', flexShrink: 0 }}>No Img</div>
                      )}

                      {/* Name, Variant Dropdown and Qty */}
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{item.product_nama}</div>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '6px', alignItems: 'center' }}>
                          {hasVariants ? (
                            <>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Variant</span>
                                <select
                                  value={item.product_varian_nama || originalProd.variants[0]?.nama_varian}
                                  onChange={(e) => handleUpdateItemVariant(id, e.target.value)}
                                  style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', background: '#fff', minWidth: '120px' }}
                                >
                                  {originalProd.variants.map(v => (
                                    <option key={v.id} value={v.nama_varian}>{v.nama_varian}</option>
                                  ))}
                                </select>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Qty</span>
                                <input
                                  type="number"
                                  value={item.qty}
                                  onChange={(e) => handleUpdateItemQty(id, parseInt(e.target.value) || 1)}
                                  style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', width: '60px', boxSizing: 'border-box' }}
                                />
                              </div>
                            </>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Qty</span>
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) => handleUpdateItemQty(id, parseInt(e.target.value) || 1)}
                                style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', width: '80px', boxSizing: 'border-box' }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions inside Modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Simpan di:</span>
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 10px', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>{businessSettings?.nama_bisnis || 'Bayu mart'}</span>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>×</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleUpdateDetail}
                  style={{ background: '#22c55e', color: '#ffffff', border: 0, borderRadius: '6px', padding: '8px 24px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER CREATE VIEW
  // ----------------------------------------------------
  if (isCreating) {
    return (
      <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
        <style>{`
          .pi-package-create-grid {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 20px;
          }
          @media (max-width: 1024px) {
            .pi-package-create-grid {
              grid-template-columns: 1fr;
            }
          }
          .pkg-item-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 14px;
            background: #fff;
            margin-bottom: 10px;
          }
          .pkg-item-info {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .pkg-item-thumb {
            width: 40px;
            height: 40px;
            border-radius: 4px;
            object-fit: cover;
            background: #f1f5f9;
          }
        `}</style>

        {/* Header Actions Card */}
        <div className="pi-category-card" style={{ marginBottom: '24px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>Tambah Paket Produk</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Simpan di:</span>
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 10px', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>
                  {businessSettings?.nama_bisnis || 'Bintang Advertising'}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>×</span>
              </div>
            </div>
            <button 
              type="button" 
              className="pi-btn" 
              onClick={() => handleSetIsCreating(false)} 
              style={{ background: 'transparent', border: '1px solid #cbd5e1', color: '#64748b', borderRadius: '4px', padding: '6px 16px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Batal
            </button>
            <button
              type="button"
              className="pi-btn"
              disabled={!canSave}
              onClick={handleSave}
              style={{ background: canSave ? '#16a34a' : '#e2e8f0', color: canSave ? '#fff' : '#94a3b8', border: 0, borderRadius: '4px', padding: '6px 16px', fontSize: '12px', fontWeight: 'bold', cursor: canSave ? 'pointer' : 'not-allowed' }}
            >
              {saving ? 'Menyimpan...' : '✓ Simpan'}
            </button>
          </div>
        </div>

        {/* Two-Column Grid */}
        <div className="pi-package-create-grid">
          {/* KIRI: Informasi Paket */}
          <div className="pi-category-card">
            <div className="pi-category-card-body" style={{ padding: '24px' }}>
              <div className="pi-green-section-title">Informasi Paket</div>
              {/* Photo Upload Block */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                <div style={{
                  width: '100%',
                  maxWidth: '240px',
                  height: '200px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  overflow: 'hidden'
                }}>
                  {packagePhotoPreview ? (
                    <img src={packagePhotoPreview} alt="Package Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  )}
                </div>
                <label 
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', color: '#64748b', cursor: 'pointer', display: 'inline-block' }}
                >
                  📷 Upload Foto
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setPackagePhotoFile(file);
                        setPackagePhotoPreview(URL.createObjectURL(file));
                      }
                    }} 
                    style={{ display: 'none' }} 
                  />
                </label>
              </div>
              <div className="pi-form-rows" style={{ gap: '24px' }}>
                {/* Nama Paket Produk */}
                <div className="pi-create-row" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                  <div className="pi-row-label-desc">
                    <span className="pi-row-label">Nama Paket Produk <span style={{ color: '#ef4444' }}>*</span></span>
                  </div>
                  <div className="pi-row-input">
                    <input 
                      type="text" 
                      className="pi-input-text w-full" 
                      placeholder="Masukkan nama paket" 
                      value={namaPaket} 
                      onChange={(e) => setNamaPaket(e.target.value)} 
                    />
                  </div>
                </div>

                {/* SKU / Barcode */}
                <div className="pi-create-row" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                  <div className="pi-row-label-desc">
                    <span className="pi-row-label">SKU / Barcode</span>
                    <span className="pi-row-desc">SKU (Stock Keeping Unit) atau Barcode dapat dipergunakan untuk pencarian produk</span>
                  </div>
                  <div className="pi-row-input">
                    <input 
                      type="text" 
                      className="pi-input-text w-full" 
                      placeholder="Masukkan SKU / Barcode" 
                      value={sku} 
                      onChange={(e) => setSku(e.target.value)} 
                    />
                  </div>
                </div>

                {/* Deskripsi Paket */}
                <div className="pi-create-row" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                  <div className="pi-row-label-desc">
                    <span className="pi-row-label">Deskripsi Paket</span>
                    <span className="pi-row-desc">Penjelasan tentang paket produk ini</span>
                  </div>
                  <div className="pi-row-input">
                    <input 
                      type="text" 
                      className="pi-input-text w-full" 
                      placeholder="Penjelasan tentang paket produk ini" 
                      value={deskripsi} 
                      onChange={(e) => setDeskripsi(e.target.value)} 
                    />
                  </div>
                </div>

                {/* Harga Beli */}
                <div className="pi-create-row" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                  <div className="pi-row-label-desc">
                    <span className="pi-row-label">Harga Beli</span>
                    <span className="pi-row-desc">Biaya untuk membeli produk (modal)</span>
                  </div>
                  <div className="pi-row-input">
                    <input 
                      type="text" 
                      className="pi-input-text w-full" 
                      value={hargaBeli} 
                      onChange={(e) => handleCurrencyInputChange(e.target.value, setHargaBeli)} 
                    />
                  </div>
                </div>

                {/* Harga Jual Online */}
                <div className="pi-create-row" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                  <div className="pi-row-label-desc">
                    <span className="pi-row-label">Harga Jual Online <span style={{ color: '#ef4444' }}>*</span></span>
                  </div>
                  <div className="pi-row-input">
                    <input 
                      type="text" 
                      className="pi-input-text w-full" 
                      value={hargaJualOnline} 
                      onChange={(e) => handleCurrencyInputChange(e.target.value, setHargaJualOnline)} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KANAN: Produk dalam Paket */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Card Produk dalam Paket */}
            <div className="pi-category-card">
              <div className="pi-category-card-body" style={{ padding: '24px' }}>
                <div className="pi-green-section-title" style={{ marginBottom: '16px' }}>Produk dalam Paket</div>
                
                {/* Product Search Field */}
                <div style={{ marginBottom: '16px', position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    placeholder="Cari produk & tambahkan..."
                    value={productSearchQuery}
                    onChange={(e) => { setProductSearchQuery(e.target.value); setShowProductDropdown(true); }}
                    onFocus={() => setShowProductDropdown(true)}
                    style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 10px 8px 30px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />

                  {showProductDropdown && productSearchQuery && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      zIndex: 100,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      marginTop: '4px'
                    }}>
                      {filteredDropdownProducts.length === 0 ? (
                        <div style={{ padding: '10px', fontSize: '12px', color: '#64748b' }}>Tidak ditemukan produk</div>
                      ) : (
                        filteredDropdownProducts.map(prod => (
                          <div 
                            key={prod.id} 
                            onClick={() => handleAddItem(prod)}
                            style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f1f5f9', background: '#fff' }}
                            onMouseEnter={(e) => e.target.style.background = '#f0f9ff'}
                            onMouseLeave={(e) => e.target.style.background = '#fff'}
                          >
                            <div style={{ fontWeight: '600', color: '#0f172a' }}>{prod.nama}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>SKU: {prod.sku || '-'}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Products List */}
                <div style={{ marginTop: '16px' }}>
                  {selectedItems.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>Belum ada produk terpilih</p>
                  ) : (
                    selectedItems.map(item => {
                      const id = item.product || item.product_id;
                      return (
                        <div key={id} className="pkg-item-card">
                          <div className="pkg-item-info">
                            <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                              <GripVertical size={16} />
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{item.product_nama}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>SKU: {item.product_sku || '-'}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button 
                              type="button" 
                              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => handleUpdateItemQty(id, item.qty - 1)}
                            >
                              -
                            </button>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{item.qty}</span>
                            <button 
                              type="button" 
                              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => handleUpdateItemQty(id, item.qty + 1)}
                            >
                              +
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveItem(id)}
                              style={{ background: 'none', border: 0, color: '#ef4444', marginLeft: '4px', cursor: 'pointer' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER LIST VIEW
  // ----------------------------------------------------
  return (
    <div style={{ padding: '24px', background: '#ffffff' }}>
      <style>{`
        .package-name-link {
          transition: color 0.15s;
        }
        .package-name-link:hover {
          color: #025887 !important;
          text-decoration: underline;
        }
      `}</style>

      {/* Sub Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>Daftar Paket Produk</h2>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>{packages.length} Paket Produk</span>
          {error && <p style={{ color: '#dc2626', fontSize: 12, margin: '4px 0 0' }}>{error}</p>}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="pi-btn" style={{ background: '#0284c7', color: '#ffffff', border: 0, borderRadius: '4px', padding: '8px 14px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <Copy size={14} /> Salin Paket Produk
          </button>
          <button
            type="button"
            onClick={() => { setImportResult(null); setImportFile(null); setShowImportModal(true); }}
            className="pi-btn"
            style={{ background: '#0284c7', color: '#ffffff', border: 0, borderRadius: '4px', padding: '8px 14px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <Download size={14} /> Import
          </button>
          <button 
            type="button"
            className="pi-btn" 
            onClick={() => handleSetIsCreating(true)}
            style={{ background: '#0284c7', color: '#ffffff', border: 0, borderRadius: '4px', padding: '8px 14px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <Plus size={14} /> Tambah
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9', marginBottom: '12px' }}>
        <div>
          <select 
            value={rowsPerPage} 
            onChange={(e) => setRowsPerPage(e.target.value)}
            style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', color: '#64748b', outline: 'none', background: '#ffffff', minWidth: '100px' }}
          >
            <option value="10">10 Baris</option>
            <option value="25">25 Baris</option>
            <option value="50">50 Baris</option>
          </select>
        </div>
        <div style={{ position: 'relative', width: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Cari" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 10px 6px 30px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Table with sorting labels */}
      <DataTable
        rows={sortedPackages}
        emptyText={loading ? 'Memuat...' : 'Tidak ada data'}
        columns={[
          { 
            key: 'nama', 
            label: renderHeaderLabel('nama', 'Nama Produk'),
            render: (row) => (
              <span 
                className="package-name-link"
                onClick={() => handleViewDetail(row)}
                style={{ color: '#0284c7', fontWeight: '700', cursor: 'pointer' }}
              >
                {row.nama}
              </span>
            )
          },
          { 
            key: 'qty', 
            label: renderHeaderLabel('qty', 'Qty'), 
            render: (row) => row.items?.length || 0 
          },
          { 
            key: 'harga_jual_online', 
            label: renderHeaderLabel('harga_jual_online', 'Harga Jual Online'), 
            render: (row) => formatCurrency(row.harga_jual_online) 
          },
          { 
            key: 'harga_jual_offline', 
            label: renderHeaderLabel('harga_jual_offline', 'Harga Jual Offline'), 
            render: (row) => formatCurrency(row.harga_jual_offline) 
          },
          { 
            key: 'publikasi', 
            label: renderHeaderLabel('publikasi', 'Publikasi'), 
            render: (row) => row.publikasi ? (
              <StatusBadge active={true} label={formatDateLabel(row.periode_mulai || new Date())} />
            ) : (
              <StatusBadge active={false} label="Draft" />
            )
          },
        ]}
      />

      {/* Pagination Footer */}
      <div className="pi-pagination-bar" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}></div>
        <div className="pi-pagination-controls">
          <span className="pi-pagination-info">Total {filteredPackages.length}</span>
          <button className="pi-pagination-nav-btn" disabled>&lt;</button>
          <span className="pi-pagination-active-page">1</span>
          <button className="pi-pagination-nav-btn" disabled>&gt;</button>
          <span className="pi-pagination-goto">
            Go to <input type="number" defaultValue={1} className="pi-pagination-input" min={1} />
          </span>
        </div>
      </div>

      {/* MODAL: Import Paket Produk via CSV */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', width: '90%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Import Paket Produk (CSV)</h3>
              <button
                onClick={() => setShowImportModal(false)}
                style={{ background: '#f1f5f9', border: 0, padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}
              >
                Tutup
              </button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                Kolom CSV: <strong>product_combo_name, product_name, product_variant_name, sku, description, purchase_price, market_price, online_selling_price, store_selling_price, commission, minimum_order, maximum_order, selling_prices_stores_are_dynamic, ready_publish_sale, sale_start_date, loyalty_points, uom</strong>.
                Baris dengan <strong>product_combo_name</strong> sama akan digabung jadi 1 paket berisi banyak produk. Produk dicocokkan berdasarkan SKU, lalu nama produk bila SKU kosong.
              </p>
              <a
                href="/templates/paket-produk-template.csv"
                download
                style={{ fontSize: '12px', color: '#0284c7', fontWeight: 'bold', textDecoration: 'underline', width: 'fit-content' }}
              >
                Download Template CSV
              </a>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setImportFile(e.target.files[0] || null)}
                style={{ fontSize: '13px' }}
              />
              {importResult && (
                <div style={{ fontSize: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px' }}>
                  <div style={{ color: '#16a34a', fontWeight: 'bold', marginBottom: importResult.errors.length ? 6 : 0 }}>
                    {importResult.createdCount} paket berhasil dibuat.
                  </div>
                  {importResult.errors.length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: 18, color: '#dc2626' }}>
                      {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button
                onClick={() => setShowImportModal(false)}
                style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569', cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                onClick={handleImportCsv}
                disabled={!importFile || importing}
                style={{
                  background: (!importFile || importing) ? '#93c5fd' : '#0284c7',
                  border: 0,
                  borderRadius: '4px',
                  padding: '8px 24px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  cursor: (!importFile || importing) ? 'not-allowed' : 'pointer',
                }}
              >
                {importing ? 'Memproses...' : 'Post Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
