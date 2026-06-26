import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Calendar, Printer, X, Plus, CloudUpload, Download, Check, ChevronsUpDown, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { PolarBearSvg } from './_shared';

export function StockOutPage({ onToggleCreate, viewState: propViewState }) {
  const { user } = useAuth();
  const activeUserEmail = user?.email || '';

  const [viewState, setViewState] = useState('list'); // 'list', 'create', 'detail'
  
  useEffect(() => {
    if (propViewState) {
      setViewState(propViewState);
    }
  }, [propViewState]);
  
  const [createType, setCreateType] = useState('transfer'); // 'transfer' | 'manual'
  const [showTambahDropdown, setShowTambahDropdown] = useState(false);

  // Stock Out List State - empty by default to prevent hardcoded Olsera account data
  const [stockList, setStockList] = useState(() => {
    const saved = localStorage.getItem('stock_outs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse stock_outs', e);
      }
    }
    return [];
  });

  const [nextDocNumber, setNextDocNumber] = useState(() => {
    const saved = localStorage.getItem('stock_outs_next_num');
    return saved ? Number(saved) : 1;
  });

  // Staged document detail state
  const [activeDetailDoc, setActiveDetailDoc] = useState(null);

  // Form State
  const [tanggal, setTanggal] = useState('2026-06-25');
  const [catatan, setCatatan] = useState('');
  const [transferKe, setTransferKe] = useState('');
  const [searchListQuery, setSearchListQuery] = useState('');

  // Date Range state
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-06-25');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('custom');

  // Pagination & Sorting States
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Inline edit toggle states
  const [isEditingTanggal, setIsEditingTanggal] = useState(false);
  const [isEditingCatatan, setIsEditingCatatan] = useState(false);
  const [isEditingAlasan, setIsEditingAlasan] = useState(false);
  const [isEditingTransferKe, setIsEditingTransferKe] = useState(false);

  // Inline edit input value states
  const [editTanggalValue, setEditTanggalValue] = useState('');
  const [editCatatanValue, setEditCatatanValue] = useState('');
  const [editAlasanValue, setEditAlasanValue] = useState('');
  const [editTransferKeValue, setEditTransferKeValue] = useState('');
  const [validationError, setValidationError] = useState('');

  // Table container reference and horizontal scroll handler
  const tableContainerRef = useRef(null);

  const scrollTable = (direction) => {
    if (tableContainerRef.current) {
      const scrollAmount = 180;
      tableContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Draggable resizable columns widths state
  const [columnWidths, setColumnWidths] = useState({
    no: 180,
    transferTo: 180,
    date: 150,
    note: 180,
    reason: 160,
    status: 120,
    receivedBy: 180
  });

  const handleResizeStart = (e, colKey) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[colKey];

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setColumnWidths(prev => ({
        ...prev,
        [colKey]: Math.max(80, startWidth + deltaX)
      }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  useEffect(() => {
    localStorage.setItem('stock_outs', JSON.stringify(stockList));
    localStorage.setItem('stock_outs_next_num', nextDocNumber.toString());
  }, [stockList, nextDocNumber]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchListQuery, pageSize]);

  const handleStateChange = (state) => {
    setViewState(state);
    if (onToggleCreate) {
      onToggleCreate(state);
    }
  };

  // Stage the new stock out without saving to list yet
  const handleStageStock = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = new Date(tanggal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth() % 12];
    const year = d.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    const numStr = String(nextDocNumber).padStart(8, '0');
    const newDocNo = `OG260624${numStr}`;

    const newStagedRecord = {
      no: newDocNo,
      transferTo: createType === 'transfer' ? (transferKe || '-') : '-',
      date: formattedDate,
      note: catatan || '-',
      reason: createType === 'transfer' ? 'Transfer Toko' : 'Manual',
      status: 'Draft',
      receivedBy: activeUserEmail || 'bayumaruf1410@gmail.com'
    };

    setActiveDetailDoc(newStagedRecord);
    handleStateChange('detail');

    // Reset create form inputs
    setTanggal('2026-06-25');
    setCatatan('');
    setTransferKe('');
  };

  // Commit document with chosen status and save to local list
  const handleCommitStockOut = (status) => {
    if (status === 'Selesai') {
      const isTransfer = activeDetailDoc.reason === 'Transfer Toko';
      const isDateEmpty = !activeDetailDoc.date || activeDetailDoc.date.trim() === '' || activeDetailDoc.date === '-';
      const isNoteEmpty = !activeDetailDoc.note || activeDetailDoc.note.trim() === '' || activeDetailDoc.note === '-';
      const isReasonEmpty = !activeDetailDoc.reason || activeDetailDoc.reason.trim() === '' || activeDetailDoc.reason === '-';
      const isTransferEmpty = isTransfer && (!activeDetailDoc.transferTo || activeDetailDoc.transferTo.trim() === '' || activeDetailDoc.transferTo === '-');

      if (isDateEmpty || isNoteEmpty || isReasonEmpty || isTransferEmpty) {
        let missing = [];
        if (isDateEmpty) missing.push('Tanggal');
        if (isNoteEmpty) missing.push('Catatan');
        if (isReasonEmpty) missing.push('Alasan');
        if (isTransferEmpty) missing.push('Transfer Ke');
        
        setValidationError(`Harap isi semua kolom data yang wajib: ${missing.join(', ')} sebelum melakukan posting.`);
        return;
      }
    }

    const finalRecord = { ...activeDetailDoc, status: status };

    const exists = stockList.some(item => item.no === finalRecord.no);
    if (exists) {
      setStockList(stockList.map(item => item.no === finalRecord.no ? finalRecord : item));
    } else {
      setStockList([finalRecord, ...stockList]);
      setNextDocNumber(prev => prev + 1);
    }

    handleStateChange('list');
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const getFormattedRange = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const parse = (dateStr) => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = months[d.getMonth()];
      const year = String(d.getFullYear()).slice(-2);
      return `${day} ${month} ${year}`;
    };
    return `${parse(startDate)} - ${parse(endDate)}`;
  };

  const handleShiftDate = (direction) => {
    setSelectedPreset('custom');
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const shiftDays = direction * diffDays;
    
    const newStart = new Date(start.setDate(start.getDate() + shiftDays));
    const newEnd = new Date(end.setDate(end.getDate() + shiftDays));
    
    const toISO = (d) => d.toISOString().split('T')[0];
    setStartDate(toISO(newStart));
    setEndDate(toISO(newEnd));
  };

  const handlePresetSelect = (preset) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();
    
    switch (preset) {
      case 'today':
        break;
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
        break;
      case 'last7':
        start.setDate(today.getDate() - 6);
        break;
      case 'last30':
        start.setDate(today.getDate() - 29);
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        start = new Date(today.getFullYear() - 1, 0, 1);
        end = new Date(today.getFullYear() - 1, 11, 31);
        break;
      default:
        return;
    }
    
    const toISO = (d) => d.toISOString().split('T')[0];
    setStartDate(toISO(start));
    setEndDate(toISO(end));
    setSelectedPreset(preset);
    
    if (preset !== 'custom') {
      setShowDateDropdown(false);
    }
  };

  // Sort list
  let sortedList = [...stockList];
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
  const filteredStockOut = sortedList.filter(row => {
    const q = searchListQuery.toLowerCase();
    
    // Parse the row date (DD-MMM-YYYY format, e.g. 25-Jun-2026)
    let matchesDate = true;
    if (row.date) {
      const parts = row.date.split('-');
      if (parts.length === 3) {
        const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5, Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11 };
        const rowDate = new Date(parts[2], months[parts[1]] || 0, parts[0]);
        
        // Start and end dates are YYYY-MM-DD
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        matchesDate = rowDate >= start && rowDate <= end;
      }
    }

    return (
      matchesDate &&
      (row.no.toLowerCase().includes(q) ||
       row.transferTo.toLowerCase().includes(q) ||
       (row.note && row.note.toLowerCase().includes(q)))
    );
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredStockOut.length / pageSize) || 1;
  const paginatedList = filteredStockOut.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      {viewState === 'list' && (
        <div style={{ padding: '8px 0' }}>
          {/* Row 1: Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Daftar Stok Keluar</h2>
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'block' }}>{filteredStockOut.length} Stok Keluar</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Date Range Picker */}
              <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', height: '34px', position: 'relative' }}>
                <button 
                  type="button" 
                  onClick={() => handleShiftDate(-1)} 
                  style={{ border: 0, background: 'transparent', padding: '0 10px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', borderTopLeftRadius: '6px', borderBottomLeftRadius: '6px' }}
                >
                  &lt;
                </button>
                <div 
                  onClick={() => setShowDateDropdown(!showDateDropdown)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', fontSize: '13px', color: '#1e293b', fontWeight: '500', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', height: '100%', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Calendar size={14} style={{ color: '#64748b' }} />
                  <span>{getFormattedRange()}</span>
                  <ChevronDown size={12} style={{ color: '#64748b' }} />
                </div>
                <button 
                  type="button" 
                  onClick={() => handleShiftDate(1)} 
                  style={{ border: 0, background: 'transparent', padding: '0 10px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', borderTopRightRadius: '6px', borderBottomRightRadius: '6px' }}
                >
                  &gt;
                </button>

                {showDateDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '40px',
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    padding: '8px 0',
                    zIndex: 1000,
                    width: '200px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {[
                      { id: 'today', label: 'Today' },
                      { id: 'yesterday', label: 'Yesterday' },
                      { id: 'last7', label: 'Last 7 Days' },
                      { id: 'last30', label: 'Last 30 Days' },
                      { id: 'thisMonth', label: 'This Month' },
                      { id: 'lastMonth', label: 'Last Month' },
                      { id: 'thisYear', label: 'This Year' },
                      { id: 'lastYear', label: 'Last Year' },
                      { id: 'custom', label: 'Custom Range' }
                    ].map((item) => {
                      const isSelected = selectedPreset === item.id;
                      return (
                        <div key={item.id}>
                          <button
                            type="button"
                            onClick={() => {
                              if (item.id === 'custom') {
                                setSelectedPreset('custom');
                              } else {
                                handlePresetSelect(item.id);
                              }
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              border: 0,
                              background: isSelected ? '#0ea5e9' : 'transparent',
                              color: isSelected ? '#ffffff' : '#334155',
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: isSelected ? 'bold' : 'normal',
                              cursor: 'pointer',
                              transition: 'background 0.2s, color 0.2s',
                              display: 'block'
                            }}
                            onMouseOver={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = '#f1f5f9';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = 'transparent';
                              }
                            }}
                          >
                            {item.label}
                          </button>
                          
                          {item.id === 'custom' && selectedPreset === 'custom' && (
                            <div style={{
                              padding: '12px 16px',
                              borderTop: '1px solid #e2e8f0',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              background: '#f8fafc'
                            }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '2px' }}>Mulai Dari</label>
                                <input 
                                  type="date" 
                                  value={startDate}
                                  onChange={(e) => setStartDate(e.target.value)}
                                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 6px', fontSize: '12px', outline: 'none' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '2px' }}>Sampai Dengan</label>
                                <input 
                                  type="date" 
                                  value={endDate}
                                  onChange={(e) => setEndDate(e.target.value)}
                                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 6px', fontSize: '12px', outline: 'none' }}
                                />
                              </div>
                              <button 
                                type="button"
                                onClick={() => setShowDateDropdown(false)}
                                style={{ background: '#0ea5e9', color: '#ffffff', border: 0, borderRadius: '4px', padding: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s', marginTop: '4px', width: '100%' }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#0284c7'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#0ea5e9'}
                              >
                                Terapkan
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Export Button - PREMIUM Bronze/Amber Gold Gradient */}
              <button 
                type="button"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: 'linear-gradient(135deg, #d97706, #b45309)', 
                  color: '#ffffff', 
                  border: 0, 
                  padding: '0 16px', 
                  borderRadius: '6px', 
                  fontSize: '13px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  height: '34px',
                  boxShadow: '0 2px 6px rgba(180, 83, 9, 0.25)',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                <Download size={14} />
                <span>Export</span>
              </button>

              {/* Import Button - PREMIUM Emerald Teal Gradient */}
              <button 
                type="button"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: 'linear-gradient(135deg, #0d9488, #0f766e)', 
                  color: '#ffffff', 
                  border: 0, 
                  padding: '0 16px', 
                  borderRadius: '6px', 
                  fontSize: '13px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  height: '34px',
                  boxShadow: '0 2px 6px rgba(15, 118, 110, 0.25)',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                <CloudUpload size={14} />
                <span>Import</span>
              </button>

              {/* Tambah Dropdown Button - PREMIUM Indigo/Cobalt Gradient */}
              <div style={{ position: 'relative' }}>
                <button 
                  type="button"
                  onClick={() => setShowTambahDropdown(!showTambahDropdown)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    background: 'linear-gradient(135deg, #4f46e5, #4338ca)', 
                    color: '#ffffff', 
                    border: 0, 
                    padding: '0 16px', 
                    borderRadius: '6px', 
                    fontSize: '13px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer',
                    height: '34px',
                    boxShadow: '0 2px 6px rgba(67, 56, 202, 0.25)',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
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
                    <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', width: '200px', zIndex: 999, overflow: 'hidden' }}>
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

          {/* Row 2: Select Row Count & Search Input */}
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
                placeholder="Cari No. Stok Keluar" 
                value={searchListQuery}
                onChange={(e) => setSearchListQuery(e.target.value)}
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

          {/* Table Container - WITH RESIZABLE COLUMNS AND HORIZONTAL SCROLLSIDEWAY & VERTICAL DIVIDERS */}
          <div 
            ref={tableContainerRef}
            className="pi-table-scroll-container"
            style={{ 
              overflowX: 'scroll', 
              width: '100%', 
              marginTop: '8px', 
              border: '1px solid #e2e8f0',
              borderRadius: '6px 6px 0 0'
            }}
          >
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              textAlign: 'left', 
              tableLayout: 'fixed',
              border: 'none' 
            }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {/* NO HEADER */}
                  <th 
                    onClick={() => handleSort('no')} 
                    style={{ 
                      width: `${columnWidths.no}px`, 
                      minWidth: `${columnWidths.no}px`,
                      maxWidth: `${columnWidths.no}px`,
                      padding: '14px 20px', 
                      fontSize: '13px', 
                      fontWeight: 'bold', 
                      color: '#475569', 
                      cursor: 'pointer', 
                      userSelect: 'none', 
                      borderBottom: '1px solid #e2e8f0', 
                      borderTop: '1px solid #e2e8f0',
                      borderRight: '1px solid #e2e8f0',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>No.</span>
                      <ChevronsUpDown size={14} style={{ color: sortKey === 'no' ? '#0ea5e9' : '#94a3b8' }} />
                    </div>
                    <div 
                      onMouseDown={(e) => handleResizeStart(e, 'no')}
                      onClick={(e) => e.stopPropagation()}
                      style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px', cursor: 'col-resize', zIndex: 20 }}
                      className="pi-resize-handle"
                    />
                  </th>
                  
                  {/* TRANSFER TO HEADER */}
                  <th 
                    onClick={() => handleSort('transferTo')} 
                    style={{ 
                      width: `${columnWidths.transferTo}px`, 
                      minWidth: `${columnWidths.transferTo}px`,
                      maxWidth: `${columnWidths.transferTo}px`,
                      padding: '14px 20px', 
                      fontSize: '13px', 
                      fontWeight: 'bold', 
                      color: '#475569', 
                      cursor: 'pointer', 
                      userSelect: 'none', 
                      borderBottom: '1px solid #e2e8f0', 
                      borderTop: '1px solid #e2e8f0',
                      borderRight: '1px solid #e2e8f0',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Transfer ke</span>
                      <ChevronsUpDown size={14} style={{ color: sortKey === 'transferTo' ? '#0ea5e9' : '#94a3b8' }} />
                    </div>
                    <div 
                      onMouseDown={(e) => handleResizeStart(e, 'transferTo')}
                      onClick={(e) => e.stopPropagation()}
                      style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px', cursor: 'col-resize', zIndex: 20 }}
                      className="pi-resize-handle"
                    />
                  </th>

                  {/* DATE HEADER */}
                  <th 
                    onClick={() => handleSort('date')} 
                    style={{ 
                      width: `${columnWidths.date}px`, 
                      minWidth: `${columnWidths.date}px`,
                      maxWidth: `${columnWidths.date}px`,
                      padding: '14px 20px', 
                      fontSize: '13px', 
                      fontWeight: 'bold', 
                      color: '#475569', 
                      cursor: 'pointer', 
                      userSelect: 'none', 
                      borderBottom: '1px solid #e2e8f0', 
                      borderTop: '1px solid #e2e8f0',
                      borderRight: '1px solid #e2e8f0',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Tanggal</span>
                      <ChevronsUpDown size={14} style={{ color: sortKey === 'date' ? '#0ea5e9' : '#94a3b8' }} />
                    </div>
                    <div 
                      onMouseDown={(e) => handleResizeStart(e, 'date')}
                      onClick={(e) => e.stopPropagation()}
                      style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px', cursor: 'col-resize', zIndex: 20 }}
                      className="pi-resize-handle"
                    />
                  </th>

                  {/* NOTE HEADER */}
                  <th 
                    onClick={() => handleSort('note')} 
                    style={{ 
                      width: `${columnWidths.note}px`, 
                      minWidth: `${columnWidths.note}px`,
                      maxWidth: `${columnWidths.note}px`,
                      padding: '14px 20px', 
                      fontSize: '13px', 
                      fontWeight: 'bold', 
                      color: '#475569', 
                      cursor: 'pointer', 
                      userSelect: 'none', 
                      borderBottom: '1px solid #e2e8f0', 
                      borderTop: '1px solid #e2e8f0',
                      borderRight: '1px solid #e2e8f0',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Catatan</span>
                      <ChevronsUpDown size={14} style={{ color: sortKey === 'note' ? '#0ea5e9' : '#94a3b8' }} />
                    </div>
                    <div 
                      onMouseDown={(e) => handleResizeStart(e, 'note')}
                      onClick={(e) => e.stopPropagation()}
                      style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px', cursor: 'col-resize', zIndex: 20 }}
                      className="pi-resize-handle"
                    />
                  </th>

                  {/* REASON HEADER */}
                  <th 
                    onClick={() => handleSort('reason')} 
                    style={{ 
                      width: `${columnWidths.reason}px`, 
                      minWidth: `${columnWidths.reason}px`,
                      maxWidth: `${columnWidths.reason}px`,
                      padding: '14px 20px', 
                      fontSize: '13px', 
                      fontWeight: 'bold', 
                      color: '#475569', 
                      cursor: 'pointer', 
                      userSelect: 'none', 
                      borderBottom: '1px solid #e2e8f0', 
                      borderTop: '1px solid #e2e8f0',
                      borderRight: '1px solid #e2e8f0',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Alasan</span>
                      <ChevronsUpDown size={14} style={{ color: sortKey === 'reason' ? '#0ea5e9' : '#94a3b8' }} />
                    </div>
                    <div 
                      onMouseDown={(e) => handleResizeStart(e, 'reason')}
                      onClick={(e) => e.stopPropagation()}
                      style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px', cursor: 'col-resize', zIndex: 20 }}
                      className="pi-resize-handle"
                    />
                  </th>

                  {/* STATUS HEADER */}
                  <th 
                    onClick={() => handleSort('status')} 
                    style={{ 
                      width: `${columnWidths.status}px`, 
                      minWidth: `${columnWidths.status}px`,
                      maxWidth: `${columnWidths.status}px`,
                      padding: '14px 20px', 
                      fontSize: '13px', 
                      fontWeight: 'bold', 
                      color: '#475569', 
                      cursor: 'pointer', 
                      userSelect: 'none', 
                      borderBottom: '1px solid #e2e8f0', 
                      borderTop: '1px solid #e2e8f0',
                      borderRight: '1px solid #e2e8f0',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Status</span>
                      <ChevronsUpDown size={14} style={{ color: sortKey === 'status' ? '#0ea5e9' : '#94a3b8' }} />
                    </div>
                    <div 
                      onMouseDown={(e) => handleResizeStart(e, 'status')}
                      onClick={(e) => e.stopPropagation()}
                      style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px', cursor: 'col-resize', zIndex: 20 }}
                      className="pi-resize-handle"
                    />
                  </th>

                  {/* RECEIVED BY HEADER */}
                  <th 
                    onClick={() => handleSort('receivedBy')} 
                    style={{ 
                      width: `${columnWidths.receivedBy}px`, 
                      minWidth: `${columnWidths.receivedBy}px`,
                      maxWidth: `${columnWidths.receivedBy}px`,
                      padding: '14px 20px', 
                      fontSize: '13px', 
                      fontWeight: 'bold', 
                      color: '#475569', 
                      cursor: 'pointer', 
                      userSelect: 'none', 
                      borderBottom: '1px solid #e2e8f0', 
                      borderTop: '1px solid #e2e8f0',
                      borderRight: '1px solid #e2e8f0',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Diterima Oleh</span>
                      <ChevronsUpDown size={14} style={{ color: sortKey === 'receivedBy' ? '#0ea5e9' : '#94a3b8' }} />
                    </div>
                    <div 
                      onMouseDown={(e) => handleResizeStart(e, 'receivedBy')}
                      onClick={(e) => e.stopPropagation()}
                      style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px', cursor: 'col-resize', zIndex: 20 }}
                      className="pi-resize-handle"
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
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
                      style={{ cursor: 'default' }}
                      className="pi-table-row-hover"
                    >
                      <td 
                        onClick={() => {
                          setActiveDetailDoc(row);
                          handleStateChange('detail');
                        }}
                        style={{ 
                          width: `${columnWidths.no}px`, 
                          minWidth: `${columnWidths.no}px`, 
                          maxWidth: `${columnWidths.no}px`, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap', 
                          padding: '14px 20px', 
                          fontSize: '13px', 
                          fontWeight: 'semibold', 
                          color: '#0ea5e9', 
                          cursor: 'pointer', 
                          borderBottom: '1px solid #e2e8f0', 
                          borderRight: '1px solid #e2e8f0' 
                        }}
                        onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                      >
                        {row.no}
                      </td>
                      <td style={{ width: `${columnWidths.transferTo}px`, minWidth: `${columnWidths.transferTo}px`, maxWidth: `${columnWidths.transferTo}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '14px 20px', fontSize: '13px', color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>{row.transferTo}</td>
                      <td style={{ width: `${columnWidths.date}px`, minWidth: `${columnWidths.date}px`, maxWidth: `${columnWidths.date}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '14px 20px', fontSize: '13px', color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>{row.date}</td>
                      <td style={{ width: `${columnWidths.note}px`, minWidth: `${columnWidths.note}px`, maxWidth: `${columnWidths.note}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '14px 20px', fontSize: '13px', color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>{row.note || '-'}</td>
                      <td style={{ width: `${columnWidths.reason}px`, minWidth: `${columnWidths.reason}px`, maxWidth: `${columnWidths.reason}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '14px 20px', fontSize: '13px', color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>{row.reason}</td>
                      <td style={{ width: `${columnWidths.status}px`, minWidth: `${columnWidths.status}px`, maxWidth: `${columnWidths.status}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '14px 20px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                        <span style={{ 
                          background: row.status === 'Draf' || row.status === 'Draft' ? '#ffedd5' : row.status === 'Selesai' ? '#dcfce7' : '#fee2e2', 
                          color: row.status === 'Draf' || row.status === 'Draft' ? '#ea580c' : row.status === 'Selesai' ? '#16a34a' : '#dc2626', 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '11px', 
                          fontWeight: 'bold' 
                        }}>{row.status}</span>
                      </td>
                      <td style={{ width: `${columnWidths.receivedBy}px`, minWidth: `${columnWidths.receivedBy}px`, maxWidth: `${columnWidths.receivedBy}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '14px 20px', fontSize: '13px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>{row.receivedBy || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Horizontal Scroll Controls at the bottom of the table */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderTop: 0, borderRadius: '0 0 6px 6px', padding: '6px 12px', gap: '8px', marginBottom: '16px' }}>
            <button 
              type="button"
              onClick={() => scrollTable('left')}
              style={{
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                borderRadius: '4px',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '10px',
                color: '#64748b'
              }}
            >
              ◀
            </button>
            <div style={{ flex: 1, height: '4px', background: '#e2e8f0', borderRadius: '2px' }} />
            <button 
              type="button"
              onClick={() => scrollTable('right')}
              style={{
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                borderRadius: '4px',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '10px',
                color: '#64748b'
              }}
            >
              ▶
            </button>
          </div>

          {/* Pagination Footer */}
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
        </div>
      )}

      {/* STATE: create */}
      {viewState === 'create' && (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
          <div className="pi-category-card" style={{ maxWidth: '1200px', margin: '0 auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }}>Tambah Stok Keluar</span>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>Tanggal</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="date"
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                      style={{ 
                        width: '100%', 
                        border: '1px solid #cbd5e1', 
                        borderRadius: '4px', 
                        padding: '8px 12px', 
                        fontSize: '13px', 
                        color: '#334155', 
                        outline: 'none', 
                        boxSizing: 'border-box',
                        height: '36px'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>Catatan</label>
                  <input 
                    type="text"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    style={{ 
                      width: '100%', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '4px', 
                      padding: '8px 12px', 
                      fontSize: '13px', 
                      color: '#334155', 
                      outline: 'none', 
                      boxSizing: 'border-box',
                      height: '36px'
                    }}
                  />
                </div>

                {createType === 'transfer' && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>Transfer ke</label>
                    <input 
                      type="text"
                      placeholder="Pilih toko (Autocomplete)"
                      value={transferKe}
                      onChange={(e) => setTransferKe(e.target.value)}
                      style={{ 
                        width: '100%', 
                        border: '1px solid #cbd5e1', 
                        borderRadius: '4px', 
                        padding: '8px 12px', 
                        fontSize: '13px', 
                        color: '#334155', 
                        outline: 'none', 
                        boxSizing: 'border-box',
                        height: '36px'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <button 
                  onClick={() => handleStateChange('list')}
                  style={{ 
                    background: '#ffffff', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '4px', 
                    padding: '8px 20px', 
                    fontSize: '13px', 
                    fontWeight: 'bold', 
                    color: '#475569', 
                    cursor: 'pointer',
                    height: '36px'
                  }}
                >
                  Batal
                </button>
                <button 
                  onClick={handleStageStock}
                  style={{ 
                    background: '#0ea5e9', 
                    border: 0, 
                    borderRadius: '4px', 
                    padding: '8px 24px', 
                    fontSize: '13px', 
                    fontWeight: 'bold', 
                    color: '#ffffff', 
                    cursor: 'pointer',
                    height: '36px'
                  }}
                >
                  Lanjut tambah stok keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATE: detail */}
      {viewState === 'detail' && activeDetailDoc && (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
          {/* Top Header Card with vertical status badge and right controls */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'stretch', 
            background: '#ffffff', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px', 
            marginBottom: '20px',
            overflow: 'hidden',
            minHeight: '80px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            {/* Left Status Block */}
            <div style={{ 
              background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', 
              borderRight: '1px solid #fed7aa', 
              padding: '16px 28px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#c2410c',
              gap: '4px',
              minWidth: '95px'
            }}>
              <span style={{ fontSize: '20px', lineHeight: 1 }}>📄</span>
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{activeDetailDoc.status}</span>
            </div>

            {/* Center Title and Back Button */}
            <div style={{ flex: 1, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={() => handleStateChange('list')}
                title="Kembali ke Daftar"
                style={{ 
                  border: 0, 
                  background: '#f1f5f9', 
                  color: '#64748b', 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
              >
                <ArrowLeft size={16} />
              </button>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>No. Stok Keluar</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginTop: '1px' }}>{activeDetailDoc.no}</span>
              </div>
            </div>

            {/* Right Action Buttons with Premium Gradients and soft visuals */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 24px' }}>
              {/* Cetak Dropdown */}
              <button 
                type="button"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: '#ffffff', 
                  border: '1px solid #cbd5e1', 
                  padding: '8px 14px', 
                  borderRadius: '6px', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: '#475569', 
                  cursor: 'pointer',
                  height: '36px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseOut={(e) => e.currentTarget.style.background = '#ffffff'}
              >
                <Printer size={14} />
                <span>Cetak</span>
                <ChevronDown size={12} />
              </button>

              {/* Draft Status Button */}
              <button 
                type="button"
                onClick={() => handleCommitStockOut('Draft')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: 'linear-gradient(135deg, #f97316, #ea580c)', 
                  border: 0, 
                  padding: '8px 16px', 
                  borderRadius: '6px', 
                  fontSize: '13px', 
                  fontWeight: 'bold', 
                  color: '#ffffff', 
                  cursor: 'pointer',
                  height: '36px',
                  boxShadow: '0 2px 4px rgba(234, 88, 12, 0.15)',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                <span>📄</span>
                <span>Draf</span>
              </button>

              {/* Batalkan Button */}
              <button 
                type="button"
                onClick={() => handleCommitStockOut('Batal')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', 
                  border: 0, 
                  padding: '8px 16px', 
                  borderRadius: '6px', 
                  fontSize: '13px', 
                  fontWeight: 'bold', 
                  color: '#ffffff', 
                  cursor: 'pointer',
                  height: '36px',
                  boxShadow: '0 2px 4px rgba(2, 132, 199, 0.15)',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                <X size={14} />
                <span>Batalkan</span>
              </button>

              {/* Posting Sekarang Button */}
              <button 
                type="button"
                onClick={() => handleCommitStockOut('Selesai')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: 'linear-gradient(135deg, #10b981, #059669)', 
                  border: 0, 
                  padding: '8px 16px', 
                  borderRadius: '6px', 
                  fontSize: '13px', 
                  fontWeight: 'bold', 
                  color: '#ffffff', 
                  cursor: 'pointer',
                  height: '36px',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.15)',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                <Check size={14} />
                <span>Posting Sekarang</span>
              </button>
            </div>
          </div>

          {/* Sub-card metadata details (4 columns) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Tanggal Box */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>Tanggal</span>
                {!isEditingTanggal && (
                  <button 
                    onClick={() => {
                      setEditTanggalValue('2026-06-25');
                      setIsEditingTanggal(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f0f9ff', color: '#0284c7', border: '1px solid #e0f2fe', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}
                    className="pi-edit-btn-hover"
                  >
                    <span>✏️</span>
                    <span>Ubah</span>
                  </button>
                )}
              </div>
              <div style={{ padding: '16px' }}>
                {isEditingTanggal ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="date" 
                      value={editTanggalValue} 
                      onChange={(e) => setEditTanggalValue(e.target.value)} 
                      style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', fontSize: '13px', outline: 'none', height: '28px', color: '#334155' }}
                    />
                    <button 
                      onClick={() => {
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                        const d = new Date(editTanggalValue);
                        if (!isNaN(d.getTime())) {
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = months[d.getMonth() % 12];
                          const year = d.getFullYear();
                          const formattedDate = `${day}-${month}-${year}`;
                          
                          const updated = { ...activeDetailDoc, date: formattedDate };
                          setActiveDetailDoc(updated);
                          if (stockList.some(item => item.no === updated.no)) {
                            setStockList(stockList.map(item => item.no === updated.no ? updated : item));
                          }
                        }
                        setIsEditingTanggal(false);
                      }}
                      style={{ background: '#10b981', color: '#ffffff', border: 0, borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Simpan"
                    >
                      ✓
                    </button>
                    <button 
                      onClick={() => setIsEditingTanggal(false)}
                      style={{ background: '#ef4444', color: '#ffffff', border: 0, borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Batal"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{activeDetailDoc.date}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>{activeUserEmail || 'bayumaruf1410@gmail.com'}</div>
                  </>
                )}
              </div>
            </div>

            {/* Transfer ke Box */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>Transfer ke</span>
                {!isEditingTransferKe && (
                  <button 
                    onClick={() => {
                      setEditTransferKeValue(activeDetailDoc.transferTo || '-');
                      setIsEditingTransferKe(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f0f9ff', color: '#0284c7', border: '1px solid #e0f2fe', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}
                    className="pi-edit-btn-hover"
                  >
                    <span>✏️</span>
                    <span>Ubah</span>
                  </button>
                )}
              </div>
              <div style={{ padding: '16px' }}>
                {isEditingTransferKe ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="text" 
                      value={editTransferKeValue} 
                      onChange={(e) => setEditTransferKeValue(e.target.value)} 
                      style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', fontSize: '13px', outline: 'none', height: '28px', color: '#334155', width: '100px' }}
                    />
                    <button 
                      onClick={() => {
                        const updated = { ...activeDetailDoc, transferTo: editTransferKeValue || '-' };
                        setActiveDetailDoc(updated);
                        if (stockList.some(item => item.no === updated.no)) {
                          setStockList(stockList.map(item => item.no === updated.no ? updated : item));
                        }
                        setIsEditingTransferKe(false);
                      }}
                      style={{ background: '#10b981', color: '#ffffff', border: 0, borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Simpan"
                    >
                      ✓
                    </button>
                    <button 
                      onClick={() => setIsEditingTransferKe(false)}
                      style={{ background: '#ef4444', color: '#ffffff', border: 0, borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Batal"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{activeDetailDoc.transferTo || '-'}</div>
                )}
              </div>
            </div>

            {/* Catatan Box */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>Catatan</span>
                {!isEditingCatatan && (
                  <button 
                    onClick={() => {
                      setEditCatatanValue(activeDetailDoc.note || '-');
                      setIsEditingCatatan(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f0f9ff', color: '#0284c7', border: '1px solid #e0f2fe', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}
                    className="pi-edit-btn-hover"
                  >
                    <span>✏️</span>
                    <span>Ubah</span>
                  </button>
                )}
              </div>
              <div style={{ padding: '16px' }}>
                {isEditingCatatan ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="text" 
                      value={editCatatanValue} 
                      onChange={(e) => setEditCatatanValue(e.target.value)} 
                      style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', fontSize: '13px', outline: 'none', height: '28px', color: '#334155', width: '100px' }}
                    />
                    <button 
                      onClick={() => {
                        const updated = { ...activeDetailDoc, note: editCatatanValue || '-' };
                        setActiveDetailDoc(updated);
                        if (stockList.some(item => item.no === updated.no)) {
                          setStockList(stockList.map(item => item.no === updated.no ? updated : item));
                        }
                        setIsEditingCatatan(false);
                      }}
                      style={{ background: '#10b981', color: '#ffffff', border: 0, borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Simpan"
                    >
                      ✓
                    </button>
                    <button 
                      onClick={() => setIsEditingCatatan(false)}
                      style={{ background: '#ef4444', color: '#ffffff', border: 0, borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Batal"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{activeDetailDoc.note || '-'}</div>
                )}
              </div>
            </div>

            {/* Alasan Box */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>Alasan</span>
                {!isEditingAlasan && (
                  <button 
                    onClick={() => {
                      setEditAlasanValue(activeDetailDoc.reason || '-');
                      setIsEditingAlasan(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f0f9ff', color: '#0284c7', border: '1px solid #e0f2fe', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}
                    className="pi-edit-btn-hover"
                  >
                    <span>✏️</span>
                    <span>Ubah</span>
                  </button>
                )}
              </div>
              <div style={{ padding: '16px' }}>
                {isEditingAlasan ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="text" 
                      value={editAlasanValue} 
                      onChange={(e) => setEditAlasanValue(e.target.value)} 
                      style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', fontSize: '13px', outline: 'none', height: '28px', color: '#334155', width: '100px' }}
                    />
                    <button 
                      onClick={() => {
                        const updated = { ...activeDetailDoc, reason: editAlasanValue || '-' };
                        setActiveDetailDoc(updated);
                        if (stockList.some(item => item.no === updated.no)) {
                          setStockList(stockList.map(item => item.no === updated.no ? updated : item));
                        }
                        setIsEditingAlasan(false);
                      }}
                      style={{ background: '#10b981', color: '#ffffff', border: 0, borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Simpan"
                    >
                      ✓
                    </button>
                    <button 
                      onClick={() => setIsEditingAlasan(false)}
                      style={{ background: '#ef4444', color: '#ffffff', border: 0, borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Batal"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{activeDetailDoc.reason || '-'}</div>
                )}
              </div>
            </div>
          </div>
          {/* Produk Stok Keluar Card */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            {/* Header bar matching the blue title bar of Olsera screenshot */}
            <div style={{ 
              padding: '12px 20px', 
              background: '#0ea5e9', 
              color: '#ffffff', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Produk Stok Keluar (0)</span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Qty Box */}
                <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden', height: '30px', width: '80px' }}>
                  <input 
                    type="number" 
                    defaultValue={1}
                    style={{ width: '40px', border: 0, outline: 'none', padding: '0 8px', fontSize: '13px', color: '#1e293b', textAlign: 'left', background: '#ffffff' }} 
                  />
                  <div style={{ borderLeft: '1px solid #cbd5e1', padding: '0 8px', fontSize: '11px', color: '#94a3b8', background: '#f8fafc', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Qty</div>
                </div>

                {/* Cari Produk */}
                <div style={{ position: 'relative', width: '250px' }}>
                  <Search size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    placeholder="Cari Produk" 
                    style={{ 
                      width: '100%', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '4px', 
                      padding: '6px 10px 6px 30px', 
                      fontSize: '13px', 
                      outline: 'none', 
                      boxSizing: 'border-box',
                      height: '30px',
                      color: '#334155',
                      background: '#ffffff',
                      backgroundColor: '#ffffff'
                    }} 
                  />
                </div>
              </div>
            </div>
            
            <div style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {/* Center aligned polar bear illustration with no text */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <PolarBearSvg />
              </div>
            </div>
          </div>
        </div>
      )}

      {validationError && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '440px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #fee2e2',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              fontSize: '24px'
            }}>
              ⚠️
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>Gagal Posting</h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', marginBottom: '20px' }}>
              {validationError}
            </p>
            <button 
              onClick={() => setValidationError('')}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                border: 0,
                borderRadius: '6px',
                padding: '10px 24px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                width: '100%',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
              onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
