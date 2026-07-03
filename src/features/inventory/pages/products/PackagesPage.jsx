import { useEffect, useState } from 'react';
import { Plus, Search, Copy, Download, ChevronRight, Calendar } from 'lucide-react';
import DataTable from '../components/DataTable';
import { StatusBadge } from '../components/PageShell';
import { formatCurrency } from '../productInventoryData';
import { useAuth } from '../../../../context/AuthContext';
import apiClient from '../../../../api/apiClient';

const parseRupiah = (raw) => {
  const cleaned = String(raw ?? '').replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
  const value = parseFloat(cleaned);
  return Number.isNaN(value) ? 0 : value;
};

export function PackagesPage({ onToggleCreate }) {
  const { businessSettings } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState('10');

  // Form states
  const [namaPaket, setNamaPaket] = useState('');
  const [sku, setSku] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [hargaBeli, setHargaBeli] = useState('0,00');
  const [hargaPasar, setHargaPasar] = useState('0,00');
  const [hargaJualOnline, setHargaJualOnline] = useState('0,00');
  const [hargaJualToko, setHargaJualToko] = useState('0,00');
  const [komisi, setKomisi] = useState('0,00');
  const [minimalPesanan, setMinimalPesanan] = useState(0);
  const [maksimalPesanan, setMaksimalPesanan] = useState(0);
  const [hargaDinamis, setHargaDinamis] = useState(false);
  const [siapPublikasi, setSiapPublikasi] = useState(false);
  const [tanggalMulaiJual, setTanggalMulaiJual] = useState('');
  const [searchProduct, setSearchProduct] = useState('');

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

  useEffect(() => {
    fetchPackages();
  }, []);

  const resetForm = () => {
    setNamaPaket('');
    setSku('');
    setDeskripsi('');
    setHargaBeli('0,00');
    setHargaPasar('0,00');
    setHargaJualOnline('0,00');
    setHargaJualToko('0,00');
    setKomisi('0,00');
    setMinimalPesanan(0);
    setMaksimalPesanan(0);
    setHargaDinamis(false);
    setSiapPublikasi(false);
    setTanggalMulaiJual('');
    setSearchProduct('');
  };

  const handleSetIsCreating = (val) => {
    setIsCreating(val);
    if (onToggleCreate) {
      onToggleCreate(val);
    }
  };

  const canSave = namaPaket.trim() && parseRupiah(hargaJualOnline) > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await apiClient.post('/product-packages/', {
        nama: namaPaket,
        deskripsi: deskripsi || null,
        harga_beli: parseRupiah(hargaBeli),
        harga_pasar: parseRupiah(hargaPasar),
        harga_jual_offline: parseRupiah(hargaJualToko),
        harga_jual_online: parseRupiah(hargaJualOnline),
        komisi: parseRupiah(komisi),
        minimal_pesanan: minimalPesanan,
        maksimal_pesanan: maksimalPesanan,
        harga_dinamis: hargaDinamis,
        publikasi: siapPublikasi,
        periode_mulai: tanggalMulaiJual || null,
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

  const filteredPackages = packages.filter(pkg =>
    pkg.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isCreating) {
    return (
      <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
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
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Rp.</span>
                      <input 
                        type="text" 
                        className="pi-input-text w-full" 
                        style={{ paddingLeft: '40px' }} 
                        value={hargaBeli} 
                        onChange={(e) => setHargaBeli(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Harga Pasar */}
                <div className="pi-create-row" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                  <div className="pi-row-label-desc">
                    <span className="pi-row-label">Harga Pasar</span>
                    <span className="pi-row-desc">Sediakan harga pembanding supaya pembeli tahu berapa banyak yang telah mereka hemat</span>
                  </div>
                  <div className="pi-row-input">
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Rp.</span>
                      <input 
                        type="text" 
                        className="pi-input-text w-full" 
                        style={{ paddingLeft: '40px' }} 
                        value={hargaPasar} 
                        onChange={(e) => setHargaPasar(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Harga Jual Online */}
                <div className="pi-create-row" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                  <div className="pi-row-label-desc">
                    <span className="pi-row-label">Harga Jual Online <span style={{ color: '#ef4444' }}>*</span></span>
                  </div>
                  <div className="pi-row-input">
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Rp.</span>
                      <input 
                        type="text" 
                        className="pi-input-text w-full" 
                        style={{ paddingLeft: '40px' }} 
                        value={hargaJualOnline} 
                        onChange={(e) => setHargaJualOnline(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Harga Jual di Toko */}
                <div className="pi-create-row" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                  <div className="pi-row-label-desc">
                    <span className="pi-row-label">Harga Jual di Toko</span>
                    <span className="pi-row-desc">Isi 0 apabila sama dengan harga jual online</span>
                  </div>
                  <div className="pi-row-input">
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Rp.</span>
                      <input 
                        type="text" 
                        className="pi-input-text w-full" 
                        style={{ paddingLeft: '40px' }} 
                        value={hargaJualToko} 
                        onChange={(e) => setHargaJualToko(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Komisi */}
                <div className="pi-create-row" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                  <div className="pi-row-label-desc">
                    <span className="pi-row-label">Komisi</span>
                    <span className="pi-row-desc">Komisi untuk karyawan (Pelayan/Kasir) dari penjualan produk</span>
                  </div>
                  <div className="pi-row-input">
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Rp.</span>
                      <input 
                        type="text" 
                        className="pi-input-text w-full" 
                        style={{ paddingLeft: '40px' }} 
                        value={komisi} 
                        onChange={(e) => setKomisi(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Minimal Pesanan */}
                <div className="pi-create-row" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                  <div className="pi-row-label-desc">
                    <span className="pi-row-label">Minimal Pesanan</span>
                    <span className="pi-row-desc">Minimal jumlah qty pembelian</span>
                  </div>
                  <div className="pi-row-input">
                    <div className="pi-qty-counter">
                      <button type="button" className="pi-qty-btn" onClick={() => setMinimalPesanan(Math.max(0, minimalPesanan - 1))}>-</button>
                      <input 
                        type="text" 
                        className="pi-qty-input" 
                        value={minimalPesanan} 
                        onChange={(e) => setMinimalPesanan(parseInt(e.target.value) || 0)} 
                      />
                      <button type="button" className="pi-qty-btn" onClick={() => setMinimalPesanan(minimalPesanan + 1)}>+</button>
                    </div>
                  </div>
                </div>

                {/* Maksimal Pesanan */}
                <div className="pi-create-row" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                  <div className="pi-row-label-desc">
                    <span className="pi-row-label">Maksimal Pesanan</span>
                    <span className="pi-row-desc">Maksimal jumlah qty pembelian</span>
                  </div>
                  <div className="pi-row-input">
                    <div className="pi-qty-counter">
                      <button type="button" className="pi-qty-btn" onClick={() => setMaksimalPesanan(Math.max(0, maksimalPesanan - 1))}>-</button>
                      <input 
                        type="text" 
                        className="pi-qty-input" 
                        value={maksimalPesanan} 
                        onChange={(e) => setMaksimalPesanan(parseInt(e.target.value) || 0)} 
                      />
                      <button type="button" className="pi-qty-btn" onClick={() => setMaksimalPesanan(maksimalPesanan + 1)}>+</button>
                    </div>
                  </div>
                </div>

                {/* Harga Jual di Toko Dinamis */}
                <div className="pi-create-row" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                  <div className="pi-row-label-desc">
                    <span className="pi-row-label">Harga jual di toko bersifat dinamis</span>
                    <span className="pi-row-desc">Kasir bisa mengubah harga jual</span>
                  </div>
                  <div className="pi-row-input">
                    <label className="pi-simple-switch">
                      <input 
                        type="checkbox" 
                        checked={hargaDinamis} 
                        onChange={(e) => setHargaDinamis(e.target.checked)} 
                      />
                      <span className="pi-simple-slider"></span>
                    </label>
                  </div>
                </div>

                {/* Siap Publikasikan */}
                <div className="pi-create-row" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                  <div className="pi-row-label-desc">
                    <span className="pi-row-label">Siap publikasikan untuk dijual</span>
                    <span className="pi-row-desc">Ketika produk anda dipublikasikan untuk dijual, maka pembeli bisa membelinya lewat toko online atau POS (Point Of Sale), sesuai dengan tanggal mulai dijual/diaktifkan</span>
                  </div>
                  <div className="pi-row-input">
                    <label className="pi-simple-switch">
                      <input 
                        type="checkbox" 
                        checked={siapPublikasi} 
                        onChange={(e) => setSiapPublikasi(e.target.checked)} 
                      />
                      <span className="pi-simple-slider"></span>
                    </label>
                  </div>
                </div>

                {/* Tanggal Mulai Jual */}
                <div className="pi-create-row">
                  <div className="pi-row-label-desc">
                    <span className="pi-row-label">Tanggal mulai jual</span>
                  </div>
                  <div className="pi-row-input">
                    <div style={{ position: 'relative', maxWidth: '200px' }}>
                      <Calendar size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                      <input
                        type="date"
                        className="pi-input-text"
                        style={{ paddingLeft: '32px', width: '100%', boxSizing: 'border-box' }}
                        value={tanggalMulaiJual}
                        onChange={(e) => setTanggalMulaiJual(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KANAN: Produk dalam Paket & Info Tambahan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Card Produk dalam Paket */}
            <div className="pi-category-card">
              <div className="pi-category-card-body" style={{ padding: '24px' }}>
                <div className="pi-green-section-title">Produk dalam Paket</div>
                <div className="pi-create-row" style={{ flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
                  <div className="pi-row-label-desc" style={{ marginBottom: '8px' }}>
                    <span className="pi-row-label">Produk <span style={{ color: '#ef4444' }}>*</span></span>
                    <span className="pi-row-desc">Produk-produk mana saja yang tergabung dalam paket ini?</span>
                  </div>
                  <div className="pi-row-input" style={{ width: '100%' }}>
                    <input 
                      type="text" 
                      className="pi-input-text w-full" 
                      placeholder="Masukkan name produk (autocomplete)" 
                      value={searchProduct}
                      onChange={(e) => setSearchProduct(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card Informasi Tambahan */}
            <div className="pi-category-card">
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#ffffff' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Informasi Tambahan</span>
                <ChevronRight size={16} style={{ color: '#94a3b8' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#ffffff' }}>
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

      {/* Table */}
      <DataTable
        rows={filteredPackages}
        emptyText={loading ? 'Memuat...' : 'Tidak ada data'}
        columns={[
          { key: 'nama', label: 'Nama Produk' },
          { key: 'qty', label: 'Qty', render: (row) => row.items?.length || 0 },
          { key: 'harga_jual_online', label: 'Harga Jual Online', render: (row) => formatCurrency(row.harga_jual_online) },
          { key: 'harga_jual_offline', label: 'Harga Jual Offline', render: (row) => formatCurrency(row.harga_jual_offline) },
          { key: 'publikasi', label: 'Publikasi', render: (row) => <StatusBadge active={row.publikasi} label={row.publikasi ? 'Publish' : 'Draft'} /> },
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
