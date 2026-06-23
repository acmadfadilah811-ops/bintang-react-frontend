import React, { useState } from 'react';
import DataTable from '../components/DataTable';
import { Button, EmptyState, PageHeader, StatusBadge, Toolbar } from '../components/PageShell';
import { stockIncoming, stockMovement, stockOutgoing } from '../productInventoryData';
import { Search, ChevronDown, Calendar, Printer, X, Plus, Trash2, ArrowLeft, ArrowRight, CloudUpload, Download, Check, FileText, Edit, Settings } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const PolarBearSvg = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="50" fill="#eff6ff" />
    <path d="M20 90C35 80 50 85 65 92C80 99 95 95 100 90V110H20V90Z" fill="#dbeafe" />
    <path d="M45 80C45 65 52 50 65 50C78 50 85 65 85 80H45Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
    <circle cx="49" cy="53" r="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
    <circle cx="49" cy="53" r="3" fill="#fecdd3" />
    <circle cx="81" cy="53" r="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
    <circle cx="81" cy="53" r="3" fill="#fecdd3" />
    <circle cx="58" cy="62" r="2.5" fill="#1e293b" />
    <circle cx="72" cy="62" r="2.5" fill="#1e293b" />
    <ellipse cx="65" cy="69" rx="6" ry="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
    <polygon points="63,67 67,67 65,70" fill="#1e293b" />
    <rect x="58" y="76" width="14" height="8" rx="2" fill="#93c5fd" />
  </svg>
);

