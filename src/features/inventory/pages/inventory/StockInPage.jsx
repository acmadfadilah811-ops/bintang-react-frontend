import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Calendar, Printer, X, Plus, CloudUpload, Download, Check, ChevronsUpDown, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { PolarBearSvg } from './_shared';
import { stockIncoming } from '../productInventoryData';

export function StockInPage({ onToggleCreate, viewState: propViewState }) {
  const { user } = useAuth();
  const activeUserEmail = user?.email || 'bayumaruf1410@gmail.com';

  const [viewState, setViewState] = useState('list'); // 'list', 'create', 'detail'
  
  useEffect(() => {
    if (propViewState) {
      setViewState(propViewState);
    }
  }, [propViewState]);

  const [showTambahDropdown, setShowTambahDropdown] = useState(false);
  const [showPembelianModal, setShowPembelianModal] = useState(false);

  // Stock List State loaded from LocalStorage
  const [stockList, setStockList] = useState(() => {
    const saved = localStorage.getItem('stock_ins');
    return saved ? JSON.parse(saved) : stockIncoming;
  });
  const [nextDocNumber, setNextDocNumber] = useState(() => {
    const saved = localStorage.getItem('stock_ins_next_num');
    return saved ? parseInt(saved, 10) : 3;
  });

  // Form State
  const [tanggal, setTanggal] = useState('2026-06-25');
  const [catatan, setCatatan] = useState('');
  const [diterimaDari, setDiterimaDari] = useState('');
  const [supplier, setSupplier] = useState('');

  const [searchPembelian, setSearchPembelian] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [searchListQuery, setSearchListQuery] = useState('');

  // Qty Counter State for Detail Product Add
  const [qtyValue, setQtyValue] = useState(1);
  const [productHargaBeli, setProductHargaBeli] = useState('0');

  // Active Detail Document (for Staging / Detail screen)
  const [activeDetailDoc, setActiveDetailDoc] = useState(null);

  // Sort & Pagination State
  const [sortKey, setSortKey] = useState('no');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Inline editing states for Detail Metadata Cards
  const [isEditingTanggal, setIsEditingTanggal] = useState(false);
  const [isEditingCatatan, setIsEditingCatatan] = useState(false);
  const [isEditingDiterimaDari, setIsEditingDiterimaDari] = useState(false);
  const [isEditingSupplier, setIsEditingSupplier] = useState(false);

  // Inline edit input value states
  const [editTanggalValue, setEditTanggalValue] = useState('');
  const [editCatatanValue, setEditCatatanValue] = useState('');
  const [editDiterimaDariValue, setEditDiterimaDariValue] = useState('');
  const [editSupplierValue, setEditSupplierValue] = useState('');

  const [validationError, setValidationError] = useState('');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-06-25');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('custom');

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
    from: 180,
    supplier: 180,
    date: 150,
    note: 180,
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
    localStorage.setItem('stock_ins', JSON.stringify(stockList));
    localStorage.setItem('stock_ins_next_num', nextDocNumber.toString());
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

  // Form creation staging handler
  const handleStageStock = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = new Date(tanggal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    const numStr = String(nextDocNumber).padStart(8, '0');
    const newDocNo = `IN260623${numStr}`;

    const newStagedRecord = {
      no: newDocNo,
      from: diterimaDari || '-',
      supplier: supplier || '-',
      date: formattedDate,
      note: catatan || '-',
      status: 'Draft',
      receivedBy: activeUserEmail
    };

    setActiveDetailDoc(newStagedRecord);
    handleStateChange('detail');

    // Reset inputs
    setTanggal('2026-06-25');
    setCatatan('');
    setDiterimaDari('');
    setSupplier('');
  };

  // Commit document with chosen status and save to local list
  const handleCommitStockIn = (status) => {
    if (status === 'Selesai') {
      const isDateEmpty = !activeDetailDoc.date || activeDetailDoc.date.trim() === '' || activeDetailDoc.date === '-';
      const isNoteEmpty = !activeDetailDoc.note || activeDetailDoc.note.trim() === '' || activeDetailDoc.note === '-';
      const isFromEmpty = !activeDetailDoc.from || activeDetailDoc.from.trim() === '' || activeDetailDoc.from === '-';
      const isSupplierEmpty = !activeDetailDoc.supplier || activeDetailDoc.supplier.trim() === '' || activeDetailDoc.supplier === '-';

      if (isDateEmpty || isNoteEmpty || isFromEmpty || isSupplierEmpty) {
        let missing = [];
        if (isDateEmpty) missing.push('Tanggal');
        if (isNoteEmpty) missing.push('Catatan');
        if (isFromEmpty) missing.push('Diterima Dari');
        if (isSupplierEmpty) missing.push('Supplier');

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

  // Sorting and Filtering logic
  const filteredList = stockList.filter(row => {
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
       row.from.toLowerCase().includes(q) ||
       row.supplier.toLowerCase().includes(q) ||
       row.note.toLowerCase().includes(q))
    );
  });

  const sortedList = [...filteredList].sort((a, b) => {
    let aVal = a[sortKey] || '';
    let bVal = b[sortKey] || '';

    if (sortKey === 'date') {
      // Parse DD-MMM-YYYY format
      const parseDate = (dStr) => {
        const parts = dStr.split('-');
        if (parts.length < 3) return new Date(0);
        const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5, Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11 };
        return new Date(parts[2], months[parts[1]] || 0, parts[0]);
      };
      aVal = parseDate(aVal).getTime();
      bVal = parseDate(bVal).getTime();
    } else {
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalItems = sortedList.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedList = sortedList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Date Range Picker helpers
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

  // inline updates
  const saveInlineTanggal = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = new Date(editTanggalValue);
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const formatted = `${day}-${month}-${year}`;

    setActiveDetailDoc(prev => ({ ...prev, date: formatted }));
    setIsEditingTanggal(false);
  };

  const saveInlineCatatan = () => {
    setActiveDetailDoc(prev => ({ ...prev, note: editCatatanValue || '-' }));
    setIsEditingCatatan(false);
  };

  const saveInlineDiterimaDari = () => {
    setActiveDetailDoc(prev => ({ ...prev, from: editDiterimaDariValue || '-' }));
    setIsEditingDiterimaDari(false);
  };

  const saveInlineSupplier = () => {
    setActiveDetailDoc(prev => ({ ...prev, supplier: editSupplierValue || '-' }));
    setIsEditingSupplier(false);
  };

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

              {/* Export Button - Premium Blue */}
              <button style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', 
                color: '#ffffff', 
                border: 0, 
                padding: '8px 16px', 
                borderRadius: '6px', 
                fontSize: '13px', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)'
              }}>
                <Download size={14} />
                <span>Export</span>
              </button>

              {/* Import Button - Premium Teal */}
              <button style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: 'linear-gradient(135deg, #0f766e, #0d9488)', 
                color: '#ffffff', 
                border: 0, 
                padding: '8px 16px', 
                borderRadius: '6px', 
                fontSize: '13px', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(15, 118, 110, 0.2)'
              }}>
                <CloudUpload size={14} />
                <span>Import</span>
              </button>

              {/* Tambah Dropdown Button - Premium Blue */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowTambahDropdown(!showTambahDropdown)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', 
                    color: '#ffffff', 
                    border: 0, 
                    padding: '8px 16px', 
                    borderRadius: '6px', 
                    fontSize: '13px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)'
                  }}
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
          <div className="pi-category-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div className="pi-category-card-body" style={{ padding: '20px' }}>
              {/* Row: Show / Search */}
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
                    placeholder="Cari No. Stok Masuk" 
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
                      
                      {/* DITERIMA DARI HEADER */}
                      <th 
                        onClick={() => handleSort('from')} 
                        style={{ 
                          width: `${columnWidths.from}px`, 
                          minWidth: `${columnWidths.from}px`,
                          maxWidth: `${columnWidths.from}px`,
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
                          <span>Diterima dari</span>
                          <ChevronsUpDown size={14} style={{ color: sortKey === 'from' ? '#0ea5e9' : '#94a3b8' }} />
                        </div>
                        <div 
                          onMouseDown={(e) => handleResizeStart(e, 'from')}
                          onClick={(e) => e.stopPropagation()}
                          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px', cursor: 'col-resize', zIndex: 20 }}
                          className="pi-resize-handle"
                        />
                      </th>

                      {/* SUPPLIER HEADER */}
                      <th 
                        onClick={() => handleSort('supplier')} 
                        style={{ 
                          width: `${columnWidths.supplier}px`, 
                          minWidth: `${columnWidths.supplier}px`,
                          maxWidth: `${columnWidths.supplier}px`,
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
                          <span>Supplier</span>
                          <ChevronsUpDown size={14} style={{ color: sortKey === 'supplier' ? '#0ea5e9' : '#94a3b8' }} />
                        </div>
                        <div 
                          onMouseDown={(e) => handleResizeStart(e, 'supplier')}
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
                          <td style={{ width: `${columnWidths.from}px`, minWidth: `${columnWidths.from}px`, maxWidth: `${columnWidths.from}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '14px 20px', fontSize: '13px', color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>{row.from}</td>
                          <td style={{ width: `${columnWidths.supplier}px`, minWidth: `${columnWidths.supplier}px`, maxWidth: `${columnWidths.supplier}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '14px 20px', fontSize: '13px', color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>{row.supplier}</td>
                          <td style={{ width: `${columnWidths.date}px`, minWidth: `${columnWidths.date}px`, maxWidth: `${columnWidths.date}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '14px 20px', fontSize: '13px', color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>{row.date}</td>
                          <td style={{ width: `${columnWidths.note}px`, minWidth: `${columnWidths.note}px`, maxWidth: `${columnWidths.note}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '14px 20px', fontSize: '13px', color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>{row.note || '-'}</td>
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
                color: '#64748b' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
          <div className="pi-category-card" style={{ maxWidth: '1200px', margin: '0 auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }}>Tambah Stok Masuk</span>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* Tanggal */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>Tanggal</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', zIndex: 10 }} />
                    <input 
                      type="date" 
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                      style={{ 
                        width: '100%', 
                        border: '1px solid #cbd5e1', 
                        borderRadius: '4px', 
                        padding: '8px 12px 8px 38px', 
                        fontSize: '13px', 
                        outline: 'none', 
                        boxSizing: 'border-box', 
                        color: '#334155',
                        height: '36px'
                      }}
                    />
                  </div>
                </div>

                {/* Catatan */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>Catatan</label>
                  <input 
                    type="text" 
                    placeholder="Masukkan catatan"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    style={{ 
                      width: '100%', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '4px', 
                      padding: '8px 12px', 
                      fontSize: '13px', 
                      outline: 'none', 
                      boxSizing: 'border-box', 
                      color: '#334155',
                      height: '36px'
                    }}
                  />
                </div>

                {/* Diterima Dari */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>Diterima Dari</label>
                  <input 
                    type="text" 
                    placeholder="Masukkan asal pengirim"
                    value={diterimaDari}
                    onChange={(e) => setDiterimaDari(e.target.value)}
                    style={{ 
                      width: '100%', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '4px', 
                      padding: '8px 12px', 
                      fontSize: '13px', 
                      outline: 'none', 
                      boxSizing: 'border-box', 
                      color: '#334155',
                      height: '36px'
                    }}
                  />
                </div>

                {/* Supplier */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>Supplier</label>
                  <input 
                    type="text" 
                    placeholder="Pilih supplier (Autocomplete)"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    style={{ 
                      width: '100%', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '4px', 
                      padding: '8px 12px', 
                      fontSize: '13px', 
                      outline: 'none', 
                      boxSizing: 'border-box', 
                      color: '#334155',
                      height: '36px'
                    }}
                  />
                </div>
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
                  Lanjut tambah stok masuk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATE: detail (Detail/Incoming Add View) */}
      {viewState === 'detail' && activeDetailDoc && (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
          {/* Warning Banner */}
          <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '6px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#b45309', fontSize: '13px' }}>
            <span>ⓘ Pastikan data sudah benar sebelum diposting. Setelah diposting, data tidak diperbolehkan diubah.</span>
          </div>

          {/* Draft Info Header Card */}
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
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>No. Stok Masuk</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginTop: '1px' }}>{activeDetailDoc.no}</span>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 24px' }}>
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

              <button 
                type="button"
                onClick={() => handleCommitStockIn('Draft')}
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
                  boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.2)'
                }}
              >
                <Check size={14} />
                <span>Draft</span>
              </button>

              <button 
                type="button"
                onClick={() => handleCommitStockIn('Batal')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: '#ffffff', 
                  border: '1px solid #fecdd3', 
                  padding: '8px 16px', 
                  borderRadius: '6px', 
                  fontSize: '13px', 
                  fontWeight: 'bold', 
                  color: '#e11d48', 
                  cursor: 'pointer',
                  height: '36px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#fff1f2'}
                onMouseOut={(e) => e.currentTarget.style.background = '#ffffff'}
              >
                <X size={14} />
                <span>Batalkan</span>
              </button>

              <button 
                type="button"
                onClick={() => handleCommitStockIn('Selesai')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', 
                  border: 0, 
                  padding: '8px 20px', 
                  borderRadius: '6px', 
                  fontSize: '13px', 
                  fontWeight: 'bold', 
                  color: '#ffffff', 
                  cursor: 'pointer',
                  height: '36px',
                  boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.3)'
                }}
              >
                <Check size={14} />
                <span>Posting Sekarang</span>
              </button>
            </div>
          </div>

          {/* Sub-card metadata details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Card 1: Tanggal */}
            <div className="pi-category-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Tanggal</span>
                {!isEditingTanggal ? (
                  <button 
                    onClick={() => {
                      const parts = activeDetailDoc.date.split('-');
                      if (parts.length === 3) {
                        const monthsMap = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', Mei: '05', Jun: '06', Jul: '07', Agu: '08', Sep: '09', Okt: '10', Nov: '11', Des: '12' };
                        const year = parts[2];
                        const month = monthsMap[parts[1]] || '01';
                        const day = parts[0];
                        setEditTanggalValue(`${year}-${month}-${day}`);
                      } else {
                        setEditTanggalValue('2026-06-25');
                      }
                      setIsEditingTanggal(true);
                    }}
                    style={{ border: 0, background: 'transparent', color: '#0ea5e9', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Ubah
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={saveInlineTanggal} style={{ border: 0, background: 'transparent', color: '#16a34a', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Simpan</button>
                    <button onClick={() => setIsEditingTanggal(false)} style={{ border: 0, background: 'transparent', color: '#ef4444', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Batal</button>
                  </div>
                )}
              </div>
              <div style={{ padding: '20px' }}>
                {!isEditingTanggal ? (
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{activeDetailDoc.date}</div>
                ) : (
                  <input 
                    type="date"
                    value={editTanggalValue}
                    onChange={(e) => setEditTanggalValue(e.target.value)}
                    style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 8px', fontSize: '13px', outline: 'none' }}
                  />
                )}
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Tanggal buat: {activeDetailDoc.date}</span>
                  <span>Dibuat oleh: {activeDetailDoc.receivedBy}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Diterima Dari & Supplier */}
            <div className="pi-category-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Diterima Dari & Supplier</span>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Diterima Dari row */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>DITERIMA DARI</span>
                    {!isEditingDiterimaDari ? (
                      <button 
                        onClick={() => {
                          setEditDiterimaDariValue(activeDetailDoc.from === '-' ? '' : activeDetailDoc.from);
                          setIsEditingDiterimaDari(true);
                        }}
                        style={{ border: 0, background: 'transparent', color: '#0ea5e9', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Ubah
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={saveInlineDiterimaDari} style={{ border: 0, background: 'transparent', color: '#16a34a', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Simpan</button>
                        <button onClick={() => setIsEditingDiterimaDari(false)} style={{ border: 0, background: 'transparent', color: '#ef4444', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Batal</button>
                      </div>
                    )}
                  </div>
                  {!isEditingDiterimaDari ? (
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: activeDetailDoc.from === '-' ? '#94a3b8' : '#1e293b' }}>
                      {activeDetailDoc.from}
                    </div>
                  ) : (
                    <input 
                      type="text"
                      value={editDiterimaDariValue}
                      onChange={(e) => setEditDiterimaDariValue(e.target.value)}
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 8px', fontSize: '12px', outline: 'none' }}
                    />
                  )}
                </div>

                {/* Supplier row */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>SUPPLIER</span>
                    {!isEditingSupplier ? (
                      <button 
                        onClick={() => {
                          setEditSupplierValue(activeDetailDoc.supplier === '-' ? '' : activeDetailDoc.supplier);
                          setIsEditingSupplier(true);
                        }}
                        style={{ border: 0, background: 'transparent', color: '#0ea5e9', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Ubah
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={saveInlineSupplier} style={{ border: 0, background: 'transparent', color: '#16a34a', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Simpan</button>
                        <button onClick={() => setIsEditingSupplier(false)} style={{ border: 0, background: 'transparent', color: '#ef4444', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Batal</button>
                      </div>
                    )}
                  </div>
                  {!isEditingSupplier ? (
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: activeDetailDoc.supplier === '-' ? '#94a3b8' : '#1e293b' }}>
                      {activeDetailDoc.supplier}
                    </div>
                  ) : (
                    <input 
                      type="text"
                      value={editSupplierValue}
                      onChange={(e) => setEditSupplierValue(e.target.value)}
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 8px', fontSize: '12px', outline: 'none' }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Card 3: Catatan */}
            <div className="pi-category-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Catatan</span>
                {!isEditingCatatan ? (
                  <button 
                    onClick={() => {
                      setEditCatatanValue(activeDetailDoc.note === '-' ? '' : activeDetailDoc.note);
                      setIsEditingCatatan(true);
                    }}
                    style={{ border: 0, background: 'transparent', color: '#0ea5e9', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Ubah
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={saveInlineCatatan} style={{ border: 0, background: 'transparent', color: '#16a34a', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Simpan</button>
                    <button onClick={() => setIsEditingCatatan(false)} style={{ border: 0, background: 'transparent', color: '#ef4444', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Batal</button>
                  </div>
                )}
              </div>
              <div style={{ padding: '20px' }}>
                {!isEditingCatatan ? (
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: activeDetailDoc.note === '-' ? '#94a3b8' : '#1e293b' }}>
                    {activeDetailDoc.note}
                  </div>
                ) : (
                  <input 
                    type="text"
                    value={editCatatanValue}
                    onChange={(e) => setEditCatatanValue(e.target.value)}
                    style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 8px', fontSize: '13px', outline: 'none' }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Staging Product Add Container */}
          <div className="pi-category-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Tambah Produk</span>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 120px auto', gap: '16px', alignItems: 'flex-end', marginBottom: '24px' }}>
                {/* Cari Produk */}
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>Produk</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input 
                      type="text" 
                      placeholder="Cari Produk" 
                      value={searchProduct}
                      onChange={(e) => setSearchProduct(e.target.value)}
                      style={{ 
                        width: '100%', 
                        border: '1px solid #cbd5e1', 
                        borderRadius: '4px', 
                        padding: '8px 10px 8px 30px', 
                        fontSize: '13px', 
                        outline: 'none', 
                        boxSizing: 'border-box',
                        background: '#ffffff',
                        backgroundColor: '#ffffff',
                        height: '36px'
                      }}
                    />
                  </div>
                </div>

                {/* Harga Beli */}
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>Harga Beli</label>
                  <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden', height: '36px', background: '#ffffff', backgroundColor: '#ffffff' }}>
                    <div style={{ background: '#f8fafc', borderRight: '1px solid #cbd5e1', padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                      Rp.
                    </div>
                    <input 
                      type="text" 
                      value={productHargaBeli}
                      onChange={(e) => setProductHargaBeli(e.target.value)}
                      style={{ 
                        border: 0, 
                        outline: 0, 
                        padding: '0 12px', 
                        fontSize: '13px', 
                        flex: 1, 
                        textAlign: 'right', 
                        color: '#334155',
                        background: '#ffffff',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>
                </div>

                {/* Qty Stepper */}
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>Qty</label>
                  <div style={{ 
                    display: 'flex', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '4px', 
                    overflow: 'hidden', 
                    height: '36px', 
                    width: '120px',
                    background: '#ffffff',
                    backgroundColor: '#ffffff'
                  }}>
                    <button 
                      type="button"
                      onClick={() => setQtyValue(prev => Math.max(1, prev - 1))}
                      style={{ border: 0, background: '#f8fafc', width: '32px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', color: '#64748b' }}
                    >
                      -
                    </button>
                    <input 
                      type="text" 
                      value={qtyValue} 
                      onChange={(e) => setQtyValue(parseInt(e.target.value, 10) || 1)}
                      style={{ 
                        border: 0, 
                        borderLeft: '1px solid #cbd5e1', 
                        borderRight: '1px solid #cbd5e1', 
                        textAlign: 'center', 
                        flex: 1, 
                        fontSize: '13px', 
                        color: '#334155', 
                        outline: 'none',
                        background: '#ffffff',
                        backgroundColor: '#ffffff'
                      }} 
                    />
                    <button 
                      type="button"
                      onClick={() => setQtyValue(prev => prev + 1)}
                      style={{ border: 0, background: '#f8fafc', width: '32px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', color: '#64748b' }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Plus Blue Button */}
                <button style={{ background: '#0ea5e9', color: '#ffffff', border: 0, borderRadius: '4px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)' }}>
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

      {/* VALIDATION ERROR MODAL OVERLAY */}
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
