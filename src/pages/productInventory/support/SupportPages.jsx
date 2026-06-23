import React, { useState } from 'react';
import DataTable from '../components/DataTable';
import { Button, EmptyState, PageHeader, Select, Toolbar } from '../components/PageShell';
import { specialTypeMenus } from '../productInventoryData';
import { Settings, SlidersHorizontal, Search, Plus } from 'lucide-react';

export function ProductionCostPage() {
  return (
    <>
      <PageHeader
        title="Biaya Produksi"
        description="Master komponen biaya produksi non-bahan, seperti tenaga kerja, listrik, dan sewa mesin."
        actions={<Button variant="success">Tambah</Button>}
      />
      <Toolbar searchPlaceholder="Cari biaya" />
      <DataTable
        rows={[]}
        columns={[
          { key: 'name', label: 'Nama Biaya' },
          { key: 'value', label: 'Nilai Biaya' },
          { key: 'account', label: 'Akun Terkait' },
        ]}
      />
    </>
  );
}

export function SpecialTypeListPage() {
  return (
    <>
      <PageHeader title="Tipe Special" description="Masukkan produk ke bucket khusus seperti Unggulan, Sale, Pre-order, atau Bahan Baku." />
      <div className="pi-split-panel">
        <aside className="pi-menu-panel">
          {specialTypeMenus.map((item, index) => (
            <button className={index === 0 ? 'is-active' : ''} key={item}>
              {item}
            </button>
          ))}
        </aside>
        <section className="pi-content-panel">
          <div className="pi-panel-head">
            <div>
              <h3>Daftar Produk Unggulan</h3>
              <p>0 Produk Unggulan</p>
            </div>
            <Button variant="success">Tambah</Button>
          </div>
          <Toolbar
            searchPlaceholder="Cari produk"
            left={
              <Select defaultValue="5">
                <option value="5">5 Baris</option>
                <option value="10">10 Baris</option>
              </Select>
            }
          />
          <DataTable
            rows={[]}
            columns={[
              { key: 'name', label: 'Nama' },
              { key: 'sku', label: 'SKU' },
              { key: 'group', label: 'Grup' },
              { key: 'action', label: 'Aksi' },
            ]}
          />
        </section>
      </div>
    </>
  );
}

export function SpecialCollectionPage() {
  return (
    <>
      <PageHeader title="Koleksi" description="Master koleksi produk yang nantinya digunakan sebagai filter pada data produk." />
      <div className="pi-two-columns pi-two-columns-narrow">
        <section className="pi-card pi-form-stack">
          <div className="pi-panel-head">
            <h3>Tambah Koleksi</h3>
            <Button variant="success">Simpan</Button>
          </div>
          <label>
            Nama Koleksi
            <input placeholder="Contoh: Koleksi Hari Raya" />
          </label>
        </section>
        <section className="pi-card">
          <div className="pi-panel-head"><h3>Daftar Koleksi</h3></div>
          <DataTable rows={[]} columns={[{ key: 'name', label: 'Nama Koleksi' }]} />
        </section>
      </div>
    </>
  );
}

export function SpecialLookBookPage() {
  return (
    <>
      <PageHeader title="Look Book" description="Kurasi produk dan gambar untuk etalase website atau katalog online." actions={<Button variant="success">Tambah</Button>} />
      <Toolbar searchPlaceholder="Cari" />
      <DataTable
        rows={[]}
        columns={[
          { key: 'name', label: 'Nama' },
          { key: 'group', label: 'Grup' },
          { key: 'status', label: 'Status' },
        ]}
      />
      <div className="pi-note-card">
        Form tambah berisi Nama, Grup, Gambar Lookbook, Produk dalam lookbook, dan Publikasi.
      </div>
    </>
  );
}

export function BarcodePage() {
  return (
    <>
      <PageHeader title="Cetak Barcode Produk" description="Pilih produk atau paket produk untuk membuat barcode siap cetak." />
      <div className="pi-card pi-form-stack">
        <label>Produk<input placeholder="Cari produk" /></label>
        <label>Atau Paket Produk<input placeholder="Cari paket produk" /></label>
        <label>Qty<input defaultValue="1" /></label>
        <div><Button variant="info">Terapkan</Button></div>
      </div>
    </>
  );
}

export function PriceLabelProductsPage() {
  return (
    <>
      <PageHeader title="Produk Label Harga" description="Pilih produk yang ingin dicetak label harganya." />
      <div className="pi-two-columns">
        <section className="pi-card">
          <Toolbar
            searchPlaceholder="Pilih Produk"
            left={
              <Select defaultValue="name">
                <option value="name">Nama</option>
                <option value="sku">SKU</option>
              </Select>
            }
          />
          <EmptyState title="Pilih produk yang ingin dicetak label harganya" />
        </section>
        <section className="pi-card">
          <div className="pi-panel-head"><h3>Preview</h3><Button variant="success">Cetak</Button></div>
          <div className="pi-preview-box">Label harga produk akan muncul di sini</div>
        </section>
      </div>
    </>
  );
}

