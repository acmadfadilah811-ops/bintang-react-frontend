import { useState, useEffect, useMemo } from 'react';
import { Search, Trash2, Printer, ChevronDown } from 'lucide-react';
import { productRows, formatCurrency } from '../productInventoryData';

const defaultSettings = {
  marginTop: 10,
  marginBottom: 10,
  marginLeft: 10,
  marginRight: 10,
  paperWidth: 210,
  labelsPerLine: 2,
  padding: 12,
  labelWidth: 150,
  labelHeight: 90,
  useAltName: true,
  showBarcode: true,
  showWeight: true,
  storeName: 'Bintang Advertising'
};

const EmptyStateIllustration = () => (
  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="54" fill="#f0f9ff" />
      {/* T-shirt with collar and sleeve fold lines */}
      <path d="M 42,32 C 48,37 72,37 78,32 L 92,37 L 88,52 L 78,48 L 78,86 L 42,86 L 42,48 L 32,52 L 28,37 Z" fill="#7dd3fc" />
      <path d="M 48,32 C 52,35 68,35 72,32" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Sneaker with white sole and laces */}
      <path d="M 58,74 C 56,66 63,60 68,60 C 72,60 74,63 77,65 C 81,63 85,67 88,71 L 96,73 C 99,74 99,80 96,82 L 60,82 C 58,82 58,78 58,74 Z" fill="#0284c7" />
      <path d="M 60,80 L 96,80 C 97.5,80 97.5,83 96,83 L 60,83 C 58.5,83 58.5,80 60,80 Z" fill="#ffffff" />
      <path d="M 72,65 L 75,69 M 75,63 L 78,67" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </div>
);

