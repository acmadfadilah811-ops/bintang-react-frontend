import { useState } from 'react';
import { MoreHorizontal, Plus, Trash2, MoreVertical, Upload, Download, Copy, ChevronUp } from 'lucide-react';
import DataTable from '../components/DataTable';
import FormDrawer from '../components/FormDrawer';
import { Button, PageHeader, Select, StatusBadge, Toolbar } from '../components/PageShell';
import { formatCurrency, productRows } from '../productInventoryData';
import { useAuth } from '../../../context/AuthContext';

export default function ProductsPage() {
  const { businessSettings } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);

  // Form states matching screenshot
  const [onlinePriceSame, setOnlinePriceSame] = useState(true);
  const [trackInventory, setTrackInventory] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(productRows.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const columns = [
    {
      key: 'select',
      label: (
        <input 
          type="checkbox" 
          checked={selectedIds.length === productRows.length && productRows.length > 0} 
          onChange={toggleSelectAll} 
        />
      ),
      render: (row) => (
        <input 
          type="checkbox" 
          checked={selectedIds.includes(row.id)} 
          onChange={() => toggleSelectRow(row.id)} 
        />
      )
    },
    { key: 'photo', label: 'Foto', render: () => <div className="pi-product-thumb" /> },
    { key: 'name', label: 'Nama Produk' },
    { key: 'variant', label: 'Variant' },
    { key: 'sku', label: 'SKU' },
    { key: 'barcode', label: 'Barcode' },
    { key: 'stock', label: 'Qty Stok' },
    { key: 'unit', label: 'Satuan' },
    { key: 'cost', label: 'Harga Beli', render: (row) => formatCurrency(row.cost) },
    { key: 'storePrice', label: 'Harga Jual di Toko', render: (row) => formatCurrency(row.storePrice) },
    { key: 'onlinePrice', label: 'Harga Jual Online', render: (row) => formatCurrency(row.onlinePrice) },
    { key: 'online', label: 'Tersedia Online', render: (row) => <StatusBadge active={row.online} label={row.online ? 'Ya' : 'Tidak'} /> },
    { key: 'action', label: '', render: () => <button className="pi-icon-button"><MoreHorizontal size={16} /></button> },
  ];

  if (isCreating) {
    return (
      <div className="pi-create-container">
        <div className="pi-create-header">
          <h2>Tambah Produk</h2>
          <div className="pi-create-actions">
            <button className="pi-btn pi-btn-secondary" onClick={() => setIsCreating(false)}>
              Batal
            </button>
            <div className="pi-store-select-group">
              <span>Simpan di:</span>
              <select className="pi-store-select">
                <option>{businessSettings?.nama_bisnis || 'Bintang Advertising'}</option>
              </select>
            </div>
            <button className="pi-btn pi-btn-secondary" disabled style={{ background: '#e2e8f0', color: '#94a3b8', border: '0' }}>
              Simpan
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
              <div className="pi-upload-square">
                <Plus size={24} />
              </div>
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
              <input type="text" placeholder="Masukkan Nama Produk" />
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
              <input type="text" placeholder="Masukkan Nama Produk Alternatif" />
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
              <select defaultValue="">
                <option value="" disabled>Pilih salah satu</option>
                <option>Print Outdoor</option>
                <option>Print Indoor</option>
              </select>
            </div>
          </div>

          {/* Harga Jual di Toko */}
          <div className="pi-create-row">
            <div className="pi-row-label-desc">
              <span className="pi-row-label">Harga Jual di Toko</span>
            </div>
            <div className="pi-row-input">
              <input type="text" placeholder="Rp. 0,00" />
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
        </div>

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
                  <textarea placeholder="Masukkan deskripsi produk..." style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', minHeight: '100px', font: 'inherit', width: '100%', boxSizing: 'border-box' }} />
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
        left={
          <>
            <button 
              className="pi-btn-icon-only" 
              title="Hapus Terpilih"
              disabled={selectedIds.length === 0}
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
            <Select defaultValue=""><option value="">Kategori</option><option>Print Outdoor</option><option>Print Indoor</option></Select>
            <Select defaultValue=""><option value="">Brand</option><option>Flexi China</option><option>Albatros</option></Select>
            <Select defaultValue=""><option value="">Koleksi</option><option>Koleksi Promo</option></Select>
          </>
        }
        right={
          <Button variant="success" onClick={() => setIsCreating(true)}>
            <Plus size={16} /> Tambah
          </Button>
        }
      />
      
      <DataTable columns={columns} rows={productRows} />

      <div className="pi-pagination-container">
        <div className="pi-pagination-left">
          <button 
            className="pi-btn-icon-only" 
            title="Hapus Terpilih"
            disabled={selectedIds.length === 0}
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
          <span>Total {productRows.length}</span>
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

      <FormDrawer open={drawerOpen} title="Tambah Produk" onClose={() => setDrawerOpen(false)}>
        <div className="pi-form-grid">
          <label>Nama Produk<input placeholder="Nama produk" /></label>
          <label>Nama Alternatif<input placeholder="Opsional" /></label>
          <label>Kategori<select><option>Print Outdoor</option><option>Print Indoor</option></select></label>
          <label>Harga Jual di Toko<input placeholder="Rp 0" /></label>
          <label>SKU<input placeholder="SKU" /></label>
          <label>Barcode<input placeholder="Nomor barcode" /></label>
        </div>
        <div className="pi-switch-list">
          <label><input type="checkbox" defaultChecked /> Harga online sama dengan harga toko</label>
          <label><input type="checkbox" /> Lacak inventori</label>
          <label><input type="checkbox" /> Produk memiliki varian</label>
        </div>
      </FormDrawer>
    </>
  );
}
