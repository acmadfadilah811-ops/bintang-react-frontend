import { useState, useEffect } from 'react';
import { Search, X, Plus, ArrowLeft, ArrowRight, ChevronsUpDown } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { PolarBearSvg } from './_shared';

export function StockProductionPage({ onToggleCreate, viewState: propViewState }) {
  const { user } = useAuth();
  const activeUserEmail = user?.email || '';

  const [viewState, setViewState] = useState('list'); // 'list' | 'detail'
  
  useEffect(() => {
    if (propViewState) {
      setViewState(propViewState);
    }
  }, [propViewState]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [productionList, setProductionList] = useState(() => {
    const saved = localStorage.getItem('stock_productions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse stock_productions', e);
      }
    }
    return [];
  });

  const [nextDocNum, setNextDocNum] = useState(() => {
    const saved = localStorage.getItem('stock_productions_next_num');
    return saved ? Number(saved) : 1;
  });

  // Form states
  const [tanggal, setTanggal] = useState('2026-06-25');
  const [catatan, setCatatan] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination & Sorting States
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Selected production for detail view
  const [selectedProduction, setSelectedProduction] = useState(null);

  useEffect(() => {
    localStorage.setItem('stock_productions', JSON.stringify(productionList));
    localStorage.setItem('stock_productions_next_num', nextDocNum.toString());
  }, [productionList, nextDocNum]);

  // Reset page when search or active items change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

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
    const docNo = `PR260625${numStr}`;

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

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Sort list
  let sortedList = [...productionList];
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
        <>
          {/* Top Row: Search Input and Green "+ Tambah" Button matching Olsera screenshot */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Cari" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '8px', 
                  padding: '10px 12px 10px 38px', 
                  fontSize: '13px', 
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: '#16a34a', // green matching screenshot
                border: 0, 
                padding: '10px 20px', 
                borderRadius: '8px', 
                fontSize: '13px', 
                fontWeight: 'bold', 
                color: '#ffffff', 
                cursor: 'pointer',
                height: '38px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.15)'
              }}
            >
              <Plus size={16} />
              <span>Tambah</span>
            </button>
          </div>

          <div className="pi-table-card" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <table className="pi-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th 
                    onClick={() => handleSort('no')} 
                    style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>No.</span>
                      <ChevronsUpDown size={14} style={{ color: sortKey === 'no' ? '#0085ca' : '#94a3b8' }} />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('date')} 
                    style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Tanggal</span>
                      <ChevronsUpDown size={14} style={{ color: sortKey === 'date' ? '#0085ca' : '#94a3b8' }} />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('note')} 
                    style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Catatan</span>
                      <ChevronsUpDown size={14} style={{ color: sortKey === 'note' ? '#0085ca' : '#94a3b8' }} />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('status')} 
                    style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Status</span>
                      <ChevronsUpDown size={14} style={{ color: sortKey === 'status' ? '#0085ca' : '#94a3b8' }} />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('receivedBy')} 
                    style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569', cursor: 'pointer', userSelect: 'none' }}
                  >
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
                    <td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center' }}>
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

          {/* Pagination Footer matching Olsera Screenshot */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select 
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', outline: 'none', background: '#ffffff' }}
              >
                <option value={5}>5 Baris</option>
                <option value={10}>10 Baris</option>
                <option value={15}>15 Baris</option>
                <option value={30}>30 Baris</option>
                <option value={50}>50 Baris</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#64748b' }}>
              <span>Total {filteredList.length}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button 
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1} 
                  style={{ background: 'transparent', border: 0, padding: '4px', color: currentPage === 1 ? '#cbd5e1' : '#64748b', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  <ArrowLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <span 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{ 
                      background: currentPage === page ? '#3b82f6' : 'transparent', 
                      color: currentPage === page ? '#ffffff' : '#64748b', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontWeight: 'bold', 
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {page}
                  </span>
                ))}
                <button 
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages} 
                  style={{ background: 'transparent', border: 0, padding: '4px', color: currentPage === totalPages ? '#cbd5e1' : '#64748b', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  <ArrowRight size={16} />
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
                  style={{ width: '40px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px', fontSize: '12px', textAlign: 'center', outline: 'none' }} 
                />
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

      {/* Modal Popup for adding new production */}
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
                style={{ background: '#16a34a', border: 0, borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 'semibold', color: '#ffffff', cursor: 'pointer', boxShadow: '0 2px 4px rgba(22, 163, 74, 0.15)' }}
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
