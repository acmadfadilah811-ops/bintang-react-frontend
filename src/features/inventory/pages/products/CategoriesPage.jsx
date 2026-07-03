import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import { StatusBadge } from '../components/PageShell';
import apiClient from '../../../../api/apiClient';

export function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [namaGrup, setNamaGrup] = useState('');
  const [klasifikasi, setKlasifikasi] = useState('');
  const [nonAktifkan, setNonAktifkan] = useState(false);
  const [tidakMunculPos, setTidakMunculPos] = useState(false);
  const [tidakMunculNavWeb, setTidakMunculNavWeb] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedPhoto(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/product-categories/');
      setCategories(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      console.error('[CategoriesPage] fetch error:', err);
      setError('Gagal memuat daftar kategori.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async () => {
    if (!namaGrup.trim() || !klasifikasi || saving) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('nama', namaGrup);
      fd.append('klasifikasi', klasifikasi);
      fd.append('is_active', String(!nonAktifkan));
      fd.append('tampil_pos', String(!tidakMunculPos));
      fd.append('tampil_nav_web', String(!tidakMunculNavWeb));
      if (selectedPhoto) fd.append('foto', selectedPhoto);

      await apiClient.post('/product-categories/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setNamaGrup('');
      setKlasifikasi('');
      setNonAktifkan(false);
      setTidakMunculPos(false);
      setTidakMunculNavWeb(false);
      setSelectedPhoto(null);
      setPhotoPreviewUrl(null);
      await fetchCategories();
    } catch (err) {
      console.error('[CategoriesPage] save error:', err);
      setError('Gagal menyimpan kategori.');
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canSave = namaGrup.trim() && klasifikasi && !saving;

  return (
    <div className="pi-category-layout">
      {/* KIRI: Tambah Group/Kategori */}
      <div className="pi-category-card">
        <div className="pi-category-card-header">
          <h3>Tambah Group/Kategori</h3>
          <button
            type="button"
            className="pi-btn"
            disabled={!canSave}
            onClick={handleSave}
            style={{
              background: canSave ? '#16a34a' : '#e2e8f0',
              color: canSave ? '#fff' : '#94a3b8',
              border: '0',
              cursor: canSave ? 'pointer' : 'not-allowed',
              padding: '6px 16px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
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
                <span className="pi-row-desc">Memilih klasifikasi produk yang benar akan memudahkan pelanggan mencari produk Anda</span>
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
                <label className="pi-category-photo-upload" style={{ cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {photoPreviewUrl ? (
                    <img src={photoPreviewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Plus size={24} />
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                </label>
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
          {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 8 }}>{error}</p>}
          <DataTable
            rows={filteredCategories}
            emptyText={loading ? 'Memuat...' : 'Tidak ada data'}
            columns={[
              { key: 'nama', label: 'Nama Grup' },
              { key: 'klasifikasi', label: 'Klasifikasi', render: (row) => row.klasifikasi || '-' },
              { key: 'tampil_pos', label: 'Tampil di POS', render: (row) => <StatusBadge active={row.tampil_pos} label={row.tampil_pos ? 'Ya' : 'Tidak'} /> },
              { key: 'tampil_nav_web', label: 'Tampil di Web', render: (row) => <StatusBadge active={row.tampil_nav_web} label={row.tampil_nav_web ? 'Ya' : 'Tidak'} /> },
              { key: 'is_active', label: 'Status', render: (row) => <StatusBadge active={row.is_active} /> },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
