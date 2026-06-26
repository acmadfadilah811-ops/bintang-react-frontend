import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, User, Briefcase, Plus, Trash2, Filter, 
  Download, Upload, Search, Star, ThumbsUp, Check, 
  X, MessageSquare, Heart, Edit2, AlertCircle 
} from 'lucide-react';
import { 
  customerSeed, 
  customerGroupSeed, 
  supplierSeed, 
  formatCurrency 
} from './customerSupplierData';

// Cute Polar Bear & Blue Profiles empty state SVG
const PolarBearEmptyState = ({ title, desc, onAddSeed }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  }}>
    <svg width="280" height="160" viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', margin: '0 auto 16px auto' }}>
      {/* Background soft circle */}
      <circle cx="140" cy="80" r="54" fill="#f0f9ff" />
      
      {/* Blue Customer Silhouette 1 */}
      <g transform="translate(100, 52)">
        <circle cx="20" cy="18" r="13" fill="#0ea5e9" />
        <path d="M5 40C5 31.5 11.5 25 20 25C28.5 25 35 31.5 35 40" fill="#0ea5e9" />
      </g>

      {/* Blue Customer Silhouette 2 */}
      <g transform="translate(122, 58)">
        <circle cx="20" cy="18" r="13" fill="#38bdf8" />
        <path d="M5 40C5 31.5 11.5 25 20 25C28.5 25 35 31.5 35 40" fill="#38bdf8" />
      </g>

      {/* Polar Bear peeking from behind */}
      <g transform="translate(152, 42)">
        {/* Head */}
        <circle cx="30" cy="30" r="23" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
        {/* Ears */}
        <circle cx="12" cy="10" r="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
        <circle cx="12" cy="10" r="3.5" fill="#f1f5f9" />
        <circle cx="48" cy="10" r="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
        <circle cx="48" cy="10" r="3.5" fill="#f1f5f9" />
        {/* Eyes */}
        <circle cx="21" cy="24" r="2.2" fill="#0f172a" />
        <circle cx="39" cy="24" r="2.2" fill="#0f172a" />
        {/* Eyebrows */}
        <path d="M18 19C19.5 18 21.5 18 23 19" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M42 19C40.5 18 38.5 18 37 19" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" />
        {/* Snout */}
        <ellipse cx="30" cy="34" rx="7.5" ry="5.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        {/* Nose */}
        <ellipse cx="30" cy="32" rx="4.5" ry="2.8" fill="#0f172a" />
        {/* Mouth */}
        <path d="M30 35V38.5M30 38.5C28.5 39 27.5 37.5 27.5 37.5M30 38.5C31.5 39 32.5 37.5 32.5 37.5" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>

    <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 6px 0' }}>{title}</h4>
    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0', maxWidth: '380px', lineHeight: '1.4' }}>{desc}</p>
    
    <div style={{ display: 'flex', gap: '8px' }}>
      {onAddSeed && (
        <button 
          onClick={onAddSeed}
          style={{
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            color: '#475569',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Load Data Contoh
        </button>
      )}
    </div>
  </div>
);

export default function CustomerSupplierApp() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Resolve active tab from URL path /customer-supplier/:tabId
  const pathParts = location.pathname.replace(/^\//, '').split('/');
  const activeTab = pathParts[1] || 'customer';

  // Tabs structure
  const tabs = [
    { id: 'customer', label: 'Pelanggan' },
    { id: 'notes', label: 'Catatan Pelanggan' },
    { id: 'types', label: 'Tipe Pelanggan' },
    { id: 'reviews', label: 'Ulasan Pelanggan' },
    { id: 'satisfaction', label: 'Kepuasan Pelanggan' },
    { id: 'supplier', label: 'Supplier' }
  ];

  const activeTabDetails = tabs.find(t => t.id === activeTab) || tabs[0];

  // States for Pelanggan
  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('cs_customers');
    return saved ? JSON.parse(saved) : []; // Starts empty by default as requested to show empty state
  });
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '', group: 'Reguler', deposit: '' });
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('Semua Tipe');

  // States for Catatan Pelanggan
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('cs_notes');
    return saved ? JSON.parse(saved) : [
      { id: 'note-1', customerName: 'Budi Santoso', content: 'Pelanggan meminta pengerjaan spanduk dipercepat untuk acara hari Minggu.', category: 'Request', date: '25-Jun-2026' },
      { id: 'note-2', customerName: 'PT Maju Jaya', content: 'Komplain mengenai kecerahan warna biru logo yang agak pudar di cetakan kemarin.', category: 'Komplain', date: '24-Jun-2026' }
    ];
  });
  const [noteForm, setNoteForm] = useState({ customerName: '', content: '', category: 'Info' });
  const [showNoteForm, setShowNoteForm] = useState(false);

  // States for Tipe Pelanggan (Groups)
  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem('cs_groups');
    return saved ? JSON.parse(saved) : customerGroupSeed;
  });
  const [groupForm, setGroupForm] = useState({ name: '', discount: '' });
  const [showGroupForm, setShowGroupForm] = useState(false);

  // States for Ulasan Pelanggan
  const [reviews, setReviews] = useState(() => {
    const saved = localStorage.getItem('cs_reviews');
    return saved ? JSON.parse(saved) : [
      { id: 'rev-1', customerName: 'Budi Santoso', rating: 5, comment: 'Hasil cetak roll banner sangat memuaskan, warnanya tajam!', date: '24-Jun-2026' },
      { id: 'rev-2', customerName: 'Siti Aminah', rating: 4, comment: 'Pelayanan cepat dan adminnya sangat responsif di WA.', date: '23-Jun-2026' },
      { id: 'rev-3', customerName: 'PT Maju Jaya', rating: 3, comment: 'Kualitas cetakan bagus, namun pengiriman agak sedikit terlambat dari jadwal.', date: '22-Jun-2026' }
    ];
  });
  const [reviewForm, setReviewForm] = useState({ customerName: '', rating: 5, comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);

  // States for Supplier
  const [suppliers, setSuppliers] = useState(() => {
    const saved = localStorage.getItem('cs_suppliers');
    return saved ? JSON.parse(saved) : supplierSeed;
  });
  const [supplierForm, setSupplierForm] = useState({ name: '', contact: '', phone: '', address: '' });
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [supplierQuery, setSupplierQuery] = useState('');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('cs_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('cs_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('cs_groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('cs_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('cs_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  // Load Seed Data helpers
  const handleLoadCustomerSeed = () => {
    setCustomers(customerSeed);
  };

  // Handlers for Adding
  const handleAddCustomer = (e) => {
    e.preventDefault();
    if (!customerForm.name.trim()) return;
    const newCust = {
      id: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
      name: customerForm.name.trim(),
      phone: customerForm.phone.trim() || '-',
      email: customerForm.email.trim() || '-',
      group: customerForm.group,
      deposit: Number(customerForm.deposit) || 0,
      active: true
    };
    setCustomers(prev => [...prev, newCust]);
    setCustomerForm({ name: '', phone: '', email: '', group: 'Reguler', deposit: '' });
    setShowCustomerForm(false);
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteForm.content.trim()) return;
    const newNote = {
      id: `note-${Date.now()}`,
      customerName: noteForm.customerName || 'Umum / Anonim',
      content: noteForm.content.trim(),
      category: noteForm.category,
      date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\s/g, '-')
    };
    setNotes(prev => [newNote, ...prev]);
    setNoteForm({ customerName: '', content: '', category: 'Info' });
    setShowNoteForm(false);
  };

  const handleAddGroup = (e) => {
    e.preventDefault();
    if (!groupForm.name.trim()) return;
    const newGrp = {
      id: `CG-${String(groups.length + 1).padStart(2, '0')}`,
      name: groupForm.name.trim(),
      discount: Number(groupForm.discount) || 0,
      members: 0
    };
    setGroups(prev => [...prev, newGrp]);
    setGroupForm({ name: '', discount: '' });
    setShowGroupForm(false);
  };

  const handleAddReview = (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) return;
    const newRev = {
      id: `rev-${Date.now()}`,
      customerName: reviewForm.customerName || 'Pelanggan Umum',
      rating: Number(reviewForm.rating),
      comment: reviewForm.comment.trim(),
      date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\s/g, '-')
    };
    setReviews(prev => [newRev, ...prev]);
    setReviewForm({ customerName: '', rating: 5, comment: '' });
    setShowReviewForm(false);
  };

  const handleAddSupplier = (e) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) return;
    const newSup = {
      id: `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
      name: supplierForm.name.trim(),
      contact: supplierForm.contact.trim() || '-',
      phone: supplierForm.phone.trim() || '-',
      address: supplierForm.address.trim() || '-',
      active: true
    };
    setSuppliers(prev => [...prev, newSup]);
    setSupplierForm({ name: '', contact: '', phone: '', address: '' });
    setShowSupplierForm(false);
  };

  // Handlers for Deleting
  const handleDeleteCustomer = (id) => {
    if (window.confirm('Hapus pelanggan ini?')) {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleDeleteNote = (id) => {
    if (window.confirm('Hapus catatan ini?')) {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleDeleteGroup = (id) => {
    if (window.confirm('Hapus tipe/grup pelanggan ini?')) {
      setGroups(prev => prev.filter(g => g.id !== id));
    }
  };

  const handleDeleteReview = (id) => {
    if (window.confirm('Hapus ulasan ini?')) {
      setReviews(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleDeleteSupplier = (id) => {
    if (window.confirm('Hapus supplier ini?')) {
      setSuppliers(prev => prev.filter(s => s.id !== id));
    }
  };

  // Filtered Pelanggan
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchQuery = `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(customerQuery.toLowerCase());
      const matchGroup = selectedGroupFilter === 'Semua Tipe' || c.group === selectedGroupFilter;
      return matchQuery && matchGroup;
    });
  }, [customers, customerQuery, selectedGroupFilter]);

  // Filtered Supplier
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      return `${s.name} ${s.contact} ${s.phone}`.toLowerCase().includes(supplierQuery.toLowerCase());
    });
  }, [suppliers, supplierQuery]);

  // Tab change helper
  const handleTabChange = (tabId) => {
    navigate(`/customer-supplier/${tabId}`);
  };

  return (
    <div className="pi-module pi-module-full">
      {/* Unified Blue Header Topbar */}
      <div className="pi-content-topbar">
        <h1>Pelanggan dan Supplier / {activeTabDetails.label}</h1>
      </div>

      {/* Main Full Panel */}
      <section className="pi-full-panel">
        {/* Navigation Tabs Bar */}
        <nav className="pi-top-tabs pi-top-tabs-full" aria-label="Menu Pelanggan dan Supplier">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={tab.id === activeTab ? 'is-active' : ''}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab Body Content */}
        <div className="pi-page-body">
          {/* TAB 1: PELANGGAN */}
          {activeTab === 'customer' && (
            <>
              {/* Form Tambah Pelanggan */}
              {showCustomerForm && (
                <form 
                  onSubmit={handleAddCustomer}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '16px',
                    marginBottom: '16px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    alignItems: 'end'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Nama Pelanggan *</label>
                    <input 
                      type="text" 
                      value={customerForm.name} 
                      onChange={e => setCustomerForm(p => ({ ...p, name: e.target.value }))}
                      required
                      style={{ border: '1px solid #cbd5e1', borderRadius: '6px', height: '36px', padding: '0 10px', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>No. Telepon</label>
                    <input 
                      type="text" 
                      value={customerForm.phone} 
                      onChange={e => setCustomerForm(p => ({ ...p, phone: e.target.value }))}
                      style={{ border: '1px solid #cbd5e1', borderRadius: '6px', height: '36px', padding: '0 10px', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Email</label>
                    <input 
                      type="email" 
                      value={customerForm.email} 
                      onChange={e => setCustomerForm(p => ({ ...p, email: e.target.value }))}
                      style={{ border: '1px solid #cbd5e1', borderRadius: '6px', height: '36px', padding: '0 10px', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Tipe Pelanggan</label>
                    <select 
                      value={customerForm.group} 
                      onChange={e => setCustomerForm(p => ({ ...p, group: e.target.value }))}
                      style={{ border: '1px solid #cbd5e1', borderRadius: '6px', height: '36px', padding: '0 10px', fontSize: '13px', background: '#fff' }}
                    >
                      <option value="Reguler">Reguler</option>
                      <option value="Member">Member</option>
                      <option value="Korporat">Korporat</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Deposit Awal</label>
                    <input 
                      type="number" 
                      value={customerForm.deposit} 
                      onChange={e => setCustomerForm(p => ({ ...p, deposit: e.target.value }))}
                      style={{ border: '1px solid #cbd5e1', borderRadius: '6px', height: '36px', padding: '0 10px', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="submit"
                      style={{ flex: 1, background: '#0ea5e9', color: '#fff', border: 0, borderRadius: '6px', height: '36px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Simpan
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowCustomerForm(false)}
                      style={{ background: '#e2e8f0', color: '#475569', border: 0, borderRadius: '6px', height: '36px', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </form>
              )}

              {/* Action Toolbar */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
                <button style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 16px', height: '38px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#475569' }}>
                  <Filter size={15} />
                  <span>Filter</span>
                </button>

                <select 
                  value={selectedGroupFilter}
                  onChange={e => setSelectedGroupFilter(e.target.value)}
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 12px', height: '38px', fontSize: '13px', fontWeight: 'bold', width: '160px', cursor: 'pointer', color: '#475569', outline: 'none' }}
                >
                  <option value="Semua Tipe">Tipe Pelanggan</option>
                  <option value="Reguler">Reguler</option>
                  <option value="Member">Member</option>
                  <option value="Korporat">Korporat</option>
                </select>

                <button style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 16px', height: '38px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#475569' }}>
                  <Download size={15} />
                  <span>Download</span>
                </button>

                <button style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 16px', height: '38px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#475569' }}>
                  <Upload size={15} />
                  <span>Import</span>
                </button>

                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="Cari"
                    value={customerQuery}
                    onChange={e => setCustomerQuery(e.target.value)}
                    style={{ width: '100%', height: '38px', padding: '0 12px 0 36px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                  />
                  <Search size={15} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                </div>

                <button 
                  onClick={() => setShowCustomerForm(prev => !prev)}
                  style={{ background: '#22c55e', color: '#ffffff', border: 0, borderRadius: '6px', padding: '0 18px', height: '38px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)' }}
                >
                  <Plus size={16} />
                  <span>Tambah</span>
                </button>
              </div>

              {/* Main List Area */}
              {customers.length === 0 ? (
                <PolarBearEmptyState 
                  title="Eh, belum ada Pelanggan. Kelola pelanggan hingga Loyalty Point"
                  desc="Hubungkan kontak WhatsApp pelanggan Anda, kelompokkan berdasarkan grup tertentu, dan catat saldo deposit mereka untuk proses pengerjaan yang lebih cepat."
                  onAddSeed={handleLoadCustomerSeed}
                />
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>ID Pelanggan</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Nama</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Telepon</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Email</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Tipe</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Deposit</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Status</th>
                        <th style={{ padding: '12px 16px', width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map(cust => (
                        <tr key={cust.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>{cust.id}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#1e293b' }}>{cust.name}</td>
                          <td style={{ padding: '12px 16px', color: '#334155' }}>{cust.phone}</td>
                          <td style={{ padding: '12px 16px', color: '#64748b' }}>{cust.email}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              background: cust.group === 'Korporat' ? '#fae8ff' : cust.group === 'Member' ? '#dbeafe' : '#f1f5f9',
                              color: cust.group === 'Korporat' ? '#a21caf' : cust.group === 'Member' ? '#1d4ed8' : '#475569'
                            }}>
                              {cust.group}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: '600', color: '#16a34a' }}>{formatCurrency(cust.deposit)}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', background: '#dcfce7', color: '#15803d' }}>Aktif</span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <button onClick={() => handleDeleteCustomer(cust.id)} style={{ border: 0, background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* TAB 2: CATATAN PELANGGAN */}
          {activeTab === 'notes' && (
            <div style={{ display: 'grid', gridTemplateColumns: '4fr 6fr', gap: '20px' }}>
              {/* Form Tambah Catatan */}
              <form onSubmit={handleAddNote} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', height: 'fit-content' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Buat Catatan</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Nama Pelanggan</label>
                  <select 
                    value={noteForm.customerName}
                    onChange={e => setNoteForm(p => ({ ...p, customerName: e.target.value }))}
                    style={{ border: '1px solid #cbd5e1', borderRadius: '6px', height: '36px', padding: '0 8px', fontSize: '13px', background: '#fff' }}
                  >
                    <option value="">-- Pilih Pelanggan (Opsional) --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    {customers.length === 0 && <option value="Budi Santoso">Budi Santoso (Seed)</option>}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Kategori Catatan</label>
                  <select 
                    value={noteForm.category}
                    onChange={e => setNoteForm(p => ({ ...p, category: e.target.value }))}
                    style={{ border: '1px solid #cbd5e1', borderRadius: '6px', height: '36px', padding: '0 8px', fontSize: '13px', background: '#fff' }}
                  >
                    <option value="Info">Informasi Umum</option>
                    <option value="Request">Request Desain / Ukuran</option>
                    <option value="Komplain">Komplain Produksi</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Isi Catatan *</label>
                  <textarea 
                    value={noteForm.content} 
                    onChange={e => setNoteForm(p => ({ ...p, content: e.target.value }))}
                    required
                    placeholder="Tulis detail catatan penting di sini..."
                    rows={4}
                    style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', resize: 'vertical', outline: 'none' }}
                  />
                </div>

                <button type="submit" style={{ background: '#0ea5e9', color: '#fff', border: 0, borderRadius: '6px', height: '38px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }}>
                  Simpan Catatan
                </button>
              </form>

              {/* List Catatan */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 4px 0' }}>Daftar Catatan Penting</h3>
                
                {notes.map(note => (
                  <div key={note.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', background: '#fff', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0ea5e9' }}>{note.customerName}</span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: note.category === 'Komplain' ? '#fee2e2' : note.category === 'Request' ? '#dbeafe' : '#f1f5f9',
                          color: note.category === 'Komplain' ? '#ef4444' : note.category === 'Request' ? '#2563eb' : '#475569'
                        }}>
                          {note.category}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{note.date}</span>
                    </div>
                    
                    <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.5' }}>{note.content}</p>
                    
                    <button 
                      onClick={() => handleDeleteNote(note.id)}
                      style={{ position: 'absolute', right: '16px', bottom: '16px', border: 0, background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TIPE PELANGGAN */}
          {activeTab === 'types' && (
            <div style={{ display: 'grid', gridTemplateColumns: '4fr 6fr', gap: '20px' }}>
              {/* Form Tambah Grup */}
              <form onSubmit={handleAddGroup} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', height: 'fit-content' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Tambah Tipe Pelanggan</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Nama Tipe *</label>
                  <input 
                    type="text"
                    value={groupForm.name}
                    onChange={e => setGroupForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Contoh: Reseller, VIP, dll."
                    required
                    style={{ border: '1px solid #cbd5e1', borderRadius: '6px', height: '36px', padding: '0 10px', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Diskon Khusus (%)</label>
                  <input 
                    type="number"
                    value={groupForm.discount}
                    onChange={e => setGroupForm(p => ({ ...p, discount: e.target.value }))}
                    placeholder="0"
                    style={{ border: '1px solid #cbd5e1', borderRadius: '6px', height: '36px', padding: '0 10px', fontSize: '13px' }}
                  />
                </div>

                <button type="submit" style={{ background: '#22c55e', color: '#fff', border: 0, borderRadius: '6px', height: '38px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Simpan Tipe
                </button>
              </form>

              {/* Table Tipe */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Grup & Leveling Diskon</h3>
                
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Nama Tipe</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Potongan Diskon</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Status Akses</th>
                        <th style={{ padding: '12px 16px', width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map(grp => (
                        <tr key={grp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#1e293b' }}>{grp.name}</td>
                          <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0ea5e9' }}>{grp.discount}% Diskon</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', background: '#e0f2fe', color: '#0369a1' }}>Terbuka</span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <button onClick={() => handleDeleteGroup(grp.id)} style={{ border: 0, background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ULASAN PELANGGAN */}
          {activeTab === 'reviews' && (
            <div style={{ display: 'grid', gridTemplateColumns: '4fr 6fr', gap: '20px' }}>
              {/* Form Tambah Ulasan */}
              <form onSubmit={handleAddReview} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', height: 'fit-content' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Tulis Ulasan Baru</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Nama Pelanggan</label>
                  <select 
                    value={reviewForm.customerName}
                    onChange={e => setReviewForm(p => ({ ...p, customerName: e.target.value }))}
                    style={{ border: '1px solid #cbd5e1', borderRadius: '6px', height: '36px', padding: '0 8px', fontSize: '13px', background: '#fff' }}
                  >
                    <option value="">-- Pilih Pelanggan (Opsional) --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    {customers.length === 0 && <option value="Budi Santoso">Budi Santoso (Seed)</option>}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Rating</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={22} 
                        onClick={() => setReviewForm(p => ({ ...p, rating: star }))}
                        style={{
                          cursor: 'pointer',
                          fill: star <= reviewForm.rating ? '#eab308' : 'none',
                          stroke: star <= reviewForm.rating ? '#eab308' : '#cbd5e1',
                          transition: 'all 0.1s'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Komentar Ulasan *</label>
                  <textarea 
                    value={reviewForm.comment} 
                    onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                    required
                    placeholder="Berikan komentar mengenai kualitas cetak atau layanan..."
                    rows={4}
                    style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', resize: 'vertical', outline: 'none' }}
                  />
                </div>

                <button type="submit" style={{ background: '#0ea5e9', color: '#fff', border: 0, borderRadius: '6px', height: '38px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Kirim Ulasan
                </button>
              </form>

              {/* List Ulasan */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 2px 0' }}>Rata-rata Rating Toko</h4>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Berdasarkan seluruh masukan pelanggan aktif</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={24} style={{ fill: '#eab308', stroke: '#eab308' }} />
                    <span style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>4.8</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>/ 5.0</span>
                  </div>
                </div>

                {reviews.map(rev => (
                  <div key={rev.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', background: '#fff', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginRight: '8px' }}>{rev.customerName}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{rev.date}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            size={14} 
                            style={{
                              fill: star <= rev.rating ? '#eab308' : 'none',
                              stroke: star <= rev.rating ? '#eab308' : '#cbd5e1'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.5', fontStyle: 'italic' }}>"{rev.comment}"</p>
                    
                    <button 
                      onClick={() => handleDeleteReview(rev.id)}
                      style={{ position: 'absolute', right: '16px', bottom: '12px', border: 0, background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: KEPUASAN PELANGGAN */}
          {activeTab === 'satisfaction' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* CSAT NPS Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: '#bae6fd', color: '#0284c7', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                    <Heart size={24} style={{ fill: '#0284c7' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0369a1', margin: '0 0 2px 0' }}>Customer Satisfaction (CSAT)</h4>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0369a1', margin: 0 }}>94.2%</h2>
                    <p style={{ fontSize: '11px', color: '#0284c7', margin: 0 }}>Sangat Puas / Sangat Baik</p>
                  </div>
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: '#bbf7d0', color: '#16a34a', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                    <ThumbsUp size={24} style={{ fill: '#16a34a' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#15803d', margin: '0 0 2px 0' }}>Net Promoter Score (NPS)</h4>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#15803d', margin: 0 }}>+72</h2>
                    <p style={{ fontSize: '11px', color: '#16a34a', margin: 0 }}>Loyalitas Pelanggan Sangat Kuat</p>
                  </div>
                </div>
              </div>

              {/* Progress Factors */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 16px 0' }}>Faktor Nilai Kepuasan Layanan</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Kualitas Cetakan (Resolusi & Kecerahan Warna)', score: 96 },
                    { label: 'Kecepatan Waktu Pengerjaan (SPK)', score: 88 },
                    { label: 'Keramahan Admin WhatsApp & Kasir', score: 92 },
                    { label: 'Kesesuaian Harga dengan Spek Bahan', score: 90 }
                  ].map((item, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                        <span>{item.label}</span>
                        <span>{item.score}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${item.score}%`, height: '100%', background: '#0ea5e9', borderRadius: '4px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SUPPLIER */}
          {activeTab === 'supplier' && (
            <>
              {/* Form Tambah Supplier */}
              {showSupplierForm && (
                <form 
                  onSubmit={handleAddSupplier}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '16px',
                    marginBottom: '16px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    alignItems: 'end'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Nama Supplier *</label>
                    <input 
                      type="text" 
                      value={supplierForm.name} 
                      onChange={e => setSupplierForm(p => ({ ...p, name: e.target.value }))}
                      required
                      style={{ border: '1px solid #cbd5e1', borderRadius: '6px', height: '36px', padding: '0 10px', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Nama Kontak (PIC)</label>
                    <input 
                      type="text" 
                      value={supplierForm.contact} 
                      onChange={e => setSupplierForm(p => ({ ...p, contact: e.target.value }))}
                      style={{ border: '1px solid #cbd5e1', borderRadius: '6px', height: '36px', padding: '0 10px', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>No. Telepon</label>
                    <input 
                      type="text" 
                      value={supplierForm.phone} 
                      onChange={e => setSupplierForm(p => ({ ...p, phone: e.target.value }))}
                      style={{ border: '1px solid #cbd5e1', borderRadius: '6px', height: '36px', padding: '0 10px', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Alamat</label>
                    <input 
                      type="text" 
                      value={supplierForm.address} 
                      onChange={e => setSupplierForm(p => ({ ...p, address: e.target.value }))}
                      style={{ border: '1px solid #cbd5e1', borderRadius: '6px', height: '36px', padding: '0 10px', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="submit"
                      style={{ flex: 1, background: '#0ea5e9', color: '#fff', border: 0, borderRadius: '6px', height: '36px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Simpan
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowSupplierForm(false)}
                      style={{ background: '#e2e8f0', color: '#475569', border: 0, borderRadius: '6px', height: '36px', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </form>
              )}

              {/* Supplier Action Toolbar */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
                <button style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 16px', height: '38px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#475569' }}>
                  <Filter size={15} />
                  <span>Filter</span>
                </button>

                <button style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 16px', height: '38px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#475569' }}>
                  <Download size={15} />
                  <span>Download</span>
                </button>

                <button style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 16px', height: '38px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#475569' }}>
                  <Upload size={15} />
                  <span>Import</span>
                </button>

                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="Cari Supplier..."
                    value={supplierQuery}
                    onChange={e => setSupplierQuery(e.target.value)}
                    style={{ width: '100%', height: '38px', padding: '0 12px 0 36px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                  />
                  <Search size={15} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                </div>

                <button 
                  onClick={() => setShowSupplierForm(prev => !prev)}
                  style={{ background: '#22c55e', color: '#ffffff', border: 0, borderRadius: '6px', padding: '0 18px', height: '38px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)' }}
                >
                  <Plus size={16} />
                  <span>Tambah</span>
                </button>
              </div>

              {/* Supplier List */}
              {suppliers.length === 0 ? (
                <div style={{ display: 'grid', placeItems: 'center', minHeight: '160px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', color: '#64748b', fontSize: '13px' }}>
                  Belum ada supplier bahan baku ditambahkan.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>ID Supplier</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Nama Pemasok / Toko</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Kontak PIC</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>No. Telepon</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Alamat Gudang</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Status</th>
                        <th style={{ padding: '12px 16px', width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSuppliers.map(sup => (
                        <tr key={sup.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>{sup.id}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#1e293b' }}>{sup.name}</td>
                          <td style={{ padding: '12px 16px', color: '#334155' }}>{sup.contact}</td>
                          <td style={{ padding: '12px 16px', color: '#334155' }}>{sup.phone}</td>
                          <td style={{ padding: '12px 16px', color: '#64748b' }}>{sup.address}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', background: '#dcfce7', color: '#15803d' }}>Aktif</span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <button onClick={() => handleDeleteSupplier(sup.id)} style={{ border: 0, background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
