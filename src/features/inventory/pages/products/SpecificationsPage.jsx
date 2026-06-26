import { useState } from 'react';
import { Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import { specifications } from '../productInventoryData';

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
