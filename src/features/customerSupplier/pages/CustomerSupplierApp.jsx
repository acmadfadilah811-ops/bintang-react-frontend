import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TransaksiTopbar from '../../transaksi/components/TransaksiTopbar';
import { TransaksiProvider, useTransaksiCrumb } from '../../transaksi/components/TransaksiContext';
import {
  Plus, Trash2, Filter,
  Download, Upload, Search, Star, ThumbsUp,
  X, Heart, Edit2,
} from 'lucide-react';
import { formatCurrency } from './customerSupplierData';
import { formatDisplayDate } from '../../../utils/date';
import apiClient from '../../../api/apiClient';
import CustomerFilterDrawer, { defaultCustomerFilters } from '../components/CustomerFilterDrawer';
import CustomerImportModal from '../components/CustomerImportModal';
import AddCustomerModal from '../components/AddCustomerModal';
import CustomerCombobox from '../components/CustomerCombobox';
import CustomerNoteModal from '../components/CustomerNoteModal';

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const fmtDate = (isoStr) => {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '-';
  return `${String(d.getDate()).padStart(2, '0')}-${MONTHS_ID[d.getMonth()]}-${d.getFullYear()}`;
};

/** Ubah error response DRF jadi satu baris pesan. */
const extractApiError = (err, fallback) => {
  const data = err.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.error) return data.error;
  if (data.detail) return data.detail;
  const parts = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
  return parts.length ? parts.join(' | ') : fallback;
};

/** Sakelar Aktif/Nonaktif dipakai di kolom Aksi tiap daftar. */
function StatusToggle({ active, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={active ? 'Nonaktifkan' : 'Aktifkan'}
      style={{
        padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', border: 0,
        background: active ? '#dcfce7' : '#f1f5f9', color: active ? '#15803d' : '#64748b',
      }}
    >
      {active ? 'Aktif' : 'Nonaktif'}
    </button>
  );
}

// Cute Polar Bear & Blue Profiles empty state SVG
const EmptyState = ({ title, desc }) => (
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
    <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 6px 0' }}>{title}</h4>
    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, maxWidth: '380px', lineHeight: '1.4' }}>{desc}</p>
  </div>
);

const inputSm = { border: '1px solid #cbd5e1', borderRadius: '6px', height: '36px', padding: '0 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' };
const labelSm = { fontSize: '11px', fontWeight: 'bold', color: '#475569' };