export function PriceLabelProductsPage() {
  const [searchType, setSearchType] = useState('SKU');
  const [searchVal, setSearchVal] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);

  // Load settings from local storage
  useEffect(() => {
    const saved = localStorage.getItem('price_label_settings');
    if (saved) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch (e) {
        console.error('Failed to parse price_label_settings', e);
      }
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.search-container-group')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter products based on search inputs
  const filteredProducts = useMemo(() => {
    return productRows.filter(prod => {
      const val = searchVal.toLowerCase();
      if (searchType === 'SKU') {
        return (prod.sku || '').toLowerCase().includes(val);
      } else {
        return (prod.name || '').toLowerCase().includes(val);
      }
    });
  }, [searchVal, searchType]);

  const handleSelectProduct = (product) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setSearchVal('');
    setShowDropdown(false);
  };

  const handleQtyChange = (productId, qty) => {
    setSelectedProducts(prev => 
      prev.map(p => p.id === productId ? { ...p, qty: Math.max(1, parseInt(qty) || 1) } : p)
    );
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const labelsToRender = useMemo(() => {
    const list = [];
    selectedProducts.forEach(p => {
      for (let i = 0; i < p.qty; i++) {
        list.push(p);
      }
    });
    return list;
  }, [selectedProducts]);

  const handlePrint = () => {
    if (labelsToRender.length === 0) return;
    
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #printable-labels-area, #printable-labels-area * {
          visibility: visible;
        }
        #printable-labels-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: white !important;
          padding: 0 !important;
          margin: 0 !important;
        }
      }
    `;
    document.head.appendChild(styleEl);
    window.print();
    document.head.removeChild(styleEl);
  };

  const hasSelected = selectedProducts.length > 0;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Left Column: Search and selected products */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', minHeight: '380px' }}>
          {/* Combined Search bar input group */}
          <div className="search-container-group" style={{ display: 'flex', width: '100%', marginBottom: '16px', position: 'relative' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select 
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRight: 0,
                  borderTopLeftRadius: '8px',
                  borderBottomLeftRadius: '8px',
                  padding: '0 28px 0 12px',
                  background: '#f8fafc',
                  color: '#475569',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer',
                  height: '38px',
                  appearance: 'none'
                }}
              >
                <option value="SKU">SKU</option>
                <option value="Nama">Nama</option>
              </select>
              <ChevronDown size={12} style={{ position: 'absolute', right: '10px', color: '#64748b', pointerEvents: 'none' }} />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderTopRightRadius: '8px', borderBottomRightRadius: '8px', padding: '0 12px', background: '#ffffff', flex: 1, height: '38px' }}>
              <Search size={16} style={{ color: '#94a3b8', marginRight: '8px' }} />
              <input 
                type="text"
                placeholder="Pilih Produk"
                value={searchVal}
                onChange={(e) => {
                  setSearchVal(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                style={{ width: '100%', border: 0, outline: 'none', fontSize: '13px', color: '#1f2937' }}
              />
            </div>

            {/* Dropdown Suggestions */}
            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: '40px',
                left: 0,
                right: 0,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                maxHeight: '220px',
                overflowY: 'auto'
              }}>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(prod => (
                    <div 
                      key={prod.id}
                      onClick={() => handleSelectProduct(prod)}
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>{prod.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>SKU: {prod.sku}</div>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0284c7' }}>
                        {formatCurrency(prod.storePrice)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                    Produk tidak ditemukan
                  </div>
                )}
              </div>
            )}
          </div>

          {/* List or Empty State */}
          {!hasSelected ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '40px 20px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <EmptyStateIllustration />
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569', textAlign: 'center' }}>
                Pilih produk yang ingin dicetak label harganya
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1, maxHeight: '420px' }}>
              {selectedProducts.map(prod => (
                <div 
                  key={prod.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: '#ffffff'
                  }}
                >
                  <div style={{ flex: 1, marginRight: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>{prod.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      SKU: <span style={{ fontWeight: '500' }}>{prod.sku}</span> &bull; Harga: <span style={{ fontWeight: '500', color: '#0284c7' }}>{formatCurrency(prod.storePrice)}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Jumlah</span>
                      <input 
                        type="number"
                        min="1"
                        value={prod.qty}
                        onChange={(e) => handleQtyChange(prod.id, e.target.value)}
                        style={{
                          width: '60px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          fontSize: '13px',
                          outline: 'none',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(prod.id)}
                      style={{
                        border: 0,
                        background: '#fee2e2',
                        color: '#ef4444',
                        borderRadius: '6px',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#fecaca'}
                      onMouseOut={(e) => e.currentTarget.style.background = '#fee2e2'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Live Printable Preview */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', margin: 0 }}>Preview</h3>
            <button 
              type="button"
              disabled={!hasSelected}
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: hasSelected ? '#0ea5e9' : '#cbd5e1',
                color: hasSelected ? '#ffffff' : '#94a3b8',
                border: 0,
                borderRadius: '6px',
                padding: '0 16px',
                height: '32px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: hasSelected ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
                boxShadow: hasSelected ? '0 2px 4px rgba(14, 165, 233, 0.15)' : 'none'
              }}
              onMouseOver={(e) => {
                if (hasSelected) e.currentTarget.style.background = '#0284c7';
              }}
              onMouseOut={(e) => {
                if (hasSelected) e.currentTarget.style.background = '#0ea5e9';
              }}
            >
              <Printer size={14} />
              <span>Cetak</span>
            </button>
          </div>

          {!hasSelected ? (
            <div style={{ display: 'grid', placeItems: 'center', minHeight: '120px', background: '#f8fafc', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '10px', fontSize: '13px' }}>
              Label harga produk akan muncul di sini
            </div>
          ) : (
            <div 
              id="printable-labels-area"
              style={{
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                padding: `${settings.marginTop}px ${settings.marginRight}px ${settings.marginBottom}px ${settings.marginLeft}px`,
                minHeight: '220px',
                display: 'grid',
                gridTemplateColumns: `repeat(${settings.labelsPerLine}, 1fr)`,
                gap: '8px',
                overflow: 'auto',
                maxHeight: '400px'
              }}
            >
              {labelsToRender.map((prod, idx) => (
                <div 
                  key={idx}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    padding: '8px',
                    width: `${settings.labelWidth}px`,
                    height: `${settings.labelHeight}px`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{settings.storeName}</span>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e293b', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{prod.name}</span>
                  </div>
                  {settings.showBarcode && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2px 0' }}>
                      <div style={{ display: 'flex', gap: '1px', height: '10px', width: '100%', background: 'transparent' }}>
                        {Array.from({ length: 18 }).map((_, k) => (
                          <div key={k} style={{ flex: 1, background: k % 3 === 0 ? 'transparent' : '#0f172a', height: '100%' }}></div>
                        ))}
                      </div>
                      <span style={{ fontSize: '7px', color: '#64748b', letterSpacing: '1px' }}>{prod.barcode || '899100000000'}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #f1f5f9', paddingTop: '2px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#0ea5e9' }}>{formatCurrency(prod.storePrice)}</span>
                    {settings.showWeight && <span style={{ fontSize: '7px', color: '#94a3b8' }}>{prod.unit || 'pcs'}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
