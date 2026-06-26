import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import { Button, PageHeader, Select, Toolbar } from '../components/PageShell';
import { specialTypeMenus, productRows } from '../productInventoryData';
import { X, Plus, Trash2, Menu, Lightbulb, Compass, Tag, TrendingUp, Ban, Calendar, Droplet, ChevronsUpDown } from 'lucide-react';

const menuWithIcons = [
  { name: 'Unggulan', icon: Lightbulb },
  { name: 'Rilis Terbaru', icon: Compass },
  { name: 'Sale', icon: Tag },
  { name: 'Populer', icon: TrendingUp },
  { name: 'Habis Stok', icon: Ban },
  { name: 'Pre-order', icon: Calendar },
  { name: 'Bahan Baku', icon: Droplet },
];

export function SpecialTypeListPage() {
  const [activeMenu, setActiveMenu] = useState(specialTypeMenus[0]);
  const [typeMappings, setTypeMappings] = useState(() => {
    const saved = localStorage.getItem('special_types_mapping');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse special_types_mapping', e);
      }
    }
    return {
      'Unggulan': ['PRD-0001'],
      'Rilis Terbaru': ['PRD-0002'],
      'Sale': ['PRD-0003'],
      'Populer': [],
      'Habis Stok': [],
      'Pre-order': [],
      'Bahan Baku': [],
    };
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('special_types_sidebar_open');
    return saved !== 'false';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  
  // Pagination & Sorting States
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    localStorage.setItem('special_types_mapping', JSON.stringify(typeMappings));
  }, [typeMappings]);

  useEffect(() => {
    localStorage.setItem('special_types_sidebar_open', isSidebarOpen.toString());
  }, [isSidebarOpen]);

  // Reset page when switching active menu or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeMenu, searchQuery, pageSize]);

  // Helper function to get product category/group display name
  const getProductGroup = (productName) => {
    if (productName.toLowerCase().includes('banner')) return 'Print Outdoor';
    if (productName.toLowerCase().includes('sticker')) return 'Print Indoor';
    if (productName.toLowerCase().includes('kartu')) return 'Merchandise';
    return 'Umum';
  };

  // Get active products for current category
  const activeProductIds = typeMappings[activeMenu] || [];
  const assignedProducts = productRows.filter(p => activeProductIds.includes(p.id));

  // Sort assigned products
  let sortedProducts = [...assignedProducts];
  if (sortKey) {
    sortedProducts.sort((a, b) => {
      let valA = a[sortKey] || '';
      let valB = b[sortKey] || '';
      
      if (sortKey === 'group') {
        valA = getProductGroup(a.name);
        valB = getProductGroup(b.name);
      }
      
      valA = valA.toString().toLowerCase();
      valB = valB.toString().toLowerCase();
      
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Filter assigned products based on search query
  const filteredProducts = sortedProducts.filter(p => {
    const term = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term);
  });

  // Calculate pagination variables
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleAddProduct = (productId) => {
    setTypeMappings(prev => {
      const currentIds = prev[activeMenu] || [];
      if (!currentIds.includes(productId)) {
        return {
          ...prev,
          [activeMenu]: [...currentIds, productId]
        };
      }
      return prev;
    });
  };

  const handleRemoveProduct = (productId) => {
    setTypeMappings(prev => {
      const currentIds = prev[activeMenu] || [];
      return {
        ...prev,
        [activeMenu]: currentIds.filter(id => id !== productId)
      };
    });
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const columns = [
    { 
      key: 'name', 
      label: (
        <div 
          onClick={() => handleSort('name')}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }}
        >
          <span>Nama</span>
          <ChevronsUpDown size={14} style={{ color: sortKey === 'name' ? '#0085ca' : '#94a3b8' }} />
        </div>
      ) 
    },
    { 
      key: 'sku', 
      label: (
        <div 
          onClick={() => handleSort('sku')}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }}
        >
          <span>SKU</span>
          <ChevronsUpDown size={14} style={{ color: sortKey === 'sku' ? '#0085ca' : '#94a3b8' }} />
        </div>
      ) 
    },
    { 
      key: 'group', 
      label: (
        <div 
          onClick={() => handleSort('group')}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }}
        >
          <span>Grup</span>
          <ChevronsUpDown size={14} style={{ color: sortKey === 'group' ? '#0085ca' : '#94a3b8' }} />
        </div>
      ) 
    },
    {
      key: 'action',
      label: 'Aksi',
      render: (row) => (
        <button
          onClick={() => handleRemoveProduct(row.id)}
          className="pi-icon-button"
          style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}
          title="Hapus dari list"
        >
          <Trash2 size={16} />
          <span>Hapus</span>
        </button>
      )
    }
  ];

  return (
    <>
      <PageHeader 
        title="Tipe Special" 
        description="Masukkan produk ke bucket khusus seperti Unggulan, Sale, Pre-order, atau Bahan Baku." 
      />
      
      <div 
        className="pi-split-panel" 
        style={{ 
          display: 'flex', 
          gap: isSidebarOpen ? '16px' : '0px', 
          gridTemplateColumns: 'none',
          transition: 'gap 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <aside 
          className="pi-menu-panel"
          style={{
            width: isSidebarOpen ? '220px' : '0px',
            opacity: isSidebarOpen ? 1 : 0,
            overflow: 'hidden',
            flexShrink: 0,
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease-in-out, border 0.3s ease-in-out, margin 0.3s ease-in-out',
            borderWidth: isSidebarOpen ? '1px' : '0px',
            borderColor: '#e5e7eb',
            borderStyle: 'solid',
            borderRadius: '12px',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            height: 'fit-content',
            marginRight: isSidebarOpen ? '16px' : '0px'
          }}
        >
          {/* Sidebar Header with Toggle Icon */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 14px',
            borderBottom: '1px solid #edf2f7',
            background: '#f8fafc'
          }}>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: '800', 
              color: '#64748b', 
              textTransform: 'uppercase', 
              letterSpacing: '0.06em' 
            }}>
              Menu
            </span>
            <button 
              type="button" 
              onClick={() => setIsSidebarOpen(false)}
              style={{
                border: 0,
                background: 'none',
                cursor: 'pointer',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
                borderRadius: '6px',
                transition: 'background 0.2s, color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.color = '#0f172a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#64748b';
              }}
              title="Sembunyikan Menu"
            >
              <Menu size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {menuWithIcons.map((item) => {
              const IconComponent = item.icon;
              return (
                <button 
                  className={activeMenu === item.name ? 'is-active' : ''} 
                  key={item.name}
                  onClick={() => {
                    setActiveMenu(item.name);
                    setSearchQuery('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <IconComponent size={16} style={{ opacity: activeMenu === item.name ? 1 : 0.7 }} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="pi-content-panel" style={{ flex: 1, minWidth: 0 }}>
          <div className="pi-panel-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Expand Menu Button shown only when sidebar is closed */}
              {!isSidebarOpen && (
                <button 
                  type="button" 
                  onClick={() => setIsSidebarOpen(true)}
                  style={{
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: 'pointer',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    borderRadius: '8px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    transition: 'background 0.2s, color 0.2s, border-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#94a3b8';
                    e.currentTarget.style.color = '#0f172a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.color = '#475569';
                  }}
                  title="Tampilkan Menu"
                >
                  <Menu size={16} />
                </button>
              )}
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Daftar Produk {activeMenu}</h3>
                <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>{assignedProducts.length} Produk {activeMenu}</p>
              </div>
            </div>
            <Button variant="success" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Tambah
            </Button>
          </div>

          <Toolbar
            searchPlaceholder="Cari produk"
            searchValue={searchQuery}
            onSearchChange={(e) => setSearchQuery(e.target.value)}
            left={
              <select 
                className="pi-select" 
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={5}>5 Baris</option>
                <option value={10}>10 Baris</option>
                <option value={20}>20 Baris</option>
              </select>
            }
          />

          <DataTable
            rows={paginatedProducts}
            columns={columns}
            emptyText={`Tidak ada produk di kategori ${activeMenu}`}
          />

          {/* Pagination bar matching Olsera Screenshot */}
          {filteredProducts.length > 0 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
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
          )}
        </section>
      </div>

      {/* Styled Modal for Adding Products */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '560px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '85vh'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
                Tambah Produk ke {activeMenu}
              </h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setModalSearchQuery('');
                }}
                style={{
                  border: 0,
                  background: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <input 
                type="text" 
                placeholder="Cari produk berdasarkan nama atau SKU..."
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{
              padding: '10px 20px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {availableProducts.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  Tidak ada produk yang tersedia untuk ditambahkan.
                </div>
              ) : (
                availableProducts.map(product => (
                  <div 
                    key={product.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      border: '1px solid #f1f5f9',
                      borderRadius: '8px',
                      background: '#f8fafc'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>{product.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        SKU: {product.sku} | Grup: {getProductGroup(product.name)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddProduct(product.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#16a34a',
                        color: '#ffffff',
                        border: 0,
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 4px rgba(22, 163, 74, 0.15)'
                      }}
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              background: '#f8fafc'
            }}>
              <Button variant="secondary" onClick={() => {
                setShowAddModal(false);
                setModalSearchQuery('');
              }}>
                Selesai
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
