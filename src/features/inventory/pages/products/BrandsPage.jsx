import { useState } from 'react';
import { Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import { brands } from '../productInventoryData';

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