export function PriceLabelSettingsPage() {
  return (
    <>
      <PageHeader title="Pengaturan Label Harga" description="Konfigurasi ukuran kertas, margin, ukuran label, dan isi label." />
      <div className="pi-two-columns">
        <section className="pi-card pi-settings-grid">
          <label>Margin Atas<input defaultValue="10" /></label>
          <label>Margin Bawah<input defaultValue="10" /></label>
          <label>Margin Kiri<input defaultValue="10" /></label>
          <label>Margin Kanan<input defaultValue="10" /></label>
          <label>Lebar Kertas<input defaultValue="210" /></label>
          <label>Jumlah Label per Baris<input defaultValue="2" /></label>
          <label>Padding<input defaultValue="12" /></label>
          <label>Lebar Label<input defaultValue="240" /></label>
          <label>Tinggi Label<input defaultValue="120" /></label>
          <label className="pi-checkbox-line"><input type="checkbox" defaultChecked /> Gunakan nama alternatif</label>
          <label className="pi-checkbox-line"><input type="checkbox" defaultChecked /> Tampilkan nomor barcode</label>
          <label className="pi-checkbox-line"><input type="checkbox" defaultChecked /> Tampilkan berat produk</label>
        </section>
        <section className="pi-card">
          <div className="pi-panel-head"><h3>Preview</h3><Button variant="success">Cetak</Button></div>
          <div className="pi-preview-box">Label harga produk akan muncul di sini</div>
        </section>
      </div>
    </>
  );
}

const PolarBearSvgWithWallet = () => (
  <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="70" cy="70" r="50" fill="#e0f2fe" />
    <path d="M75 90C75 75 82 60 95 60C108 60 115 75 115 90H75Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
    <circle cx="82" cy="65" r="5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
    <circle cx="108" cy="65" r="5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
    <circle cx="89" cy="74" r="2" fill="#1e293b" />
    <circle cx="101" cy="74" r="2" fill="#1e293b" />
    <ellipse cx="95" cy="80" rx="4" ry="3" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
    <polygon points="94,79 96,79 95,81" fill="#1e293b" />
    <rect x="40" y="55" width="50" height="38" rx="8" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
    <path d="M73 55V93" stroke="#0369a1" strokeWidth="1" strokeDasharray="2 2" />
    <rect x="74" y="65" width="14" height="10" rx="2" fill="#e0f2fe" />
    <circle cx="78" cy="70" r="1.5" fill="#0284c7" />
  </svg>
);

export function DepositPage() {
  const [searchVal, setSearchVal] = useState('');

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
      {/* Blue Banner Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', 
        borderRadius: '12px', 
        padding: '30px 40px', 
        color: '#ffffff', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>Deposit</h2>
          <p style={{ fontSize: '15px', margin: '8px 0 0 0', opacity: 0.9 }}>Mudahkan pembayaran pelanggan Anda dengan Deposit</p>
        </div>

        {/* Graphic illustration */}
        <div style={{ position: 'relative', width: '120px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', background: '#0284c7', opacity: 0.4, right: '15px' }}></div>
          <div style={{ position: 'absolute', width: '64px', height: '64px', borderRadius: '50%', background: '#e0f2fe', opacity: 0.8, right: '0px' }}></div>
          <div style={{ 
            position: 'absolute', 
            background: '#0284c7', 
            borderRadius: '10px', 
            width: '56px', 
            height: '42px', 
            right: '20px', 
            top: '19px', 
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #e0f2fe'
          }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#e0f2fe', marginLeft: 'auto', marginRight: '6px' }}></div>
          </div>
        </div>
      </div>

      {/* Heading */}
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px', marginTop: 0 }}>Deposit</h3>

      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: '#0085ca', 
            color: '#ffffff', 
            border: 0, 
            padding: '10px 18px', 
            borderRadius: '6px', 
            fontSize: '13px', 
            fontWeight: 'bold', 
            cursor: 'pointer' 
          }}>
            <Settings size={14} />
            <span>Pengaturan</span>
          </button>
          
          <button style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: '#0085ca', 
            color: '#ffffff', 
            border: 0, 
            padding: '10px 18px', 
            borderRadius: '6px', 
            fontSize: '13px', 
            fontWeight: 'bold', 
            cursor: 'pointer' 
          }}>
            <SlidersHorizontal size={14} />
            <span>Filter</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Cari" 
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              style={{ 
                width: '100%', 
                border: '1px solid #cbd5e1', 
                borderRadius: '6px', 
                padding: '8px 12px 8px 36px', 
                fontSize: '13px', 
                outline: 'none', 
                boxSizing: 'border-box' 
              }}
            />
          </div>

          <button style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            background: '#22c55e', 
            color: '#ffffff', 
            border: 0, 
            padding: '10px 20px', 
            borderRadius: '6px', 
            fontSize: '13px', 
            fontWeight: 'bold', 
            cursor: 'pointer' 
          }}>
            <Plus size={14} />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#ffffff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
              <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Nama</th>
              <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Nominal</th>
              <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Harga Jual</th>
              <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Masa berlaku</th>
              <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Tampilkan di POS?</th>
              <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Aktif</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <PolarBearSvgWithWallet />
                  <span style={{ fontSize: '14px', color: '#64748b', marginTop: '16px', fontWeight: 'bold' }}>Tidak ada deposit</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