function CustomerSupplierInner() {
  const location = useLocation();
  const navigate = useNavigate();

  const pathParts = location.pathname.replace(/^\//, '').split('/');
  const activeTab = pathParts[1] || 'customer';

  const tabs = [
    { id: 'customer', label: 'Pelanggan' },
    { id: 'notes', label: 'Catatan Pelanggan' },
    { id: 'types', label: 'Tipe Pelanggan' },
    { id: 'reviews', label: 'Ulasan Pelanggan' },
    { id: 'satisfaction', label: 'Kepuasan Pelanggan' },
    { id: 'supplier', label: 'Supplier' }
  ];

  const activeTabDetails = tabs.find(t => t.id === activeTab) || tabs[0];

  const { setSubtitle } = useTransaksiCrumb();

  useEffect(() => {
    setSubtitle(activeTabDetails?.label || '');
  }, [activeTabDetails, setSubtitle]);

  // ── Data umum (dipakai lintas tab) ──────────────────────────────
  const [customers, setCustomers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const res = await apiClient.get('/customers/');
      setCustomers(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      console.error('[CustomerSupplierApp] fetch customers error:', err);
      setError('Gagal memuat daftar pelanggan.');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const res = await apiClient.get('/customer-groups/');
      setGroups(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      console.error('[CustomerSupplierApp] fetch groups error:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchGroups();
  }, []);

  // ── Pelanggan (form + toolbar) ───────────────────────────────────
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('Semua Tipe');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(defaultCustomerFilters);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportingCustomers, setExportingCustomers] = useState(false);

  const handleDownloadCustomers = async () => {
    if (exportingCustomers) return;
    setExportingCustomers(true);
    setError(null);
    try {
      const res = await apiClient.get('/export/customers/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `daftar_pelanggan_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('[CustomerSupplierApp] export customers error:', err);
      setError(extractApiError(err, 'Gagal mengekspor data pelanggan.'));
    } finally {
      setExportingCustomers(false);
    }
  };

  const openCustomerCreate = () => setShowAddCustomerModal(true);
  const openCustomerEdit = (cust) => setEditingCustomer(cust);
  const closeCustomerModal = () => {
    setShowAddCustomerModal(false);
    setEditingCustomer(null);
  };
  const handleCustomerSaved = () => {
    closeCustomerModal();
    fetchCustomers();
  };

  const handleToggleCustomer = async (cust) => {
    try {
      await apiClient.post(`/customers/${cust.id}/toggle-status/`);
      fetchCustomers();
    } catch (err) {
      console.error('[CustomerSupplierApp] toggle customer error:', err);
    }
  };

  const handleDeleteCustomer = async (cust) => {
    if (!window.confirm(`Hapus pelanggan "${cust.nama}"?`)) return;
    try {
      await apiClient.delete(`/customers/${cust.id}/`);
      fetchCustomers();
    } catch (err) {
      console.error('[CustomerSupplierApp] delete customer error:', err);
    }
  };

  const filteredCustomers = useMemo(() => {
    const inRange = (value, min, max) => {
      const num = Number(value) || 0;
      if (min !== '' && num < Number(min)) return false;
      if (max !== '' && num > Number(max)) return false;
      return true;
    };
    const inDateRange = (value, start, end) => {
      if (!start && !end) return true;
      if (!value) return false;
      if (start && value < start) return false;
      if (end && value > end) return false;
      return true;
    };

    return customers.filter(c => {
      const matchQuery = `${c.nama} ${c.handphone} ${c.email}`.toLowerCase().includes(customerQuery.toLowerCase());
      const matchGroup = selectedGroupFilter === 'Semua Tipe' || c.customer_group_nama === selectedGroupFilter;
      const matchFilterGroup = !appliedFilters.customerGroup || String(c.customer_group) === String(appliedFilters.customerGroup);
      const matchStatus =
        appliedFilters.status === 'semua' ||
        (appliedFilters.status === 'dibekukan' ? !!c.bekukan : !c.bekukan);
      const matchDob = inDateRange(c.tanggal_lahir, appliedFilters.dobStart, appliedFilters.dobEnd);
      const matchExpiry = inDateRange(c.tanggal_berakhir, appliedFilters.expiryStart, appliedFilters.expiryEnd);
      const matchDeposit = inRange(c.deposit, appliedFilters.depositMin, appliedFilters.depositMax);
      const matchLoyalty = inRange(c.loyalty_points, appliedFilters.loyaltyMin, appliedFilters.loyaltyMax);
      return matchQuery && matchGroup && matchFilterGroup && matchStatus && matchDob && matchExpiry && matchDeposit && matchLoyalty;
    });
  }, [customers, customerQuery, selectedGroupFilter, appliedFilters]);

  // ── Catatan Pelanggan ────────────────────────────────────────────
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [noteTags, setNoteTags] = useState([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteQuery, setNoteQuery] = useState('');
  const [noteCustomerFilter, setNoteCustomerFilter] = useState('');
  const [noteTagFilter, setNoteTagFilter] = useState('');
  const [noteDateStart, setNoteDateStart] = useState('');
  const [noteDateEnd, setNoteDateEnd] = useState('');

  const fetchNotes = async () => {
    setLoadingNotes(true);
    try {
      const res = await apiClient.get('/customer-notes/');
      setNotes(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      console.error('[CustomerSupplierApp] fetch notes error:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const fetchNoteTags = async () => {
    try {
      const res = await apiClient.get('/customer-note-tags/');
      setNoteTags(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      console.error('[CustomerSupplierApp] fetch note tags error:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'notes') { fetchNotes(); fetchNoteTags(); }
  }, [activeTab]);

  const openNoteCreate = () => setShowNoteModal(true);
  const openNoteEdit = (note) => setEditingNote(note);
  const closeNoteModal = () => {
    setShowNoteModal(false);
    setEditingNote(null);
  };
  const handleNoteSaved = () => {
    closeNoteModal();
    fetchNotes();
    fetchNoteTags();
  };

  const handleDeleteNote = async (note) => {
    if (!window.confirm('Hapus catatan ini?')) return;
    try {
      await apiClient.delete(`/customer-notes/${note.id}/`);
      fetchNotes();
    } catch (err) {
      console.error('[CustomerSupplierApp] delete note error:', err);
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchQuery = `${n.judul} ${n.customer_name}`.toLowerCase().includes(noteQuery.trim().toLowerCase());
      const matchCustomer = !noteCustomerFilter || String(n.customer) === String(noteCustomerFilter);
      const matchTag = !noteTagFilter || (n.tags || []).includes(noteTagFilter);
      const matchStart = !noteDateStart || (n.tanggal && n.tanggal >= noteDateStart);
      const matchEnd = !noteDateEnd || (n.tanggal && n.tanggal <= noteDateEnd);
      return matchQuery && matchCustomer && matchTag && matchStart && matchEnd;
    });
  }, [notes, noteQuery, noteCustomerFilter, noteTagFilter, noteDateStart, noteDateEnd]);

  // ── Tipe Pelanggan (CustomerGroup) ───────────────────────────────
  const [groupForm, setGroupForm] = useState({ nama: '', diskon_persen: '' });
  const [savingGroup, setSavingGroup] = useState(false);

  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.nama.trim()) return;
    setSavingGroup(true);
    setError(null);
    try {
      await apiClient.post('/customer-groups/', {
        nama: groupForm.nama.trim(),
        diskon_persen: parseFloat(groupForm.diskon_persen) || 0,
      });
      setGroupForm({ nama: '', diskon_persen: '' });
      fetchGroups();
    } catch (err) {
      console.error('[CustomerSupplierApp] save group error:', err);
      setError(extractApiError(err, 'Gagal menyimpan tipe pelanggan.'));
    } finally {
      setSavingGroup(false);
    }
  };

  const handleToggleGroup = async (grp) => {
    try {
      await apiClient.post(`/customer-groups/${grp.id}/toggle-status/`);
      fetchGroups();
    } catch (err) {
      console.error('[CustomerSupplierApp] toggle group error:', err);
    }
  };

  const handleDeleteGroup = async (grp) => {
    if (!window.confirm(`Hapus tipe pelanggan "${grp.nama}"?`)) return;
    try {
      await apiClient.delete(`/customer-groups/${grp.id}/`);
      fetchGroups();
    } catch (err) {
      console.error('[CustomerSupplierApp] delete group error:', err);
    }
  };

  // ── Ulasan Pelanggan ─────────────────────────────────────────────
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewForm, setReviewForm] = useState({ customer: '', rating: 5, comment: '' });
  const [savingReview, setSavingReview] = useState(false);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await apiClient.get('/customer-reviews/');
      setReviews(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      console.error('[CustomerSupplierApp] fetch reviews error:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reviews') fetchReviews();
  }, [activeTab]);

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) return;
    setSavingReview(true);
    setError(null);
    const selectedCustomer = customers.find(c => String(c.id) === String(reviewForm.customer));
    try {
      await apiClient.post('/customer-reviews/', {
        customer: reviewForm.customer || null,
        customer_name: selectedCustomer ? selectedCustomer.nama : 'Pelanggan Umum',
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim(),
      });
      setReviewForm({ customer: '', rating: 5, comment: '' });
      fetchReviews();
    } catch (err) {
      console.error('[CustomerSupplierApp] save review error:', err);
      setError(extractApiError(err, 'Gagal menyimpan ulasan.'));
    } finally {
      setSavingReview(false);
    }
  };

  const handleDeleteReview = async (rev) => {
    if (!window.confirm('Hapus ulasan ini?')) return;
    try {
      await apiClient.delete(`/customer-reviews/${rev.id}/`);
      fetchReviews();
    } catch (err) {
      console.error('[CustomerSupplierApp] delete review error:', err);
    }
  };

  const avgRating = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0';

  // ── Supplier ─────────────────────────────────────────────────────
  const emptySupplierForm = { nama: '', kontak_pic: '', email: '', phone: '', alamat: '', catatan: '' };
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [supplierForm, setSupplierForm] = useState(emptySupplierForm);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [supplierQuery, setSupplierQuery] = useState('');
  const [savingSupplier, setSavingSupplier] = useState(false);

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const res = await apiClient.get('/suppliers/');
      setSuppliers(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      console.error('[CustomerSupplierApp] fetch suppliers error:', err);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'supplier') fetchSuppliers();
  }, [activeTab]);

  const openSupplierCreate = () => {
    setEditingSupplier(null);
    setSupplierForm(emptySupplierForm);
    setShowSupplierForm(true);
  };

  const openSupplierEdit = (sup) => {
    setEditingSupplier(sup);
    setSupplierForm({
      nama: sup.nama || '', kontak_pic: sup.kontak_pic || '', email: sup.email || '',
      phone: sup.phone || '', alamat: sup.alamat || '', catatan: sup.catatan || '',
    });
    setShowSupplierForm(true);
  };

  const handleSubmitSupplier = async (e) => {
    e.preventDefault();
    if (!supplierForm.nama.trim()) return;
    setSavingSupplier(true);
    setError(null);
    const payload = {
      nama: supplierForm.nama.trim(),
      kontak_pic: supplierForm.kontak_pic.trim(),
      email: supplierForm.email.trim(),
      phone: supplierForm.phone.trim(),
      alamat: supplierForm.alamat.trim(),
      catatan: supplierForm.catatan.trim(),
    };
    try {
      if (editingSupplier) {
        await apiClient.patch(`/suppliers/${editingSupplier.id}/`, payload);
      } else {
        await apiClient.post('/suppliers/', payload);
      }
      setShowSupplierForm(false);
      setEditingSupplier(null);
      setSupplierForm(emptySupplierForm);
      fetchSuppliers();
    } catch (err) {
      console.error('[CustomerSupplierApp] save supplier error:', err);
      setError(extractApiError(err, 'Gagal menyimpan supplier.'));
    } finally {
      setSavingSupplier(false);
    }
  };

  const handleToggleSupplier = async (sup) => {
    try {
      await apiClient.post(`/suppliers/${sup.id}/toggle-status/`);
      fetchSuppliers();
    } catch (err) {
      console.error('[CustomerSupplierApp] toggle supplier error:', err);
    }
  };

  const handleDeleteSupplier = async (sup) => {
    if (!window.confirm(`Hapus supplier "${sup.nama}"?`)) return;
    try {
      await apiClient.delete(`/suppliers/${sup.id}/`);
      fetchSuppliers();
    } catch (err) {
      console.error('[CustomerSupplierApp] delete supplier error:', err);
    }
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => `${s.nama} ${s.kontak_pic} ${s.phone}`.toLowerCase().includes(supplierQuery.toLowerCase()));
  }, [suppliers, supplierQuery]);

  // Tab change helper
  const handleTabChange = (tabId) => {
    navigate(`/customer-supplier/${tabId}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TransaksiTopbar />
      
      {/* Tab atas — sama persis dengan Laporan.jsx, tanpa space */}
      <div className="flex border-b border-slate-200 shrink-0 bg-white">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 px-3 py-4 text-sm font-semibold text-center whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
                isActive
                  ? 'text-blue-600 border-blue-600 bg-white'
                  : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50/40 bg-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Area Konten */}
      <div className="flex-1 flex flex-col p-4 md:p-6 bg-slate-50 overflow-y-auto">
        <div className="pi-module pi-module-full">
          <section className="pi-full-panel" style={{ borderTop: 0 }}>
            <div className="pi-page-body" style={{ padding: 0 }}>
          {error && (
            <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {/* TAB 1: PELANGGAN */}
          {activeTab === 'customer' && (
            <>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
                <button onClick={() => setShowFilterDrawer(true)} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 16px', height: '38px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#475569' }}>
                  <Filter size={15} /><span>Filter</span>
                </button>
                <select value={selectedGroupFilter} onChange={e => setSelectedGroupFilter(e.target.value)} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 12px', height: '38px', fontSize: '13px', fontWeight: 'bold', width: '160px', cursor: 'pointer', color: '#475569', outline: 'none' }}>
                  <option value="Semua Tipe">Tipe Pelanggan</option>
                  {groups.map(g => <option key={g.id} value={g.nama}>{g.nama}</option>)}
                </select>
                <button
                  onClick={handleDownloadCustomers}
                  disabled={exportingCustomers}
                  style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 16px', height: '38px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: exportingCustomers ? 'default' : 'pointer', color: '#475569', opacity: exportingCustomers ? 0.6 : 1 }}
                >
                  <Download size={15} /><span>{exportingCustomers ? 'Mengekspor...' : 'Download'}</span>
                </button>
                <button onClick={() => setShowImportModal(true)} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 16px', height: '38px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#475569' }}>
                  <Upload size={15} /><span>Import</span>
                </button>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input type="text" placeholder="Cari" value={customerQuery} onChange={e => setCustomerQuery(e.target.value)} style={{ width: '100%', height: '38px', padding: '0 12px 0 36px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }} />
                  <Search size={15} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                </div>
                <button onClick={openCustomerCreate} style={{ background: '#22c55e', color: '#ffffff', border: 0, borderRadius: '6px', padding: '0 18px', height: '38px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)' }}>
                  <Plus size={16} /><span>Tambah</span>
                </button>
              </div>

              {filteredCustomers.length === 0 ? (
                <EmptyState
                  title="Eh, belum ada Pelanggan. Kelola pelanggan hingga Loyalty Point"
                  desc="Hubungkan kontak WhatsApp pelanggan Anda, kelompokkan berdasarkan grup tertentu, dan catat saldo deposit mereka untuk proses pengerjaan yang lebih cepat."
                />
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        {/* Urutan kolom mengikuti Olsera. "Tanggal Transaksi
                            Terakhir" belum ada — Order tidak terhubung ke
                            Customer; lihat catatan di HANDOVER. Kolom "Status"
                            dipertahankan meski Olsera tidak punya: tanpa itu
                            pelanggan yang dibekukan tak terlihat. */}
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap' }}>Nama</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap' }}>ID Pelanggan</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap' }}>Kode</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap' }}>Email</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap' }}>Telpon</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap' }}>Tipe</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap' }}>Jumlah deposit</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap' }}>Total Loyalty Point</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap' }}>Tanggal Aktif</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap' }}>Tanggal Berakhir</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap' }}>Status</th>
                        <th style={{ padding: '12px 16px', width: '80px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map(cust => (
                        <tr key={cust.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#1e293b' }}>{cust.nama}</td>
                          <td style={{ padding: '12px 16px', color: '#64748b' }}>{cust.id}</td>
                          <td style={{ padding: '12px 16px', color: '#334155' }}>{cust.kode_pelanggan || '-'}</td>
                          <td style={{ padding: '12px 16px', color: '#64748b' }}>{cust.email || '-'}</td>
                          <td style={{ padding: '12px 16px', color: '#334155' }}>{cust.handphone || '-'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            {cust.customer_group_nama ? (
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', background: '#dbeafe', color: '#1d4ed8' }}>{cust.customer_group_nama}</span>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: '600', color: '#16a34a', whiteSpace: 'nowrap' }}>{formatCurrency(cust.deposit)}</td>
                          <td style={{ padding: '12px 16px', color: '#334155' }}>{cust.loyalty_points ?? 0}</td>
                          {/* Tanggal Aktif = created_at. Olsera memakai waktu saat
                              pelanggan dibuat, bukan field yang bisa diubah. */}
                          <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>{formatDisplayDate(cust.created_at)}</td>
                          <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>{formatDisplayDate(cust.tanggal_berakhir)}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <StatusToggle active={cust.is_active} onToggle={() => handleToggleCustomer(cust)} />
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button onClick={() => openCustomerEdit(cust)} style={{ border: 0, background: 'transparent', color: '#2563eb', cursor: 'pointer', padding: '4px' }}><Edit2 size={16} /></button>
                              <button onClick={() => handleDeleteCustomer(cust)} style={{ border: 0, background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <CustomerFilterDrawer
                open={showFilterDrawer}
                onClose={() => setShowFilterDrawer(false)}
                groups={groups}
                value={appliedFilters}
                onApply={(filters) => { setAppliedFilters(filters); setShowFilterDrawer(false); }}
                onReset={() => setAppliedFilters(defaultCustomerFilters)}
              />

              {showImportModal && (
                <CustomerImportModal
                  onClose={() => setShowImportModal(false)}
                  onImported={() => { setShowImportModal(false); fetchCustomers(); }}
                />
              )}

              {(showAddCustomerModal || editingCustomer) && (
                <AddCustomerModal
                  customer={editingCustomer}
                  groups={groups}
                  onClose={closeCustomerModal}
                  onSaved={handleCustomerSaved}
                />
              )}
            </>
          )}

          {/* TAB 2: CATATAN PELANGGAN */}
          {activeTab === 'notes' && (
            <>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <select value={noteCustomerFilter} onChange={e => setNoteCustomerFilter(e.target.value)} style={{ ...inputSm, width: '150px', background: '#fff' }}>
                  <option value="">Pembeli</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
                </select>
                <select value={noteTagFilter} onChange={e => setNoteTagFilter(e.target.value)} style={{ ...inputSm, width: '130px', background: '#fff' }}>
                  <option value="">Tag</option>
                  {noteTags.map(t => <option key={t.id} value={t.nama}>{t.nama}</option>)}
                </select>
                <input type="date" value={noteDateStart} onChange={e => setNoteDateStart(e.target.value)} style={{ ...inputSm, width: '140px' }} />
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>-</span>
                <input type="date" value={noteDateEnd} onChange={e => setNoteDateEnd(e.target.value)} style={{ ...inputSm, width: '140px' }} />
                <button style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 16px', height: '36px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#475569' }}>
                  <Download size={15} /><span>Download</span>
                </button>
                <div style={{ flex: 1, minWidth: '160px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input type="text" placeholder="Cari" value={noteQuery} onChange={e => setNoteQuery(e.target.value)} style={{ width: '100%', height: '36px', padding: '0 12px 0 36px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }} />
                  <Search size={15} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                </div>
                <button onClick={openNoteCreate} style={{ background: '#22c55e', color: '#ffffff', border: 0, borderRadius: '6px', padding: '0 18px', height: '36px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)' }}>
                  <Plus size={16} /><span>Tambah</span>
                </button>
              </div>

              {loadingNotes ? (
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>Memuat...</p>
              ) : filteredNotes.length === 0 ? (
                <EmptyState
                  title="Belum ada catatan pelanggan"
                  desc="Catat riwayat, permintaan, atau kendala pelanggan lengkap dengan tanggal, tag, dan lampiran dokumen."
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredNotes.map(note => (
                    <div key={note.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{note.judul || '(Tanpa judul)'}</p>
                          <p style={{ fontSize: '12px', color: '#0ea5e9', fontWeight: '600', margin: '2px 0 0 0' }}>{note.customer_name || 'Umum / Anonim'}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {note.tanggal ? fmtDate(note.tanggal) : '-'}{note.jam ? ` · ${note.jam.slice(0, 5)}` : ''}
                          </span>
                          <div style={{ display: 'flex', gap: '4px', marginTop: '6px', justifyContent: 'flex-end' }}>
                            <button onClick={() => openNoteEdit(note)} style={{ border: 0, background: 'transparent', color: '#2563eb', cursor: 'pointer', padding: '2px' }}>
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteNote(note)} style={{ border: 0, background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '2px' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                      {(note.tags || []).length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          {note.tags.map(tag => (
                            <span key={tag} style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8' }}>{tag}</span>
                          ))}
                        </div>
                      )}
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                        {(note.entries || []).length} entri catatan · {(note.documents || []).length} lampiran
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {(showNoteModal || editingNote) && (
                <CustomerNoteModal
                  note={editingNote}
                  customers={customers}
                  allTags={noteTags}
                  onClose={closeNoteModal}
                  onSaved={handleNoteSaved}
                />
              )}
            </>
          )}

          {/* TAB 3: TIPE PELANGGAN */}
          {activeTab === 'types' && (
            <div style={{ display: 'grid', gridTemplateColumns: '4fr 6fr', gap: '20px' }}>
              <form onSubmit={handleAddGroup} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', height: 'fit-content' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Tambah Tipe Pelanggan</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={labelSm}>Nama Tipe *</label>
                  <input type="text" value={groupForm.nama} onChange={e => setGroupForm(p => ({ ...p, nama: e.target.value }))} placeholder="Contoh: Reseller, VIP, dll." required style={inputSm} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={labelSm}>Diskon Khusus (%)</label>
                  <input type="number" value={groupForm.diskon_persen} onChange={e => setGroupForm(p => ({ ...p, diskon_persen: e.target.value }))} placeholder="0" style={inputSm} />
                </div>
                <button type="submit" disabled={savingGroup} style={{ background: '#22c55e', color: '#fff', border: 0, borderRadius: '6px', height: '38px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', opacity: savingGroup ? 0.7 : 1 }}>
                  {savingGroup ? 'Menyimpan...' : 'Simpan Tipe'}
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Grup & Leveling Diskon</h3>
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Nama Tipe</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Potongan Diskon</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Status</th>
                        <th style={{ padding: '12px 16px', width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingGroups ? (
                        <tr><td colSpan={4} style={{ padding: '20px 16px', color: '#94a3b8' }}>Memuat...</td></tr>
                      ) : groups.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: '20px 16px', color: '#94a3b8' }}>Belum ada tipe pelanggan.</td></tr>
                      ) : groups.map(grp => (
                        <tr key={grp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#1e293b' }}>{grp.nama}</td>
                          <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0ea5e9' }}>{grp.diskon_persen}% Diskon</td>
                          <td style={{ padding: '12px 16px' }}>
                            <StatusToggle active={grp.is_active} onToggle={() => handleToggleGroup(grp)} />
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <button onClick={() => handleDeleteGroup(grp)} style={{ border: 0, background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
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
              <form onSubmit={handleAddReview} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', height: 'fit-content' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Tulis Ulasan Baru</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={labelSm}>Nama Pelanggan</label>
                  <select value={reviewForm.customer} onChange={e => setReviewForm(p => ({ ...p, customer: e.target.value }))} style={{ ...inputSm, background: '#fff' }}>
                    <option value="">-- Pilih Pelanggan (Opsional) --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={labelSm}>Rating</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={22} onClick={() => setReviewForm(p => ({ ...p, rating: star }))}
                        style={{ cursor: 'pointer', fill: star <= reviewForm.rating ? '#eab308' : 'none', stroke: star <= reviewForm.rating ? '#eab308' : '#cbd5e1', transition: 'all 0.1s' }} />
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={labelSm}>Komentar Ulasan *</label>
                  <textarea value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))} required placeholder="Berikan komentar mengenai kualitas cetak atau layanan..." rows={4} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', resize: 'vertical', outline: 'none' }} />
                </div>
                <button type="submit" disabled={savingReview} style={{ background: '#0ea5e9', color: '#fff', border: 0, borderRadius: '6px', height: '38px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', opacity: savingReview ? 0.7 : 1 }}>
                  {savingReview ? 'Mengirim...' : 'Kirim Ulasan'}
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 2px 0' }}>Rata-rata Rating Toko</h4>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Berdasarkan {reviews.length} ulasan pelanggan</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={24} style={{ fill: '#eab308', stroke: '#eab308' }} />
                    <span style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>{avgRating}</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>/ 5.0</span>
                  </div>
                </div>

                {loadingReviews ? (
                  <p style={{ fontSize: '13px', color: '#94a3b8' }}>Memuat...</p>
                ) : reviews.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#94a3b8' }}>Belum ada ulasan.</p>
                ) : reviews.map(rev => (
                  <div key={rev.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', background: '#fff', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginRight: '8px' }}>{rev.customer_name || 'Pelanggan Umum'}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{fmtDate(rev.created_at)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={14} style={{ fill: star <= rev.rating ? '#eab308' : 'none', stroke: star <= rev.rating ? '#eab308' : '#cbd5e1' }} />
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.5', fontStyle: 'italic' }}>"{rev.comment}"</p>
                    <button onClick={() => handleDeleteReview(rev)} style={{ position: 'absolute', right: '16px', bottom: '12px', border: 0, background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: KEPUASAN PELANGGAN (ilustratif — belum ada integrasi survei WA) */}
          {activeTab === 'satisfaction' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px 16px', fontSize: '12px', color: '#92400e' }}>
                Angka di halaman ini masih ilustratif — Olsera menghitungnya dari survei resi WhatsApp yang diisi pelanggan, integrasi tersebut belum tersedia di sistem ini.
              </div>

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
              {showSupplierForm && (
                <form
                  onSubmit={handleSubmitSupplier}
                  style={{
                    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '16px',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'end'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={labelSm}>Nama Supplier *</label>
                    <input type="text" value={supplierForm.nama} onChange={e => setSupplierForm(p => ({ ...p, nama: e.target.value }))} required style={inputSm} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={labelSm}>Nama Kontak (PIC)</label>
                    <input type="text" value={supplierForm.kontak_pic} onChange={e => setSupplierForm(p => ({ ...p, kontak_pic: e.target.value }))} style={inputSm} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={labelSm}>Email</label>
                    <input type="email" value={supplierForm.email} onChange={e => setSupplierForm(p => ({ ...p, email: e.target.value }))} style={inputSm} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={labelSm}>No. Telepon</label>
                    <input type="text" value={supplierForm.phone} onChange={e => setSupplierForm(p => ({ ...p, phone: e.target.value }))} style={inputSm} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={labelSm}>Alamat</label>
                    <input type="text" value={supplierForm.alamat} onChange={e => setSupplierForm(p => ({ ...p, alamat: e.target.value }))} style={inputSm} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={labelSm}>Catatan</label>
                    <input type="text" value={supplierForm.catatan} onChange={e => setSupplierForm(p => ({ ...p, catatan: e.target.value }))} style={inputSm} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="submit" disabled={savingSupplier} style={{ flex: 1, background: '#0ea5e9', color: '#fff', border: 0, borderRadius: '6px', height: '36px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', opacity: savingSupplier ? 0.7 : 1 }}>
                      {savingSupplier ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button type="button" onClick={() => { setShowSupplierForm(false); setEditingSupplier(null); }} style={{ background: '#e2e8f0', color: '#475569', border: 0, borderRadius: '6px', height: '36px', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  </div>
                </form>
              )}

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
                <button style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 16px', height: '38px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#475569' }}>
                  <Filter size={15} /><span>Filter</span>
                </button>
                <button style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 16px', height: '38px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#475569' }}>
                  <Download size={15} /><span>Download</span>
                </button>
                <button style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 16px', height: '38px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#475569' }}>
                  <Upload size={15} /><span>Import</span>
                </button>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input type="text" placeholder="Cari Supplier..." value={supplierQuery} onChange={e => setSupplierQuery(e.target.value)} style={{ width: '100%', height: '38px', padding: '0 12px 0 36px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }} />
                  <Search size={15} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                </div>
                <button onClick={openSupplierCreate} style={{ background: '#22c55e', color: '#ffffff', border: 0, borderRadius: '6px', padding: '0 18px', height: '38px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)' }}>
                  <Plus size={16} /><span>Tambah</span>
                </button>
              </div>

              {loadingSuppliers ? (
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>Memuat...</p>
              ) : filteredSuppliers.length === 0 ? (
                <div style={{ display: 'grid', placeItems: 'center', minHeight: '160px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', color: '#64748b', fontSize: '13px' }}>
                  Belum ada supplier bahan baku ditambahkan.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Nama Pemasok / Toko</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Kontak PIC</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>No. Telepon</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Alamat</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Status</th>
                        <th style={{ padding: '12px 16px', width: '80px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSuppliers.map(sup => (
                        <tr key={sup.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#1e293b' }}>{sup.nama}</td>
                          <td style={{ padding: '12px 16px', color: '#334155' }}>{sup.kontak_pic || '-'}</td>
                          <td style={{ padding: '12px 16px', color: '#334155' }}>{sup.phone || '-'}</td>
                          <td style={{ padding: '12px 16px', color: '#64748b' }}>{sup.alamat || '-'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <StatusToggle active={sup.is_active} onToggle={() => handleToggleSupplier(sup)} />
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button onClick={() => openSupplierEdit(sup)} style={{ border: 0, background: 'transparent', color: '#2563eb', cursor: 'pointer', padding: '4px' }}><Edit2 size={16} /></button>
                              <button onClick={() => handleDeleteSupplier(sup)} style={{ border: 0, background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                            </div>
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
      </div>
    </div>
  );
}

export default function CustomerSupplierApp() {
  return (
    <TransaksiProvider>
      <CustomerSupplierInner />
    </TransaksiProvider>
  );
}
