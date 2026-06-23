import { useState } from 'react';
import { Plus, Search, Copy, Download, ChevronRight, Calendar } from 'lucide-react';
import DataTable from '../components/DataTable';
import { Button, PageHeader, StatusBadge, Toolbar } from '../components/PageShell';
import { addons, brands, categories, formatCurrency, packages, specifications } from '../productInventoryData';
import { useAuth } from '../../../context/AuthContext';

export function CategoriesPage() {
  const [namaGrup, setNamaGrup] = useState('');
  const [klasifikasi, setKlasifikasi] = useState('');
  const [nonAktifkan, setNonAktifkan] = useState(false);
  const [tidakMunculPos, setTidakMunculPos] = useState(false);
  const [tidakMunculNavWeb, setTidakMunculNavWeb] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pi-category-layout">
      {/* KIRI: Tambah Group/Kategori */}
      <div className="pi-category-card">
        <div className="pi-category-card-header">
          <h3>Tambah Group/Kategori</h3>
          <button 
            type="button" 
            className="pi-btn" 
            disabled 
            style={{ 
              background: '#e2e8f0', 
              color: '#94a3b8', 
              border: '0', 
              cursor: 'not-allowed', 
              padding: '6px 16px', 
              borderRadius: '4px', 
              fontSize: '12px', 
              fontWeight: 'bold' 
            }}
          >
            Simpan
          </button>
        </div>
        <div className="pi-category-card-body">
          <div className="pi-form-rows" style={{ gap: '20px' }}>
            {/* Nama Grup */}
            <div className="pi-create-row" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
              <div className="pi-row-label-desc">
                <span className="pi-row-label">Nama Grup <span style={{ color: '#ef4444' }}>*</span></span>
                <span className="pi-row-desc">Grup/kategori produk Anda, untuk memudahkan pelanggan mencari produk anda</span>
              </div>
              <div className="pi-row-input">
                <input 
                  type="text" 
                  className="pi-input-text w-full" 
                  placeholder="Masukkan" 
                  value={namaGrup} 
                  onChange={(e) => setNamaGrup(e.target.value)} 
                />
              </div>
            </div>

            {/* Klasifikasi */}
            <div className="pi-create-row" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
              <div className="pi-row-label-desc">
                <span className="pi-row-label">Klasifikasi <span style={{ color: '#ef4444' }}>*</span></span>
                <span className="pi-row-desc">Memilih produk klasifikasi yang benar akan memudahkan pelanggan mencari produk anda di Marketplace olsera.com</span>
              </div>
              <div className="pi-row-input">
                <select 
                  className="pi-store-select" 
                  style={{ width: '100%' }}
                  value={klasifikasi}
                  onChange={(e) => setKlasifikasi(e.target.value)}
                >
                  <option value="">Pilih salah satu</option>
                  <option value="Jasa Cetak / Printing">Jasa Cetak / Printing</option>
                  <option value="Advertising & Banner">Advertising & Banner</option>
                  <option value="Merchandise / Souvenir">Merchandise / Souvenir</option>
                </select>
              </div>
            </div>

            {/* Product Group Photo */}
            <div className="pi-create-row" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
              <div className="pi-row-label-desc">
                <span className="pi-row-label">Product Group Photo <span style={{ color: '#ef4444' }}>*</span></span>
              </div>
              <div className="pi-row-input">
                <div className="pi-category-photo-upload">
                  <Plus size={24} />
                </div>
              </div>
            </div>

            {/* Non Aktifkan */}
            <div className="pi-create-row" style={{ paddingBottom: '12px' }}>
              <div className="pi-row-label-desc">
                <span className="pi-row-label">Non Aktifkan</span>
                <span className="pi-row-desc">Item yang dinon-aktifkan tidak akan muncul di website Anda</span>
              </div>
              <div className="pi-row-input">
                <label className="pi-simple-switch">
                  <input 
                    type="checkbox" 
                    checked={nonAktifkan} 
                    onChange={(e) => setNonAktifkan(e.target.checked)} 
                  />
                  <span className="pi-simple-slider"></span>
                </label>
              </div>
            </div>

            {/* Tidak muncul di Point Of Sale */}
            <div className="pi-create-row" style={{ paddingBottom: '12px' }}>
              <div className="pi-row-label-desc">
                <span className="pi-row-label">Tidak muncul di Point Of Sale</span>
              </div>
              <div className="pi-row-input">
                <label className="pi-simple-switch">
                  <input 
                    type="checkbox" 
                    checked={tidakMunculPos} 
                    onChange={(e) => setTidakMunculPos(e.target.checked)} 
                  />
                  <span className="pi-simple-slider"></span>
                </label>
              </div>
            </div>

            {/* Submenu tidak muncul di Menu/Navigasi website */}
            <div className="pi-create-row">
              <div className="pi-row-label-desc">
                <span className="pi-row-label">Submenu tidak muncul di Menu/Navigasi website</span>
              </div>
              <div className="pi-row-input">
                <label className="pi-simple-switch">
                  <input 
                    type="checkbox" 
                    checked={tidakMunculNavWeb} 
                    onChange={(e) => setTidakMunculNavWeb(e.target.checked)} 
                  />
                  <span className="pi-simple-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KANAN: Daftar Grup */}
      <div className="pi-category-card">
        <div className="pi-category-card-header">
          <h3>Daftar Grup</h3>
        </div>
        <div className="pi-category-card-body" style={{ padding: '16px' }}>
          <div className="pi-search-container" style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              className="pi-input-text w-full" 
              placeholder="Cari Kategori" 
              style={{ width: '100%', paddingLeft: '36px', boxSizing: 'border-box' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DataTable
            rows={filteredCategories}
            columns={[
              { key: 'name', label: 'Nama Grup' },
              { key: 'classification', label: 'Klasifikasi' },
              { key: 'pos', label: 'Tampil di POS', render: (row) => <StatusBadge active={row.pos} label={row.pos ? 'Ya' : 'Tidak'} /> },
              { key: 'web', label: 'Tampil di Web', render: (row) => <StatusBadge active={row.web} label={row.web ? 'Ya' : 'Tidak'} /> },
              { key: 'active', label: 'Status', render: (row) => <StatusBadge active={row.active} /> },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

export function PackagesPage({ onToggleCreate }) {
  const { businessSettings } = useAuth();
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

  const handleSetIsCreating = (val) => {
    setIsCreating(val);
    if (onToggleCreate) {
      onToggleCreate(val);
    }
  };

  const filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchQuery.toLowerCase())
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
              disabled 
              style={{ background: '#e2e8f0', color: '#94a3b8', border: 0, borderRadius: '4px', padding: '6px 16px', fontSize: '12px', fontWeight: 'bold', cursor: 'not-allowed' }}
            >
              ✓ Simpan
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
                      <Calendar size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input 
                        type="text" 
                        placeholder="Pilih hari" 
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
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="pi-btn" style={{ background: '#0284c7', color: '#ffffff', border: 0, borderRadius: '4px', padding: '8px 14px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <Copy size={14} /> Salin Paket Produk
          </button>
          <button className="pi-btn" style={{ background: '#0284c7', color: '#ffffff', border: 0, borderRadius: '4px', padding: '8px 14px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
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
        columns={[
          { key: 'name', label: 'Nama Produk' },
          { key: 'qty', label: 'Qty' },
          { key: 'onlinePrice', label: 'Harga Jual Online', render: (row) => formatCurrency(row.onlinePrice) },
          { key: 'offlinePrice', label: 'Harga Jual Offline', render: (row) => formatCurrency(row.offlinePrice) },
          { key: 'published', label: 'Publikasi', render: (row) => <StatusBadge active={row.published} label={row.published ? 'Publish' : 'Draft'} /> },
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
    </div>
  );
}

export function AddonsPage({ onToggleCreate }) {
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState('10');

  // Form states
  const [namaAddon, setNamaAddon] = useState('');
  const [hargaAddon, setHargaAddon] = useState('0,00');
  const [hubungkanProduk, setHubungkanProduk] = useState('');
  const [qtyAddon, setQtyAddon] = useState('1.00');
  const [grupBerlaku, setGrupBerlaku] = useState('');
  const [produkBerlaku, setProdukBerlaku] = useState('');

  const handleSetIsCreating = (val) => {
    setIsCreating(val);
    if (onToggleCreate) {
      onToggleCreate(val);
    }
  };

  const filteredAddons = addons.filter(addon =>
    addon.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isCreating) {
    return (
      <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
        <div className="pi-category-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div className="pi-category-card-header" style={{ padding: '16px 24px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b', fontWeight: 'bold' }}>Tambah Add-On Produk</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                type="button" 
                onClick={() => handleSetIsCreating(false)} 
                style={{ background: 'none', border: 0, color: '#0ea5e9', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Batal
              </button>
              <button 
                type="button" 
                disabled 
                style={{ background: '#e2e8f0', color: '#94a3b8', border: 0, borderRadius: '4px', padding: '6px 20px', fontSize: '12px', fontWeight: 'bold', cursor: 'not-allowed' }}
              >
                ✓ Simpan
              </button>
            </div>
          </div>
          <div className="pi-category-card-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Section 1: Nama & Harga */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Nama</label>
                <input 
                  type="text" 
                  className="pi-input-text w-full" 
                  value={namaAddon}
                  onChange={(e) => setNamaAddon(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Harga</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Rp.</span>
                  <input 
                    type="text" 
                    className="pi-input-text w-full" 
                    value={hargaAddon}
                    onChange={(e) => setHargaAddon(e.target.value)}
                    style={{ width: '100%', paddingLeft: '40px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Hubungkan ke Produk (Stok) */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>Hubungkan ke Produk (Stok)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Produk</label>
                  <select 
                    className="pi-store-select" 
                    value={hubungkanProduk}
                    onChange={(e) => setHubungkanProduk(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="">Select</option>
                    <option value="laminasi-doff">Laminasi Doff</option>
                    <option value="laminasi-glossy">Laminasi Glossy</option>
                    <option value="finishing-cutting">Finishing Cutting</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Qty</label>
                  <input 
                    type="text" 
                    className="pi-input-text w-full" 
                    value={qtyAddon}
                    onChange={(e) => setQtyAddon(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Berlaku untuk produk */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>Berlaku untuk produk</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Berlaku untuk grup produk</label>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    className="pi-input-text w-full" 
                    placeholder="Cari"
                    value={grupBerlaku}
                    onChange={(e) => setGrupBerlaku(e.target.value)}
                    style={{ width: '100%', paddingLeft: '36px', boxSizing: 'border-box' }}
                  />
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>pilih grup grup produk yang menggunakan add-on ini, atau kosongkan dan isi berdasarkan produk di bagian bawah</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Berlaku untuk produk</label>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    className="pi-input-text w-full" 
                    placeholder="Cari"
                    value={produkBerlaku}
                    onChange={(e) => setProdukBerlaku(e.target.value)}
                    style={{ width: '100%', paddingLeft: '36px', boxSizing: 'border-box' }}
                  />
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>pilih produk-produk yang menggunakan add-on ini. Boleh dikosongkan jika telah isi grup grup produk di atas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#ffffff' }}>
      {/* Search & Action bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
        <select 
          value={rowsPerPage} 
          onChange={(e) => setRowsPerPage(e.target.value)}
          style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px 12px', fontSize: '13px', color: '#64748b', outline: 'none', background: '#ffffff', minWidth: '100px' }}
        >
          <option value="10">10 Baris</option>
          <option value="25">25 Baris</option>
          <option value="50">50 Baris</option>
        </select>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Cari" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px 10px 8px 36px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <button 
          type="button" 
          onClick={() => handleSetIsCreating(true)}
          style={{ background: '#22c55e', color: '#ffffff', border: 0, borderRadius: '4px', padding: '8px 20px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <Plus size={14} /> Tambah
        </button>
      </div>

      <DataTable 
        rows={filteredAddons} 
        columns={[
          { key: 'name', label: 'Nama Produk' }, 
          { key: 'price', label: 'Harga', render: (row) => formatCurrency(row.price) }
        ]} 
      />

      {/* Pagination Footer */}
      <div className="pi-pagination-bar" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}></div>
        <div className="pi-pagination-controls">
          <span className="pi-pagination-info">Total {filteredAddons.length}</span>
          <button className="pi-pagination-nav-btn" disabled>&lt;</button>
          <span className="pi-pagination-active-page">1</span>
          <button className="pi-pagination-nav-btn" disabled>&gt;</button>
          <span className="pi-pagination-goto">
            Go to <input type="number" defaultValue={1} className="pi-pagination-input" min={1} />
          </span>
        </div>
      </div>
    </div>
  );
}

export function BrandsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [namaBrand, setNamaBrand] = useState('');
  const [komisi, setKomisi] = useState('');

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
      <div className="pi-split-layout-reverse">
        {/* KIRI: Tambah Brand */}
        <div className="pi-category-card">
          <div className="pi-category-card-header" style={{ padding: '16px 20px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>Tambah Brand</h3>
            <button 
              type="button"
              disabled
              style={{ background: '#e2e8f0', color: '#94a3b8', border: 0, borderRadius: '4px', padding: '6px 16px', fontSize: '12px', fontWeight: 'bold', cursor: 'not-allowed' }}
            >
              ✓ Simpan
            </button>
          </div>
          <div className="pi-category-card-body" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Nama Brand */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '16px', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', paddingTop: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>
                  Nama Brand <span style={{ color: '#ef4444' }}>*</span>
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', lineHeight: '1.4' }}>Nama brand produk Anda</span>
              </div>
              <div>
                <input 
                  type="text" 
                  className="pi-input-text w-full" 
                  value={namaBrand}
                  onChange={(e) => setNamaBrand(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Komisi */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '16px', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', paddingTop: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Komisi</span>
                <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', lineHeight: '1.4' }}>
                  Komisi untuk karyawan (Pelayan/Kasir) dari penjualan produk
                </span>
              </div>
              <div>
                <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden', background: '#ffffff' }}>
                  <input 
                    type="text" 
                    placeholder="Cukup hanya masukkan a"
                    value={komisi}
                    onChange={(e) => setKomisi(e.target.value)}
                    style={{ border: 0, outline: 0, padding: '8px 12px', fontSize: '13px', flex: 1, width: '100%', color: '#334155' }}
                  />
                  <div style={{ background: '#f8fafc', borderLeft: '1px solid #cbd5e1', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                    %
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KANAN: Daftar Merek */}
        <div className="pi-category-card">
          <div className="pi-category-card-header" style={{ padding: '16px 20px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>Daftar Merek</h3>
          </div>
          <div className="pi-category-card-body" style={{ padding: '20px' }}>
            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Cari brand..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 10px 6px 30px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <DataTable 
              rows={filteredBrands} 
              columns={[
                { key: 'name', label: 'Nama Brand' }, 
                { key: 'commission', label: 'Komisi', render: (row) => `${row.commission}%` }
              ]} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SpecificationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [namaSpesifikasi, setNamaSpesifikasi] = useState('');

  const filteredSpecs = specifications.filter(spec =>
    spec.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
      <div className="pi-split-layout-reverse">
        {/* KIRI: Tambah Spesifikasi */}
        <div className="pi-category-card">
          <div className="pi-category-card-header" style={{ padding: '16px 20px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>Tambah Spesifikasi</h3>
            <button 
              type="button"
              disabled
              style={{ background: '#e2e8f0', color: '#94a3b8', border: 0, borderRadius: '4px', padding: '6px 16px', fontSize: '12px', fontWeight: 'bold', cursor: 'not-allowed' }}
            >
              ✓ Simpan
            </button>
          </div>
          <div className="pi-category-card-body" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Nama */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '16px', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', paddingTop: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>
                  Nama <span style={{ color: '#ef4444' }}>*</span>
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', lineHeight: '1.4' }}>Nama Spesifikasi Produk</span>
              </div>
              <div>
                <input 
                  type="text" 
                  className="pi-input-text w-full" 
                  value={namaSpesifikasi}
                  onChange={(e) => setNamaSpesifikasi(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* KANAN: Daftar Spesifikasi */}
        <div className="pi-category-card">
          <div className="pi-category-card-header" style={{ padding: '16px 20px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>Daftar Spesifikasi</h3>
          </div>
          <div className="pi-category-card-body" style={{ padding: '20px' }}>
            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Cari spesifikasi..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 10px 6px 30px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <DataTable 
              rows={filteredSpecs} 
              columns={[
                { key: 'name', label: 'Nama Spesifikasi' }
              ]} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
