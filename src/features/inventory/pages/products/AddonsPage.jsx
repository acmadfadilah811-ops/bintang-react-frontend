import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import { addons, formatCurrency } from '../productInventoryData';

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
