import { useState, useEffect } from 'react';
import { Search, ChevronDown, Printer, X, Plus, Trash2, ArrowLeft, CloudUpload, Download, Check, FileText, Edit, Settings, ChevronsUpDown } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { PolarBearSvg } from './_shared';

export function StockOpnamePage({ onToggleCreate, viewState: propViewState }) {
  const { user } = useAuth();
  const activeUserEmail = user?.email || '';

  const [viewState, setViewState] = useState('list'); // 'list' | 'create' | 'detail'
  
  useEffect(() => {
    if (propViewState) {
      setViewState(propViewState);
    }
  }, [propViewState]);
  
  // Opname List synced with localStorage, initialized empty
  const [opnameList, setOpnameList] = useState(() => {
    const saved = localStorage.getItem('stock_opnames');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse stock_opnames', e);
      }
    }
    return [];
  });

  const [nextDocNumber, setNextDocNumber] = useState(() => {
    const saved = localStorage.getItem('stock_opnames_next_num');
    return saved ? Number(saved) : 1;
  });

  const [selectedOpname, setSelectedOpname] = useState(null);

  // Form states
  const [tanggal, setTanggal] = useState('2026-06-25');
  const [catatan, setCatatan] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination & Sorting States
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Add Product form state within detail
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [actualQty, setActualQty] = useState('');

  // Edit fields modal
  const [showEditTanggalModal, setShowEditTanggalModal] = useState(false);
  const [showEditCatatanModal, setShowEditCatatanModal] = useState(false);
  const [editTanggalVal, setEditTanggalVal] = useState('2026-06-25');
  const [editCatatanVal, setEditCatatanVal] = useState('');

  const systemProducts = [
    { name: 'Kertas HVS A4 80g', systemQty: 120, price: 45000 },
    { name: 'Tinta Epson Hitam 003', systemQty: 15, price: 85000 },
    { name: 'Akrilik Bening 2mm', systemQty: 50, price: 120000 },
    { name: 'Stiker Vinyl Meteran', systemQty: 200, price: 25000 }
  ];

  useEffect(() => {
    localStorage.setItem('stock_opnames', JSON.stringify(opnameList));
    localStorage.setItem('stock_opnames_next_num', nextDocNumber.toString());
  }, [opnameList, nextDocNumber]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

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

    const updatedList = [newRecord, ...opnameList];
    setOpnameList(updatedList);
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
    
    setSelectedOpname(updatedOpname);
    setOpnameList(opnameList.map(item => item.no === selectedOpname.no ? updatedOpname : item));
    
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

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Sort list
  let sortedList = [...opnameList];
  if (sortKey) {
    sortedList.sort((a, b) => {
      let valA = a[sortKey] || '';
      let valB = b[sortKey] || '';

      valA = valA.toString().toLowerCase();
      valB = valB.toString().toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Filter list
  const filteredList = sortedList.filter(row => 
    row.no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.receivedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      {viewState === 'list' && (
        <div style={{ padding: '8px 0' }}>
          {/* Row 1: Header Bar matching Olsera screenshot */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Opname Stok</h2>
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'block' }}>{filteredList.length} Opname Stok</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Settings Icon Button */}
              <button 
                type="button"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  background: '#ffffff', 
                  border: '1px solid #e2e8f0', 
                  color: '#64748b', 
                  width: '34px', 
                  height: '34px', 
                  borderRadius: '50%', 
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
                title="Pengaturan Opname"
              >
                <Settings size={16} />
              </button>

              {/* Import Button */}
              <button 
                type="button"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: '#0085ca', 
                  color: '#ffffff', 
                  border: 0, 
                  padding: '0 16px', 
                  borderRadius: '6px', 
                  fontSize: '13px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  height: '34px',
                  boxShadow: '0 2px 4px rgba(0, 133, 202, 0.15)'
                }}
              >
                <CloudUpload size={14} />
                <span>Import</span>
              </button>

              {/* Tambah Button */}
              <button 
                type="button"
                onClick={() => {
                  setTanggal('2026-06-25');
                  setCatatan('');
                  handleStateChange('create');
                }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: '#0085ca', 
                  color: '#ffffff', 
                  border: 0, 
                  padding: '0 16px', 
                  borderRadius: '6px', 
                  fontSize: '13px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  height: '34px',
                  boxShadow: '0 2px 4px rgba(0, 133, 202, 0.15)'
                }}
              >
                <Plus size={14} />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          {/* Row 2: Select Row Count & Search Input matching Olsera screenshot */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <select 
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={{ 
                border: '1px solid #cbd5e1', 
                borderRadius: '6px', 
                padding: '6px 12px', 
                fontSize: '13px', 
                color: '#334155', 
                outline: 'none',
                background: '#ffffff',
                height: '34px',
                minWidth: '100px'
              }}
            >
              <option value={10}>10 Baris</option>
              <option value={25}>25 Baris</option>
              <option value={50}>50 Baris</option>
            </select>

            <div style={{ position: 'relative', width: '240px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Cari No. Opname Stok" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '6px', 
                  padding: '8px 10px 8px 32px', 
                  fontSize: '13px', 
                  outline: 'none', 
                  boxSizing: 'border-box',
                  height: '34px'
                }}
              />
            </div>
          </div>

          {/* Table Card Body */}
          <div style={{ overflowX: 'scroll', marginTop: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '860px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th onClick={() => handleSort('no')} style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569', cursor: 'pointer', userSelect: 'none', borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>No.</span>
                      <ChevronsUpDown size={14} style={{ color: sortKey === 'no' ? '#0085ca' : '#94a3b8' }} />
                    </div>
                  </th>
                  <th onClick={() => handleSort('date')} style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569', cursor: 'pointer', userSelect: 'none', borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Tanggal</span>
                      <ChevronsUpDown size={14} style={{ color: sortKey === 'date' ? '#0085ca' : '#94a3b8' }} />
                    </div>
                  </th>
                  <th onClick={() => handleSort('note')} style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569', cursor: 'pointer', userSelect: 'none', borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Catatan</span>
                      <ChevronsUpDown size={14} style={{ color: sortKey === 'note' ? '#0085ca' : '#94a3b8' }} />
                    </div>
                  </th>
                  <th onClick={() => handleSort('status')} style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569', cursor: 'pointer', userSelect: 'none', borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Status</span>
                      <ChevronsUpDown size={14} style={{ color: sortKey === 'status' ? '#0085ca' : '#94a3b8' }} />
                    </div>
                  </th>
                  <th onClick={() => handleSort('receivedBy')} style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569', cursor: 'pointer', userSelect: 'none', borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Diterima Oleh</span>
                      <ChevronsUpDown size={14} style={{ color: sortKey === 'receivedBy' ? '#0085ca' : '#94a3b8' }} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <PolarBearSvg />
                        <span style={{ fontSize: '14px', color: '#64748b', marginTop: '16px', fontWeight: 'bold' }}>No Data</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedList.map((row, index) => (
                    <tr 
                      key={index} 
                      onClick={() => {
                        setSelectedOpname(row);
                        handleStateChange('detail');
                      }}
                      style={{ cursor: 'pointer' }}
                      className="pi-table-row-hover"
                    >
                      <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'semibold', color: '#3b82f6', borderBottom: '1px solid #e2e8f0' }}>{row.no}</td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#334155', borderBottom: '1px solid #e2e8f0' }}>{row.date}</td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#334155', borderBottom: '1px solid #e2e8f0' }}>{row.note || '-'}</td>
                      <td style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ 
                          background: row.status === 'Draft' ? '#ffedd5' : row.status === 'Selesai' ? '#dcfce7' : '#fee2e2', 
                          color: row.status === 'Draft' ? '#ea580c' : row.status === 'Selesai' ? '#16a34a' : '#dc2626', 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '11px', 
                          fontWeight: 'bold' 
                        }}>{row.status}</span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>{row.receivedBy || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer matching bottom left of Olsera screenshot */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-start', 
            alignItems: 'center', 
            gap: '16px', 
            marginTop: '16px', 
            fontSize: '13px', 
            color: '#64748b',
            padding: '8px 4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1} 
                style={{ 
                  border: 0, 
                  background: 'none', 
                  color: currentPage === 1 ? '#cbd5e1' : '#64748b', 
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  padding: '4px 8px',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  style={{
                    border: 0,
                    background: 'none',
                    color: currentPage === page ? '#0085ca' : '#64748b',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: currentPage === page ? '#e4f8ff' : 'transparent'
                  }}
                >
                  {page}
                </button>
              ))}
              <button 
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages} 
                style={{ 
                  border: 0, 
                  background: 'none', 
                  color: currentPage === totalPages ? '#cbd5e1' : '#64748b', 
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  padding: '4px 8px',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                &gt;
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Go to</span>
              <input 
                type="number" 
                min={1}
                max={totalPages}
                value={currentPage} 
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val >= 1 && val <= totalPages) {
                    setCurrentPage(val);
                  }
                }}
                style={{ 
                  width: '45px', 
                  height: '28px', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '6px', 
                  textAlign: 'center', 
                  outline: 'none',
                  fontSize: '13px'
                }} 
              />
            </div>
          </div>

          {/* Bottom Info Banner */}
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
          {/* Warning Alert Box */}
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
          <div className="pi-category-card" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', gap: '20px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
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
              <button 
                onClick={() => handleStateChange('list')}
                style={{ 
                  background: '#ffffff', 
                  border: '1px solid #0085ca', 
                  color: '#0085ca', 
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
                <ArrowLeft size={14} />
                <span>Kembali</span>
              </button>

              <button style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={14} />
                <span>Cetak</span>
                <ChevronDown size={12} />
              </button>
              
              <button style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={14} />
                <span>Download Excel</span>
              </button>

              {selectedOpname.status === 'Draft' && (
                <>
                  <button 
                    onClick={() => handleUpdateStatus('Batal')}
                    style={{ background: '#ef4444', border: 0, color: '#ffffff', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
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
                      setEditTanggalVal('2026-06-25'); 
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
                  <span>Tanggal buat: {selectedOpname.date}</span>
                  <span>Dibuat oleh: {selectedOpname.receivedBy || 'System'}</span>
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
