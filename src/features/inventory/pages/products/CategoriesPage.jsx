import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import { StatusBadge } from '../components/PageShell';
import { categories } from '../productInventoryData';

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