export function StockInPage({ onToggleCreate }) {
  const { user } = useAuth();
  const activeUserEmail = user?.email || 'bayumaruf1410@gmail.com';

  const [viewState, setViewState] = useState('list'); // 'list', 'create', 'detail'
  const [showTambahDropdown, setShowTambahDropdown] = useState(false);
  const [showPembelianModal, setShowPembelianModal] = useState(false);

  // Stock List State
  const [stockList, setStockList] = useState(stockIncoming);
  const [nextDocNumber, setNextDocNumber] = useState(3);

  // Form State
  const [tanggal, setTanggal] = useState('2026-06-23');
  const [catatan, setCatatan] = useState('');
  const [searchPembelian, setSearchPembelian] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [searchListQuery, setSearchListQuery] = useState('');

  // Qty Counter State for Detail Product Add
  const [qtyValue, setQtyValue] = useState(0);

  const handleStateChange = (state) => {
    setViewState(state);
    if (onToggleCreate) {
      onToggleCreate(state); // notify parent to update titles and hide tabs
    }
  };

  const handleSaveStock = (status) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = new Date(tanggal);
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    const newRecord = {
      no: `IN2606230000000${nextDocNumber}`,
      from: '-',
      supplier: '-',
      date: formattedDate,
      note: catatan || '-',
      status: status,
      receivedBy: activeUserEmail
    };

    setStockList([newRecord, ...stockList]);
    setNextDocNumber(prev => prev + 1);
    
    // Reset form
    setTanggal('2026-06-23');
    setCatatan('');
    handleStateChange('list');
  };

  const filteredStockIn = stockList.filter(row =>
    row.no.toLowerCase().includes(searchListQuery.toLowerCase()) ||
    row.supplier.toLowerCase().includes(searchListQuery.toLowerCase())
  );

  return (
    <>
      {viewState === 'list' && (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Daftar Stok Masuk</h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>{stockList.length} Stok Masuk</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Date Range Picker Mockup */}
              <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                <button type="button" style={{ border: 0, background: 'transparent', padding: '8px 12px', cursor: 'pointer', color: '#64748b' }}>&lt;</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>
                  <Calendar size={14} style={{ color: '#64748b' }} />
                  <span>01 Jan 26 - 23 Jun 26</span>
                  <ChevronDown size={12} style={{ color: '#64748b' }} />
                </div>
                <button type="button" style={{ border: 0, background: 'transparent', padding: '8px 12px', cursor: 'pointer', color: '#64748b' }}>&gt;</button>
              </div>

              {/* Export Button */}
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0085ca', color: '#ffffff', border: 0, padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                <Download size={14} />
                <span>Export</span>
              </button>

              {/* Import Button */}
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0085ca', color: '#ffffff', border: 0, padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                <CloudUpload size={14} />
                <span>Import</span>
              </button>

              {/* Tambah Dropdown Button */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowTambahDropdown(!showTambahDropdown)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#3b82f6', color: '#ffffff', border: 0, padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  <Plus size={14} />
                  <span>Tambah</span>
                  <ChevronDown size={12} />
                </button>

                {showTambahDropdown && (
                  <>
                    <div 
                      onClick={() => setShowTambahDropdown(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                    />
                    <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', width: '220px', zIndex: 999, overflow: 'hidden' }}>
                      <button 
                        onClick={() => {
                          setShowTambahDropdown(false);
                          setShowPembelianModal(true);
                        }}
                        style={{ width: '100%', border: 0, background: 'transparent', padding: '10px 16px', textAlign: 'left', fontSize: '13px', color: '#334155', cursor: 'pointer' }}
                        className="pi-dropdown-item-hover"
                      >
                        Terima dari Pembelian
                      </button>
                      <button 
                        onClick={() => {
                          setShowTambahDropdown(false);
                          handleStateChange('create');
                        }}
                        style={{ width: '100%', border: 0, background: 'transparent', padding: '10px 16px', textAlign: 'left', fontSize: '13px', color: '#334155', cursor: 'pointer', borderTop: '1px solid #f1f5f9' }}
                        className="pi-dropdown-item-hover"
                      >
                        Tambah Stok Masuk
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="pi-category-card">
            <div className="pi-category-card-body" style={{ padding: '20px' }}>
              {/* Row: Show / Search */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <select style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 12px', fontSize: '13px', color: '#334155', outline: 'none' }}>
                  <option>10 Baris</option>
                  <option>25 Baris</option>
                  <option>50 Baris</option>
                </select>

                <div style={{ position: 'relative', width: '240px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    placeholder="Cari No. Stok Masuk" 
                    value={searchListQuery}
                    onChange={(e) => setSearchListQuery(e.target.value)}
                    style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 10px 6px 30px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <DataTable 
                rows={filteredStockIn} 
                columns={[
                  { key: 'no', label: 'No.' }, 
                  { key: 'from', label: 'Diterima dari' }, 
                  { key: 'supplier', label: 'Supplier' }, 
                  { key: 'date', label: 'Tanggal' }, 
                  { key: 'note', label: 'Catatan' }, 
                  { 
                    key: 'status', 
                    label: 'Status',
                    render: (row) => {
                      if (row.status === 'Batal') {
                        return <span style={{ background: '#fecdd3', color: '#be123c', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>Batal</span>;
                      }
                      if (row.status === 'Draf') {
                        return <span style={{ background: '#ffedd5', color: '#ea580c', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>Draf</span>;
                      }
                      return <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>Selesai</span>;
                    }
                  }, 
                  { key: 'receivedBy', label: 'Diterima Oleh' }
                ]} 
              />

              {filteredStockIn.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', color: '#64748b' }}>
                  <PolarBearSvg />
                  <p style={{ marginTop: '16px', fontSize: '14px', fontWeight: 'bold' }}>Belum ada data stok masuk</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Terima dari Pembelian */}
      {showPembelianModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', width: '90%', maxWidth: '800px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Terima dari Pembelian</h3>
              <button 
                onClick={() => setShowPembelianModal(false)}
                style={{ background: '#f1f5f9', border: 0, padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}
              >
                Batal
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  placeholder="Cari No. Pembelian/Nama Supplier"
                  value={searchPembelian}
                  onChange={(e) => setSearchPembelian(e.target.value)}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px 12px 10px 36px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Table */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>No. Pembelian</th>
                      <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Nama Supplier</th>
                      <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Jumlah</th>
                      <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Tgl. Beli</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>
                        No Data
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '13px' }}>
              <div style={{ color: '#64748b' }}>Total 0</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button disabled style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', background: '#ffffff', cursor: 'not-allowed', color: '#cbd5e1' }}>&lt;</button>
                <span style={{ background: '#3b82f6', color: '#ffffff', width: '24px', height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</span>
                <button disabled style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', background: '#ffffff', cursor: 'not-allowed', color: '#cbd5e1' }}>&gt;</button>
                <span style={{ color: '#64748b', marginLeft: '8px' }}>
                  Go to <input type="number" defaultValue="1" style={{ width: '40px', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px', textAlign: 'center', fontSize: '12px' }} />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATE: create (Tambah Stok Masuk Form) */}
      {viewState === 'create' && (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
          <div className="pi-category-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="pi-category-card-header" style={{ padding: '16px 20px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }}>Tambah Stok Masuk</h3>
            </div>

            <div className="pi-category-card-body" style={{ padding: '24px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* Tanggal */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Tanggal</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input 
                      type="date" 
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px 12px 8px 36px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', color: '#334155' }}
                    />
                  </div>
                </div>

                {/* Catatan */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Catatan</label>
                  <input 
                    type="text" 
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', color: '#334155' }}
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                <button 
                  onClick={() => handleStateChange('list')}
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px 24px', fontSize: '13px', fontWeight: 'bold', color: '#475569', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button 
                  onClick={() => handleStateChange('detail')}
                  style={{ background: '#3b82f6', border: 0, borderRadius: '4px', padding: '10px 24px', fontSize: '13px', fontWeight: 'bold', color: '#ffffff', cursor: 'pointer' }}
                >
                  Continue Add Incoming Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATE: detail (Detail/Incoming Add View) */}
      {viewState === 'detail' && (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
          {/* Warning Banner */}
          <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '6px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#b45309', fontSize: '13px' }}>
            <span>ⓘ Pastikan data sudah benar sebelum diposting. Setelah diposting, data tidak diperbolehkan diubah.</span>
          </div>

          {/* Draft Info Header Card */}
          <div className="pi-category-card" style={{ marginBottom: '20px' }}>
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ background: '#ffedd5', color: '#ea580c', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Draft</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{`IN2606230000000${nextDocNumber}`}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', color: '#475569', cursor: 'pointer' }}>
                  <Printer size={14} />
                  <span>Cetak</span>
                </button>
                <button 
                  onClick={() => handleSaveStock('Draf')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffedd5', border: '1px solid #fed7aa', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', color: '#ea580c', cursor: 'pointer' }}
                >
                  <Check size={14} />
                  <span>Draf</span>
                </button>
                <button 
                  onClick={() => handleSaveStock('Batal')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', color: '#3b82f6', cursor: 'pointer' }}
                >
                  <X size={14} />
                  <span>Batalkan</span>
                </button>
                <button 
                  onClick={() => handleSaveStock('Selesai')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#22c55e', border: 0, padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', color: '#ffffff', cursor: 'pointer' }}
                >
                  <Check size={14} />
                  <span>Post Sekarang</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sub-card metadata details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Card 1: Tanggal */}
            <div className="pi-category-card">
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Tanggal</span>
                <button style={{ border: 0, background: 'transparent', color: '#3b82f6', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Ubah</button>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>23 Jun 2026</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Tanggal buat: 23 Jun 2026</span>
                  <span>Dibuat oleh: {user?.email || 'bayumart1410@gmail.com'}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Supplier */}
            <div className="pi-category-card">
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Supplier</span>
                <button style={{ border: 0, background: 'transparent', color: '#3b82f6', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Ubah</button>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#94a3b8' }}>-</div>
              </div>
            </div>

            {/* Card 3: Catatan */}
            <div className="pi-category-card">
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Catatan</span>
                <button style={{ border: 0, background: 'transparent', color: '#3b82f6', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Ubah</button>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#94a3b8' }}>{catatan || '-'}</div>
              </div>
            </div>
          </div>

          {/* Tambah Produk Card */}
          <div className="pi-category-card">
            <div className="pi-category-card-header" style={{ padding: '14px 20px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>Tambah Produk</h3>
            </div>
            <div className="pi-category-card-body" style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 120px auto', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
                {/* Cari Produk */}
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    placeholder="Cari Produk" 
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px 10px 8px 30px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Harga Beli */}
                <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden', height: '36px' }}>
                  <div style={{ background: '#f8fafc', borderRight: '1px solid #cbd5e1', padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                    Rp.
                  </div>
                  <input 
                    type="text" 
                    defaultValue="0,00" 
                    style={{ border: 0, outline: 0, padding: '0 12px', fontSize: '13px', flex: 1, textAlign: 'right', color: '#334155' }}
                  />
                </div>

                {/* Qty Stepper */}
                <div className="pi-qty-counter" style={{ height: '36px', width: '120px' }}>
                  <button 
                    onClick={() => setQtyValue(Math.max(0, qtyValue - 1))}
                    className="pi-qty-btn"
                  >
                    -
                  </button>
                  <input 
                    type="text" 
                    value={qtyValue} 
                    onChange={(e) => setQtyValue(parseInt(e.target.value) || 0)}
                    className="pi-qty-input" 
                  />
                  <button 
                    onClick={() => setQtyValue(qtyValue + 1)}
                    className="pi-qty-btn"
                  >
                    +
                  </button>
                </div>

                {/* Plus Blue Button */}
                <button style={{ background: '#3b82f6', color: '#ffffff', border: 0, borderRadius: '4px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Plus size={16} />
                </button>
              </div>

              {/* Bear Illustration area */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', borderTop: '1px solid #f1f5f9' }}>
                <PolarBearSvg />
                <span style={{ fontSize: '14px', color: '#64748b', marginTop: '16px', fontWeight: 'bold' }}>Belum ada produk</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function StockOutPage({ onToggleCreate }) {
  const { user } = useAuth();
  const activeUserEmail = user?.email || 'bayumaruf1410@gmail.com';

  const [viewState, setViewState] = useState('list'); // 'list', 'create', 'detail'
  const [createType, setCreateType] = useState('transfer'); // 'transfer' | 'manual'
  const [showTambahDropdown, setShowTambahDropdown] = useState(false);

  // Stock Out List State
  const [stockList, setStockList] = useState(stockOutgoing);
  const [nextDocNumber, setNextDocNumber] = useState(3);

  // Form State
  const [tanggal, setTanggal] = useState('2026-06-23');
  const [catatan, setCatatan] = useState('');
  const [transferKe, setTransferKe] = useState('');
  const [searchListQuery, setSearchListQuery] = useState('');

  // Qty Counter State for Detail Product Add
  const [qtyValue, setQtyValue] = useState(0);

  const handleStateChange = (state) => {
    setViewState(state);
    if (onToggleCreate) {
      onToggleCreate(state); // notify parent to update titles and hide tabs
    }
  };

  const handleSaveStock = (status) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = new Date(tanggal);
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    const newRecord = {
      no: `OG2606230000000${nextDocNumber}`,
      transferTo: createType === 'transfer' ? (transferKe || '-') : '-',
      date: formattedDate,
      note: catatan || '-',
      reason: createType === 'transfer' ? 'Transfer Toko' : 'Manual',
      status: status,
      receivedBy: activeUserEmail
    };

    setStockList([newRecord, ...stockList]);
    setNextDocNumber(prev => prev + 1);
    
    // Reset form
    setTanggal('2026-06-23');
    setCatatan('');
    setTransferKe('');
    handleStateChange('list');
  };

  const filteredStockOut = stockList.filter(row =>
    row.no.toLowerCase().includes(searchListQuery.toLowerCase()) ||
    row.transferTo.toLowerCase().includes(searchListQuery.toLowerCase())
  );

  return (
    <>
      {viewState === 'list' && (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Daftar Stok Keluar</h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>{stockList.length} Stok Keluar</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Date Range Picker Mockup */}
              <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                <button type="button" style={{ border: 0, background: 'transparent', padding: '8px 12px', cursor: 'pointer', color: '#64748b' }}>&lt;</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>
                  <Calendar size={14} style={{ color: '#64748b' }} />
                  <span>01 Jan 26 - 23 Jun 26</span>
                  <ChevronDown size={12} style={{ color: '#64748b' }} />
                </div>
                <button type="button" style={{ border: 0, background: 'transparent', padding: '8px 12px', cursor: 'pointer', color: '#64748b' }}>&gt;</button>
              </div>

              {/* Export Button */}
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0085ca', color: '#ffffff', border: 0, padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                <Download size={14} />
                <span>Export</span>
              </button>

              {/* Import Button */}
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0085ca', color: '#ffffff', border: 0, padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                <CloudUpload size={14} />
                <span>Import</span>
              </button>

              {/* Tambah Dropdown Button */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowTambahDropdown(!showTambahDropdown)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#3b82f6', color: '#ffffff', border: 0, padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  <Plus size={14} />
                  <span>Tambah</span>
                  <ChevronDown size={12} />
                </button>

                {showTambahDropdown && (
                  <>
                    <div 
                      onClick={() => setShowTambahDropdown(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                    />
                    <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', width: '220px', zIndex: 999, overflow: 'hidden' }}>
                      <button 
                        onClick={() => {
                          setShowTambahDropdown(false);
                          setCreateType('transfer');
                          handleStateChange('create');
                        }}
                        style={{ width: '100%', border: 0, background: 'transparent', padding: '10px 16px', textAlign: 'left', fontSize: '13px', color: '#334155', cursor: 'pointer' }}
                        className="pi-dropdown-item-hover"
                      >
                        Transfer ke toko
                      </button>
                      <button 
                        onClick={() => {
                          setShowTambahDropdown(false);
                          setCreateType('manual');
                          handleStateChange('create');
                        }}
                        style={{ width: '100%', border: 0, background: 'transparent', padding: '10px 16px', textAlign: 'left', fontSize: '13px', color: '#334155', cursor: 'pointer', borderTop: '1px solid #f1f5f9' }}
                        className="pi-dropdown-item-hover"
                      >
                        Tambah Stok Keluar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="pi-category-card">
            <div className="pi-category-card-body" style={{ padding: '20px' }}>
              {/* Row: Show / Search */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <select style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 12px', fontSize: '13px', color: '#334155', outline: 'none' }}>
                  <option>10 Baris</option>
                  <option>25 Baris</option>
                  <option>50 Baris</option>
                </select>

                <div style={{ position: 'relative', width: '240px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    placeholder="Cari No. Stok Keluar" 
                    value={searchListQuery}
                    onChange={(e) => setSearchListQuery(e.target.value)}
                    style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 10px 6px 30px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <DataTable 
                rows={filteredStockOut} 
                columns={[
                  { key: 'no', label: 'No.' }, 
                  { key: 'transferTo', label: 'Transfer ke' }, 
                  { key: 'date', label: 'Tanggal' }, 
                  { key: 'note', label: 'Catatan' }, 
                  { key: 'reason', label: 'Alasan' }, 
                  { 
                    key: 'status', 
                    label: 'Status',
                    render: (row) => {
                      if (row.status === 'Batal') {
                        return <span style={{ background: '#fecdd3', color: '#be123c', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>Batal</span>;
                      }
                      if (row.status === 'Draf') {
                        return <span style={{ background: '#ffedd5', color: '#ea580c', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>Draf</span>;
                      }
                      return <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>Selesai</span>;
                    }
                  }, 
                  { key: 'receivedBy', label: 'Diterima Oleh' }
                ]} 
              />

              {filteredStockOut.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', color: '#64748b' }}>
                  <PolarBearSvg />
                  <p style={{ marginTop: '16px', fontSize: '14px', fontWeight: 'bold' }}>Belum ada data stok keluar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STATE: create (Create View) */}
      {viewState === 'create' && (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
          <div className="pi-category-card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>Tambah Stok Keluar</span>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: createType === 'transfer' ? '1fr 1.5fr 1fr' : '1fr 2.5fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>Tanggal</label>
                  <input 
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px 12px', fontSize: '13px', color: '#334155', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>Catatan</label>
                  <input 
                    type="text"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px 12px', fontSize: '13px', color: '#334155', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {createType === 'transfer' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>Transfer ke</label>
                    <input 
                      type="text"
                      placeholder="Pilih salah satu (Autocomplete)"
                      value={transferKe}
                      onChange={(e) => setTransferKe(e.target.value)}
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px 12px', fontSize: '13px', color: '#334155', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                <button 
                  onClick={() => handleStateChange('list')}
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px 24px', fontSize: '13px', fontWeight: 'bold', color: '#475569', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button 
                  onClick={() => handleStateChange('detail')}
                  style={{ background: '#3b82f6', border: 0, borderRadius: '4px', padding: '10px 24px', fontSize: '13px', fontWeight: 'bold', color: '#ffffff', cursor: 'pointer' }}
                >
                  Lanjut tambah stok keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATE: detail (Detail View) */}
      {viewState === 'detail' && (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
          {/* Warning Banner */}
          <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '6px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#b45309', fontSize: '13px' }}>
            <span>ⓘ Pastikan data sudah benar sebelum diposting. Setelah diposting, data tidak diperbolehkan diubah.</span>
          </div>

          {/* Draft Info Header Card */}
          <div className="pi-category-card" style={{ marginBottom: '20px' }}>
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ background: '#ffedd5', color: '#ea580c', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Draft</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{`OG2606230000000${nextDocNumber}`}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', color: '#475569', cursor: 'pointer' }}>
                  <Printer size={14} />
                  <span>Cetak</span>
                </button>
                <button 
                  onClick={() => handleSaveStock('Draf')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffedd5', border: '1px solid #fed7aa', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', color: '#ea580c', cursor: 'pointer' }}
                >
                  <Check size={14} />
                  <span>Draf</span>
                </button>
                <button 
                  onClick={() => handleSaveStock('Batal')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', color: '#3b82f6', cursor: 'pointer' }}
                >
                  <X size={14} />
                  <span>Batalkan</span>
                </button>
                <button 
                  onClick={() => handleSaveStock('Selesai')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#22c55e', border: 0, padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', color: '#ffffff', cursor: 'pointer' }}
                >
                  <Check size={14} />
                  <span>Posting Sekarang</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sub-card metadata details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Card 1: Tanggal */}
            <div className="pi-category-card">
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Tanggal</span>
                <button style={{ border: 0, background: 'transparent', color: '#3b82f6', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Ubah</button>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{tanggal}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Tanggal buat: 23 Jun 2026</span>
                  <span>Dibuat oleh: {user?.email || 'bayumaruf1410@gmail.com'}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Transfer ke */}
            <div className="pi-category-card">
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Transfer ke</span>
                {createType === 'transfer' && (
                  <button style={{ border: 0, background: 'transparent', color: '#3b82f6', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Ubah</button>
                )}
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{createType === 'transfer' ? (transferKe || '-') : '-'}</div>
              </div>
            </div>

            {/* Card 3: Catatan */}
            <div className="pi-category-card">
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Catatan</span>
                <button style={{ border: 0, background: 'transparent', color: '#3b82f6', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Ubah</button>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{catatan || '-'}</div>
              </div>
            </div>

            {/* Card 4: Alasan */}
            <div className="pi-category-card">
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Alasan</span>
                <button style={{ border: 0, background: 'transparent', color: '#3b82f6', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Ubah</button>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{createType === 'transfer' ? 'Transfer Toko' : 'Manual'}</div>
              </div>
            </div>
          </div>

          {/* Tambah Produk Card */}
          <div className="pi-category-card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #cbd5e1', background: '#0284c7', color: '#ffffff', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{`Produk Stok Keluar (${qtyValue > 0 ? 1 : 0})`}</span>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
                {/* Qty Stepper */}
                <div className="pi-qty-counter" style={{ height: '36px', width: '120px' }}>
                  <button 
                    onClick={() => setQtyValue(Math.max(0, qtyValue - 1))}
                    className="pi-qty-btn"
                  >
                    -
                  </button>
                  <input 
                    type="text" 
                    value={qtyValue} 
                    onChange={(e) => setQtyValue(parseInt(e.target.value) || 0)}
                    className="pi-qty-input" 
                  />
                  <button 
                    onClick={() => setQtyValue(qtyValue + 1)}
                    className="pi-qty-btn"
                  >
                    +
                  </button>
                </div>

                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    placeholder="Cari Produk" 
                    style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px 10px 8px 30px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Bear Illustration area */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', borderTop: '1px solid #f1f5f9' }}>
                <PolarBearSvg />
                <span style={{ fontSize: '14px', color: '#64748b', marginTop: '16px', fontWeight: 'bold' }}>Belum ada produk</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function StockProductionPage({ onToggleCreate }) {
  const { user } = useAuth();
  const activeUserEmail = user?.email || 'bayumaruf1410@gmail.com';

  const [viewState, setViewState] = useState('list'); // 'list' | 'detail'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [productionList, setProductionList] = useState([]);
  const [nextDocNum, setNextDocNum] = useState(1);

  // Form states
  const [tanggal, setTanggal] = useState('2026-06-23');
  const [catatan, setCatatan] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected production for detail view
  const [selectedProduction, setSelectedProduction] = useState(null);

  const handleStateChange = (state) => {
    setViewState(state);
    if (onToggleCreate) {
      onToggleCreate(state);
    }
  };

  const handleSaveProduction = () => {
    const months = ['Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei'];
    const d = new Date(tanggal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth() % 12];
    const year = d.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    const numStr = String(nextDocNum).padStart(8, '0');
    const docNo = `PR260623${numStr}`;

    const newRecord = {
      no: docNo,
      date: formattedDate,
      note: catatan || '-',
      status: 'Selesai',
      receivedBy: activeUserEmail
    };

    setProductionList([newRecord, ...productionList]);
    setNextDocNum(prev => prev + 1);
    setCatatan('');
    setShowCreateModal(false);
  };

  const filteredList = productionList.filter(row => 
    row.no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.note.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {viewState === 'list' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Produksi Stock</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>Konversi bahan baku menjadi stok produk jadi berdasarkan BoM.</p>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#3b82f6', border: 0, padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', color: '#ffffff', cursor: 'pointer' }}
            >
              <Plus size={16} />
              <span>Tambah</span>
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Cari No. Produksi" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px 10px 38px', fontSize: '13px', outline: 'none' }}
              />
            </div>
          </div>

          <div className="pi-table-card" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <table className="pi-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>No.</th>
                  <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Tanggal</th>
                  <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Catatan</th>
                  <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Status</th>
                  <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Diterima Oleh</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <PolarBearSvg />
                        <span style={{ fontSize: '14px', color: '#64748b', marginTop: '16px', fontWeight: 'bold' }}>No Data</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((row, index) => (
                    <tr 
                      key={index} 
                      onClick={() => {
                        setSelectedProduction(row);
                        handleStateChange('detail');
                      }}
                      style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                      className="pi-table-row-hover"
                    >
                      <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'semibold', color: '#3b82f6' }}>{row.no}</td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#334155' }}>{row.date}</td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#334155' }}>{row.note}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{row.status}</span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#475569' }}>{row.receivedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', outline: 'none' }}>
                <option>15 Baris</option>
                <option>30 Baris</option>
                <option>50 Baris</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#64748b' }}>
              <span>Total {filteredList.length}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button disabled style={{ background: 'transparent', border: 0, padding: '4px', color: '#cbd5e1', cursor: 'not-allowed' }}>
                  <ArrowLeft size={16} />
                </button>
                <span style={{ background: '#3b82f6', color: '#ffffff', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>1</span>
                <button disabled style={{ background: 'transparent', border: 0, padding: '4px', color: '#cbd5e1', cursor: 'not-allowed' }}>
                  <ArrowRight size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Go to</span>
                <input type="text" defaultValue="1" style={{ width: '32px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px', fontSize: '12px', textAlign: 'center', outline: 'none' }} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Detail View */}
      {viewState === 'detail' && selectedProduction && (
        <div>
          <button 
            onClick={() => handleStateChange('list')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 0, color: '#3b82f6', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px', padding: 0 }}
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Daftar</span>
          </button>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{selectedProduction.no}</h3>
                  <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{selectedProduction.status}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>Dibuat pada {selectedProduction.date} oleh {selectedProduction.receivedBy}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Tanggal Produksi</span>
                <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: 'semibold' }}>{selectedProduction.date}</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Catatan</span>
                <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: 'semibold' }}>{selectedProduction.note}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Popup (Screenshot 2) */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          {/* Backdrop */}
          <div onClick={() => setShowCreateModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}></div>
          
          {/* Modal Container */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '480px', background: '#ffffff', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', overflow: 'hidden', border: '1px solid #e2e8f0', margin: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Tambah Produksi Stock</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 0, color: '#64748b', cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Tanggal</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="date" 
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', color: '#334155', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Catatan</label>
                <textarea 
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Masukkan catatan produksi"
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical', color: '#334155', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 'semibold', color: '#475569', cursor: 'pointer' }}
              >
                Batal
              </button>
              <button 
                onClick={handleSaveProduction}
                style={{ background: '#3b82f6', border: 0, borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 'semibold', color: '#ffffff', cursor: 'pointer' }}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function StockOpnamePage({ onToggleCreate }) {
  const { user } = useAuth();
  const activeUserEmail = user?.email || 'bayumaruf1410@gmail.com';

  const [viewState, setViewState] = useState('list'); // 'list' | 'create' | 'detail'
  
  // Opname List
  const [opnameList, setOpnameList] = useState([
    {
      no: 'OP26062400000002',
      date: '23-Jun-2026',
      note: '',
      status: 'Batal',
      receivedBy: 'bayumaruf1410@gmail.com',
      products: []
    },
    {
      no: 'OP26062400000003',
      date: '23-Jun-2026',
      note: '',
      status: 'Draft',
      receivedBy: '',
      products: []
    }
  ]);
  const [nextDocNumber, setNextDocNumber] = useState(4);
  const [selectedOpname, setSelectedOpname] = useState(null);

  // Form states
  const [tanggal, setTanggal] = useState('2026-06-23');
  const [catatan, setCatatan] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Product form state within detail
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [actualQty, setActualQty] = useState('');

  // Edit fields modal
  const [showEditTanggalModal, setShowEditTanggalModal] = useState(false);
  const [showEditCatatanModal, setShowEditCatatanModal] = useState(false);
  const [editTanggalVal, setEditTanggalVal] = useState('2026-06-23');
  const [editCatatanVal, setEditCatatanVal] = useState('');

  const systemProducts = [
    { name: 'Kertas HVS A4 80g', systemQty: 120, price: 45000 },
    { name: 'Tinta Epson Hitam 003', systemQty: 15, price: 85000 },
    { name: 'Akrilik Bening 2mm', systemQty: 50, price: 120000 },
    { name: 'Stiker Vinyl Meteran', systemQty: 200, price: 25000 }
  ];

  const handleStateChange = (state) => {
    setViewState(state);
    if (onToggleCreate) {
      onToggleCreate(state);
    }
  };

  const handleCreateNew = () => {
    const months = ['Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei'];
    const d = new Date(tanggal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth() % 12];
    const year = d.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    const numStr = String(nextDocNumber).padStart(8, '0');
    const newDocNo = `OP260624${numStr}`;

    const newRecord = {
      no: newDocNo,
      date: formattedDate,
      note: catatan || '',
      status: 'Draft',
      receivedBy: activeUserEmail,
      products: []
    };

    setOpnameList([newRecord, ...opnameList]);
    setNextDocNumber(prev => prev + 1);
    setSelectedOpname(newRecord);
    handleStateChange('detail');
  };

  const handleAddProduct = () => {
    if (!selectedProduct) return;
    const prod = systemProducts.find(p => p.name === selectedProduct);
    if (!prod) return;

    const actQty = parseInt(actualQty) || 0;
    const diff = actQty - prod.systemQty;
    const diffPrice = diff * prod.price;

    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newProdRow = {
      name: prod.name,
      time: timeStr,
      actualQty: actQty,
      systemQty: prod.systemQty,
      diff: diff,
      diffPrice: diffPrice
    };

    const updatedProducts = [...(selectedOpname.products || []), newProdRow];
    const updatedOpname = { ...selectedOpname, products: updatedProducts };
    
    // Update state
    setSelectedOpname(updatedOpname);
    setOpnameList(opnameList.map(item => item.no === selectedOpname.no ? updatedOpname : item));
    
    // Reset form
    setSelectedProduct('');
    setActualQty('');
    setShowAddProductModal(false);
  };

  const handleUpdateStatus = (newStatus) => {
    const updated = { ...selectedOpname, status: newStatus };
    setSelectedOpname(updated);
    setOpnameList(opnameList.map(item => item.no === selectedOpname.no ? updated : item));
  };

  const handleDeleteProduct = (prodName) => {
    const updatedProducts = selectedOpname.products.filter(p => p.name !== prodName);
    const updated = { ...selectedOpname, products: updatedProducts };
    setSelectedOpname(updated);
    setOpnameList(opnameList.map(item => item.no === selectedOpname.no ? updated : item));
  };

  const filteredList = opnameList.filter(row => 
    row.no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.note.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {viewState === 'list' && (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Opname Stok</h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>{opnameList.length} Opname Stok</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Settings Icon Button */}
              <button style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: '#f1f5f9', 
                border: '1px solid #cbd5e1', 
                color: '#64748b', 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                cursor: 'pointer' 
              }}>
                <Settings size={16} />
              </button>

              {/* Import Button */}
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0085ca', color: '#ffffff', border: 0, padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                <CloudUpload size={14} />
                <span>Import</span>
              </button>

              {/* Tambah Button */}
              <button 
                onClick={() => {
                  setTanggal('2026-06-23');
                  setCatatan('');
                  handleStateChange('create');
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0085ca', color: '#ffffff', border: 0, padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                <Plus size={14} />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="pi-category-card">
            <div className="pi-category-card-body" style={{ padding: '20px' }}>
              {/* Row: Show / Search */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <select style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 12px', fontSize: '13px', color: '#334155', outline: 'none' }}>
                  <option>10 Baris</option>
                  <option>25 Baris</option>
                  <option>50 Baris</option>
                </select>

                <div style={{ position: 'relative', width: '240px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    placeholder="Cari No. Opname Stok" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 10px 6px 30px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="pi-table-card" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <table className="pi-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>No.</th>
                      <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Tanggal</th>
                      <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Catatan</th>
                      <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Status</th>
                      <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Diterima Oleh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <PolarBearSvg />
                            <span style={{ fontSize: '14px', color: '#64748b', marginTop: '16px', fontWeight: 'bold' }}>No Data</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((row, index) => (
                        <tr 
                          key={index} 
                          onClick={() => {
                            setSelectedOpname(row);
                            handleStateChange('detail');
                          }}
                          style={{ borderBottom: '1px solid #cbd5e1', cursor: 'pointer' }}
                          className="pi-table-row-hover"
                        >
                          <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'semibold', color: '#3b82f6' }}>{row.no}</td>
                          <td style={{ padding: '14px 20px', fontSize: '13px', color: '#334155' }}>{row.date}</td>
                          <td style={{ padding: '14px 20px', fontSize: '13px', color: '#334155' }}>{row.note}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ 
                              background: row.status === 'Draft' ? '#ffedd5' : row.status === 'Selesai' ? '#dcfce7' : '#fee2e2', 
                              color: row.status === 'Draft' ? '#ea580c' : row.status === 'Selesai' ? '#16a34a' : '#dc2626', 
                              padding: '4px 8px', 
                              borderRadius: '4px', 
                              fontSize: '11px', 
                              fontWeight: 'bold' 
                            }}>{row.status}</span>
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: '13px', color: '#475569' }}>{row.receivedBy}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '14px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1e3a8a' }}>
            <span style={{ fontWeight: 'bold' }}>Pengaturan opname:</span>
            <span>sembunyikan Qty System dan sembunyikan Qty Selisih saat proses hitung fisik.</span>
          </div>
        </div>
      )}

      {viewState === 'create' && (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
          <div className="pi-category-card" style={{ maxWidth: '1200px', margin: '0 auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            {/* Card Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Tambah Opname Stok</h3>
            </div>
            
            {/* Card Body */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', marginBottom: '24px' }}>
                {/* Tanggal */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'semibold', color: '#475569', marginBottom: '6px' }}>Tanggal</label>
                  <input 
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    style={{ 
                      width: '100%', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '6px', 
                      padding: '8px 12px', 
                      fontSize: '13px', 
                      outline: 'none', 
                      boxSizing: 'border-box',
                      color: '#1e293b'
                    }}
                  />
                </div>

                {/* Catatan */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'semibold', color: '#475569', marginBottom: '6px' }}>Catatan</label>
                  <textarea 
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    style={{ 
                      width: '100%', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '6px', 
                      padding: '8px 12px', 
                      fontSize: '13px', 
                      outline: 'none', 
                      minHeight: '38px',
                      height: '38px',
                      fontFamily: 'inherit', 
                      resize: 'none', 
                      boxSizing: 'border-box',
                      color: '#1e293b'
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons Row */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <button 
                  onClick={() => handleStateChange('list')}
                  style={{ 
                    background: '#ffffff', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '6px', 
                    padding: '8px 20px', 
                    fontSize: '13px', 
                    fontWeight: 'bold', 
                    color: '#475569', 
                    cursor: 'pointer' 
                  }}
                >
                  Batal
                </button>
                <button 
                  onClick={handleCreateNew}
                  style={{ 
                    background: '#0085ca', 
                    border: 0, 
                    borderRadius: '6px', 
                    padding: '8px 20px', 
                    fontSize: '13px', 
                    fontWeight: 'bold', 
                    color: '#ffffff', 
                    cursor: 'pointer' 
                  }}
                >
                  Lanjut tambah Opname Stok
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewState === 'detail' && selectedOpname && (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
          {/* Spanduk Kuning / Warning Alert Box */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            background: '#f4f4f5', 
            border: '1px solid #e4e4e7', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            color: '#52525b', 
            fontSize: '13px', 
            fontWeight: '600', 
            marginBottom: '20px' 
          }}>
            <span style={{ fontSize: '16px', color: '#71717a' }}>ⓘ</span>
            <span>Pastikan data sudah benar sebelum diposting. Setelah terposting, data tidak diperbolehkan diubah.</span>
          </div>

          {/* Draft Info Header Card */}
          <div className="pi-category-card" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Left Column: Badge Status */}
              {selectedOpname.status === 'Draft' && (
                <div style={{
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: '8px',
                  width: '64px',
                  height: '64px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ea580c',
                  gap: '4px'
                }}>
                  <FileText size={20} />
                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Draft</span>
                </div>
              )}
              {selectedOpname.status === 'Selesai' && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  width: '64px',
                  height: '64px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#15803d',
                  gap: '4px'
                }}>
                  <Check size={20} />
                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Selesai</span>
                </div>
              )}
              {selectedOpname.status === 'Batal' && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  width: '64px',
                  height: '64px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#b91c1c',
                  gap: '4px'
                }}>
                  <X size={20} />
                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Batal</span>
                </div>
              )}

              {/* Middle Column: Document Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>No. Opname Stok</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>{selectedOpname.no}</span>
              </div>
            </div>

            {/* Right Column: Actions */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {selectedOpname.status === 'Batal' && (
                <button 
                  onClick={() => handleStateChange('list')}
                  style={{ 
                    background: '#ffffff', 
                    border: '1px solid #22c55e', 
                    color: '#22c55e', 
                    padding: '8px 14px', 
                    borderRadius: '6px', 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px' 
                  }}
                >
                  <ArrowLeft size={14} style={{ color: '#22c55e' }} />
                  <span>Kembali</span>
                </button>
              )}

              <button style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={14} />
                <span>Cetak</span>
                <ChevronDown size={12} />
              </button>
              
              <button style={{ background: '#ffffff', border: '1px solid #3b82f6', color: '#3b82f6', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={14} />
                <span>Download Excel</span>
              </button>

              {selectedOpname.status === 'Draft' && (
                <>
                  <button 
                    onClick={() => handleUpdateStatus('Draft')}
                    style={{ background: '#fff7ed', border: '1px solid #ffedd5', color: '#ea580c', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <FileText size={14} />
                    <span>Draf</span>
                  </button>

                  <button 
                    onClick={() => handleUpdateStatus('Batal')}
                    style={{ background: '#0085ca', border: 0, color: '#ffffff', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <X size={14} />
                    <span>Batalkan</span>
                  </button>

                  <button 
                    onClick={() => handleUpdateStatus('Selesai')}
                    style={{ background: '#22c55e', border: 0, color: '#ffffff', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Check size={14} />
                    <span>Posting Sekarang</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sub-card metadata grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Tanggal Card */}
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Tanggal</span>
                {selectedOpname.status === 'Draft' && (
                  <button 
                    onClick={() => {
                      setEditTanggalVal('2026-06-23'); 
                      setShowEditTanggalModal(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '650', cursor: 'pointer' }}
                  >
                    <Edit size={12} />
                    <span>Ubah</span>
                  </button>
                )}
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{selectedOpname.date}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Tanggal buat: 23 Jun 2026</span>
                  <span>Dibuat oleh: {selectedOpname.receivedBy || '-'}</span>
                </div>
              </div>
            </div>

            {/* Catatan Card */}
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Catatan</span>
                {selectedOpname.status === 'Draft' && (
                  <button 
                    onClick={() => {
                      setEditCatatanVal(selectedOpname.note || '');
                      setShowEditCatatanModal(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '650', cursor: 'pointer' }}
                  >
                    <Edit size={12} />
                    <span>Ubah</span>
                  </button>
                )}
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>{selectedOpname.note || '-'}</div>
              </div>
            </div>
          </div>

          {/* Produk Stok Opname Card */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden' }}>
            {selectedOpname.status === 'Draft' ? (
              <div style={{ 
                background: '#0085ca', 
                color: '#ffffff', 
                padding: '12px 20px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                borderTopLeftRadius: '8px', 
                borderTopRightRadius: '8px' 
              }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Produk Stok Opname ( {selectedOpname.products?.length || 0} )</span>
                <button 
                  onClick={() => setShowAddProductModal(true)}
                  style={{ 
                    background: '#ffffff', 
                    color: '#0085ca', 
                    border: 0, 
                    borderRadius: '6px', 
                    padding: '6px 14px', 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px' 
                  }}
                >
                  <Plus size={14} />
                  <span>Tambah Produk</span>
                </button>
              </div>
            ) : (
              <div style={{ 
                background: '#ffffff', 
                color: '#1e293b', 
                padding: '16px 20px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                borderBottom: '1px solid #cbd5e1'
              }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Produk Stok Opname ( {selectedOpname.products?.length || 0} )</span>
              </div>
            )}

            <div style={{ padding: '0px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', border: '1px solid #cbd5e1' }}>
                <thead>
                  {selectedOpname.status === 'Draft' ? (
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Nama</th>
                      <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Waktu</th>
                      <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Qty Aktual</th>
                      <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Qty System</th>
                      <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Qty Selisih</th>
                      <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Selisih Harga</th>
                      <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569', borderBottom: '1px solid #cbd5e1' }}>Aksi</th>
                    </tr>
                  ) : (
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Nama</th>
                      <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Waktu</th>
                      <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Qty System</th>
                      <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Qty Aktual</th>
                      <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Qty Selisih</th>
                      <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Selisih Harga</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {!selectedOpname.products || selectedOpname.products.length === 0 ? (
                    <tr>
                      <td colSpan={selectedOpname.status === 'Draft' ? 7 : 6} style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <PolarBearSvg />
                          <span style={{ fontSize: '14px', color: '#64748b', marginTop: '16px', fontWeight: 'bold' }}>No Data</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    selectedOpname.products.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #cbd5e1' }}>
                        <td style={{ padding: '12px 20px', fontSize: '13px', fontWeight: 'semibold', color: '#334155', borderRight: '1px solid #cbd5e1' }}>{row.name}</td>
                        <td style={{ padding: '12px 20px', fontSize: '13px', color: '#475569', borderRight: '1px solid #cbd5e1' }}>{row.time}</td>
                        
                        {selectedOpname.status === 'Draft' ? (
                          <>
                            <td style={{ padding: '12px 20px', fontSize: '13px', fontWeight: 'bold', color: '#1e293b', borderRight: '1px solid #cbd5e1' }}>{row.actualQty}</td>
                            <td style={{ padding: '12px 20px', fontSize: '13px', color: '#475569', borderRight: '1px solid #cbd5e1' }}>{row.systemQty}</td>
                          </>
                        ) : (
                          <>
                            <td style={{ padding: '12px 20px', fontSize: '13px', color: '#475569', borderRight: '1px solid #cbd5e1' }}>{row.systemQty}</td>
                            <td style={{ padding: '12px 20px', fontSize: '13px', fontWeight: 'bold', color: '#1e293b', borderRight: '1px solid #cbd5e1' }}>{row.actualQty}</td>
                          </>
                        )}
                        
                        <td style={{ padding: '12px 20px', fontSize: '13px', fontWeight: 'bold', color: row.diff === 0 ? '#475569' : row.diff > 0 ? '#16a34a' : '#dc2626', borderRight: '1px solid #cbd5e1' }}>
                          {row.diff > 0 ? `+${row.diff}` : row.diff}
                        </td>
                        <td style={{ padding: '12px 20px', fontSize: '13px', fontWeight: 'bold', color: row.diffPrice === 0 ? '#475569' : row.diffPrice > 0 ? '#16a34a' : '#dc2626', borderRight: '1px solid #cbd5e1' }}>
                          Rp {(row.diffPrice).toLocaleString('id-ID')}
                        </td>
                        {selectedOpname.status === 'Draft' && (
                          <td style={{ padding: '12px 20px' }}>
                            <button 
                              onClick={() => handleDeleteProduct(row.name)}
                              style={{ background: 'transparent', border: 0, color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tanggal Modal */}
      {showEditTanggalModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={() => setShowEditTanggalModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}></div>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px', background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden', margin: 'auto' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Ubah Tanggal</h3>
              <button onClick={() => setShowEditTanggalModal(false)} style={{ background: 'transparent', border: 0, color: '#64748b', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Tanggal Opname</label>
              <input 
                type="date"
                value={editTanggalVal}
                onChange={(e) => setEditTanggalVal(e.target.value)}
                style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setShowEditTanggalModal(false)} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 'semibold', color: '#475569', cursor: 'pointer' }}>Batal</button>
              <button 
                onClick={() => {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                  const d = new Date(editTanggalVal);
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = months[d.getMonth()];
                  const year = d.getFullYear();
                  const formattedDate = `${day}-${month}-${year}`;

                  const updated = { ...selectedOpname, date: formattedDate };
                  setSelectedOpname(updated);
                  setOpnameList(opnameList.map(item => item.no === selectedOpname.no ? updated : item));
                  setShowEditTanggalModal(false);
                }}
                style={{ background: '#3b82f6', border: 0, borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 'semibold', color: '#ffffff', cursor: 'pointer' }}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Catatan Modal */}
      {showEditCatatanModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={() => setShowEditCatatanModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}></div>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px', background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden', margin: 'auto' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Ubah Catatan</h3>
              <button onClick={() => setShowEditCatatanModal(false)} style={{ background: 'transparent', border: 0, color: '#64748b', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Catatan</label>
              <textarea 
                value={editCatatanVal}
                onChange={(e) => setEditCatatanVal(e.target.value)}
                style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px', fontSize: '13px', outline: 'none', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setShowEditCatatanModal(false)} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 'semibold', color: '#475569', cursor: 'pointer' }}>Batal</button>
              <button 
                onClick={() => {
                  const updated = { ...selectedOpname, note: editCatatanVal };
                  setSelectedOpname(updated);
                  setOpnameList(opnameList.map(item => item.no === selectedOpname.no ? updated : item));
                  setShowEditCatatanModal(false);
                }}
                style={{ background: '#3b82f6', border: 0, borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 'semibold', color: '#ffffff', cursor: 'pointer' }}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={() => setShowAddProductModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}></div>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px', background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden', margin: 'auto' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Tambah Produk Opname</h3>
              <button onClick={() => setShowAddProductModal(false)} style={{ background: 'transparent', border: 0, color: '#64748b', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Pilih Produk</label>
                <select 
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px', fontSize: '13px', outline: 'none' }}
                >
                  <option value="">-- Pilih Produk --</option>
                  {systemProducts.map((p, idx) => (
                    <option key={idx} value={p.name}>{p.name} (Sistem: {p.systemQty})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Qty Aktual (Fisik)</label>
                <input 
                  type="number"
                  placeholder="0"
                  value={actualQty}
                  onChange={(e) => setActualQty(e.target.value)}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setShowAddProductModal(false)} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 'semibold', color: '#475569', cursor: 'pointer' }}>Batal</button>
              <button onClick={handleAddProduct} style={{ background: '#3b82f6', border: 0, borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 'semibold', color: '#ffffff', cursor: 'pointer' }}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function StockMovementPage() {
  const [dateRange, setDateRange] = useState('24 Jun 26 - 24 Jun 26');
  const [searchVal, setSearchVal] = useState('');
  const [isAutocomplete, setIsAutocomplete] = useState(true);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Pergerakan Stok</h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>Laporan read-only mutasi stok per periode.</p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Date Picker container */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', background: '#ffffff', cursor: 'pointer' }}>
            <Calendar size={16} style={{ color: '#64748b' }} />
            <span style={{ fontSize: '13px', color: '#334155', fontWeight: 'semibold' }}>{dateRange}</span>
          </div>

          {/* Autocomplete Input */}
          <div style={{ position: 'relative', width: '280px' }}>
            <input 
              type="text"
              placeholder="Masukkan nama produk (autocomplete)"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Switch Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'semibold' }}>General</span>
            <div 
              onClick={() => setIsAutocomplete(!isAutocomplete)}
              style={{ 
                width: '36px', 
                height: '20px', 
                borderRadius: '10px', 
                background: isAutocomplete ? '#3b82f6' : '#cbd5e1', 
                position: 'relative', 
                cursor: 'pointer', 
                transition: 'background 0.2s' 
              }}
            >
              <div style={{ 
                width: '16px', 
                height: '16px', 
                borderRadius: '50%', 
                background: '#ffffff', 
                position: 'absolute', 
                top: '2px', 
                left: isAutocomplete ? '18px' : '2px', 
                transition: 'left 0.2s' 
              }}></div>
            </div>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'semibold' }}>Autocomplete</span>
          </div>
        </div>

        {/* Download Excel green button */}
        <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#22c55e', border: 0, padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', color: '#ffffff', cursor: 'pointer' }}>
          <Download size={16} />
          <span>Download Excel</span>
        </button>
      </div>

      {/* Row count dropdown */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <select style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', outline: 'none' }}>
          <option>10 Baris</option>
          <option>25 Baris</option>
          <option>50 Baris</option>
        </select>
      </div>

      <div className="pi-table-card" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
        <table className="pi-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
              <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Grup</th>
              <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Produk</th>
              <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Awal</th>
              <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Masuk</th>
              <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Pengembalian</th>
              <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Penjualan</th>
              <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Keluar</th>
              <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Sisa</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <PolarBearSvg />
                  <span style={{ fontSize: '14px', color: '#64748b', marginTop: '16px', fontWeight: 'bold' }}>No Data</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export function StockAlertPage() {
  const [emailList, setEmailList] = useState([
    { email: 'bayumaruf1410@gmail.com' }
  ]);
  const [newEmail, setNewEmail] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddEmail = (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    if (emailList.some(item => item.email.toLowerCase() === newEmail.trim().toLowerCase())) {
      alert('Email ini sudah terdaftar.');
      return;
    }
    setEmailList([...emailList, { email: newEmail.trim() }]);
    setNewEmail('');
    setShowAddForm(false);
  };

  const handleDeleteEmail = (email) => {
    setEmailList(emailList.filter(item => item.email !== email));
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Email Peringatan Stok</h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>Daftar email penerima peringatan stok rendah setiap pagi.</p>
        </div>
      </div>

      {/* Info Description banner */}
      <div style={{ display: 'flex', gap: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '16px', borderRadius: '8px', color: '#1e3a8a', fontSize: '13px', lineHeight: '1.5', marginBottom: '24px' }}>
        <span style={{ fontSize: '16px' }}>ⓘ</span>
        <div>
          <strong style={{ display: 'block', marginBottom: '2px' }}>Peringatan Stok:</strong>
          <span>Setiap pagi, system akan mengirimkan "Peringatan Sisa Stok" ke email-email penerima di bawah ini. Kosongkan jika Anda tidak ingin menerima peringatan ini via email.</span>
        </div>
      </div>

      {/* Main panel */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>Email Penerima</span>
          <button 
            onClick={() => setShowAddForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#3b82f6', border: 0, padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', cursor: 'pointer' }}
          >
            <Plus size={14} />
            <span>Tambah</span>
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddEmail} style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input 
              type="email"
              placeholder="Masukkan email penerima"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none' }}
            />
            <button type="submit" style={{ background: '#22c55e', border: 0, color: '#ffffff', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
              Simpan
            </button>
            <button type="button" onClick={() => setShowAddForm(false)} style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
              Batal
            </button>
          </form>
        )}

        <div style={{ padding: '0px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Email Penerima</th>
                <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569', width: '80px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {emailList.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                    Belum ada email penerima. Klik Tambah untuk memasukkan email.
                  </td>
                </tr>
              ) : (
                emailList.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 20px', fontSize: '13px', fontWeight: 'semibold', color: '#334155' }}>{item.email}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDeleteEmail(item.email)}
                        style={{ background: 'transparent', border: 0, color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
