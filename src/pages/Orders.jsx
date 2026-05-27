import apiClient from '../api/apiClient';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Download,
  Plus,
  FileText,
  FileClock,
  FileCheck,
  CheckSquare,
  XCircle,
  Search,
  Calendar,
  Edit2,
  X,
  UserCheck,
  Trash2,
  Printer,
  Truck,
  DollarSign,
} from 'lucide-react';
import OrderInputForm from '../components/orders/OrderInputForm';

export default function Orders() {
  const { user, businessSettings } = useAuth();
  const [orders, setOrders] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editModalData, setEditModalData] = useState(null);
  const [printOrder, setPrintOrder] = useState(null); // Resi Thermal
  const [printInvoiceOrder, setPrintInvoiceOrder] = useState(null); // Invoice A4
  const [printSuratJalanOrder, setPrintSuratJalanOrder] = useState(null); // Surat Jalan
  const [printSpkOrder, setPrintSpkOrder] = useState(null); // SPK Produksi (Baru)

  // State untuk Dropdown Menu Aksi Cetak per Order
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  const isManager = ['owner', 'manager'].includes(user?.role);

  // Fetch Data API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/orders/');
      setOrders(res.data);
    } catch (err) {
      console.error('Gagal menarik data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Fetch daftar staff untuk dropdown assign
    apiClient
      .get('/users/')
      .then((res) => {
        setStaffList(res.data.filter((u) => u.role === 'staff'));
      })
      .catch(() => {});
  }, []);

  // Tutup dropdown jika user klik di luar area tabel
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getStatusType = (statusText = '') => {
    if (statusText === 'batal') return 'cancelled';
    if (statusText === 'review') return 'pending';
    if (statusText === 'proses') return 'printing';
    if (statusText === 'selesai') return 'completed';
    return 'other';
  };

  const stats = useMemo(() => {
    const counts = {
      pending: 0,
      progress: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
      piutang: 0,
      total_piutang_amount: 0,
    };
    orders.forEach((order) => {
      const type = getStatusType(order.status_global);
      if (type === 'pending') counts.pending++;
      if (type === 'printing') counts.progress++;
      if (type === 'ready') counts.ready++;
      if (type === 'completed') counts.completed++;
      if (type === 'cancelled') counts.cancelled++;

      if (order.sisa_tagihan > 0 && order.status_global !== 'batal') {
        counts.piutang++;
        counts.total_piutang_amount += order.sisa_tagihan;
      }
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const searchData = `${order.id} ${(order.nama || '').toLowerCase()} ${(order.nomor_wa || '').toLowerCase()}`;
      const matchesSearch = searchData.includes(searchQuery.toLowerCase());

      const type = getStatusType(order.status_global);
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'piutang'
          ? order.sisa_tagihan > 0 && order.status_global !== 'batal'
          : type === activeTab);

      return matchesSearch && matchesTab;
    });
  }, [orders, searchQuery, activeTab]);

  const renderBadge = (statusText = '') => {
    const type = getStatusType(statusText);
    if (type === 'cancelled') {
      return (
        <span className="px-1.5 py-0.5 rounded-[4px] text-[8.5px] font-bold bg-red-100 text-red-700 uppercase tracking-wider flex items-center gap-1 w-max mx-auto">
          <X className="w-2.5 h-2.5" /> Cancelled
        </span>
      );
    }
    if (type === 'pending') {
      return (
        <span className="px-1.5 py-0.5 rounded-[4px] text-[8.5px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
          Pending
        </span>
      );
    }
    if (type === 'printing') {
      return (
        <span className="px-1.5 py-0.5 rounded-[4px] text-[8.5px] font-bold bg-orange-100 text-orange-700 uppercase tracking-wider">
          Printing
        </span>
      );
    }
    if (type === 'ready') {
      return (
        <span className="px-1.5 py-0.5 rounded-[4px] text-[8.5px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">
          Ready
        </span>
      );
    }
    if (type === 'completed') {
      return (
        <span className="px-1.5 py-0.5 rounded-[4px] text-[8.5px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">
          Completed
        </span>
      );
    }
    return null;
  };

  const formatRupiah = (angka) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(angka || 0);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    const form = e.target;
    const newStatus = form.status.value;
    const staffId = form.assign_staff?.value;
    const jumlahBayar = parseInt(form.jumlah_bayar?.value || '0');
    const metodePembayaran = form.metode_pembayaran?.value || 'tunai';

    try {
      // 1. Update status global
      await apiClient.patch(`/orders/${editModalData.id}/`, {
        status_global: newStatus,
      });

      // 2. Tambah Pembayaran jika diisi
      if (jumlahBayar > 0) {
        await apiClient.post(`/orders/${editModalData.id}/bayar/`, {
          jumlah_bayar: jumlahBayar,
          metode_pembayaran: metodePembayaran,
        });
      }

      // 3. Assign Staff PIC jika diisi
      let updatedOrderData = null;
      if (staffId && staffId !== '') {
        await apiClient.post(`/orders/${editModalData.id}/assign/`, {
          staff_id: parseInt(staffId),
        });
      }

      // Tarik data pesanan terbaru setelah semua update selesai
      const orderRes = await apiClient.get(`/orders/${editModalData.id}/`);
      updatedOrderData = orderRes.data;

      setEditModalData(null);
      fetchOrders();

      // Jika ada PIC yang di-assign, otomatis tampilkan SPK cetak
      if (staffId && staffId !== '' && updatedOrderData) {
        setPrintSpkOrder(updatedOrderData);
      }
    } catch (error) {
      console.error('Gagal update:', error);
      alert('Gagal menyimpan perubahan.');
    }
  };

  const handleDeleteOrder = async (order) => {
    const konfirmasi = window.confirm(
      `Apakah Anda yakin ingin menghapus permanen order ${order.id}?\n\nNama: ${order.nama}\n\nSemua item dan job terkait akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.`
    );
    if (!konfirmasi) return;
    try {
      await apiClient.delete(`/orders/${order.id}/`);
      fetchOrders();
    } catch (error) {
      console.error('Gagal hapus order:', error);
      alert('Gagal menghapus order.');
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/export/orders/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'orders.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed', error);
      alert('Gagal mengekspor data.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Orders</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">Manage and track all jobs</p>
        </div>
        <div className="flex items-center gap-2">
          {isManager && (
            <button
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Export Excel
            </button>
          )}
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Order
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-6">
        <StatCard
          title="Pending"
          icon={FileText}
          count={stats.pending}
          iconColor="text-slate-400"
        />
        <StatCard
          title="In Progress"
          icon={FileClock}
          count={stats.progress}
          iconColor="text-orange-500"
        />
        <StatCard title="Ready" icon={FileCheck} count={stats.ready} iconColor="text-emerald-500" />
        <StatCard
          title="Completed"
          icon={CheckSquare}
          count={stats.completed}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Cancelled"
          icon={XCircle}
          count={stats.cancelled}
          iconColor="text-red-500"
        />
        <StatCard
          title="Belum Lunas"
          icon={DollarSign}
          count={stats.piutang}
          iconColor="text-red-600"
          subtitle={formatRupiah(stats.total_piutang_amount)}
        />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
        <div className="flex gap-1 bg-slate-100/50 p-1 rounded-md border border-slate-200 overflow-x-auto">
          {['all', 'pending', 'printing', 'ready', 'completed', 'cancelled', 'piutang'].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? 'bg-white shadow-sm border border-slate-200 text-slate-900'
                    : tab === 'cancelled' || tab === 'piutang'
                      ? 'text-red-500 hover:text-red-700'
                      : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab === 'all'
                  ? 'All Jobs'
                  : tab === 'piutang'
                    ? 'Piutang'
                    : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            )
          )}
        </div>
        <div className="relative w-full sm:w-56 shrink-0">
          <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders..."
            className="w-full pl-8 pr-3 py-1 text-[11px] border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900 outline-none bg-slate-50/50"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-1">
        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-[12px] font-bold text-slate-800">
            Job List{' '}
            <span className="text-[10px] text-slate-500 font-normal ml-1">
              ({filteredOrders.length} items)
            </span>
          </h3>
        </div>
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-[10px] border-collapse min-w-[800px]">
            <thead className="bg-white text-slate-500 border-b border-slate-200 font-bold">
              <tr>
                <th className="px-3 py-2">Job #</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2 w-48">Description</th>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2 text-right">Price</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <SkeletonRow />
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-3 py-6 text-center text-slate-400 text-[10px] italic"
                  >
                    No jobs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const type = getStatusType(order.status_global);
                  const isCancelled = type === 'cancelled';

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/50 transition-colors ${isCancelled ? 'opacity-60 bg-red-50/20 hover:bg-red-50/40' : ''}`}
                    >
                      <td
                        className={`px-3 py-2 font-bold ${isCancelled ? 'line-through text-slate-500' : 'text-slate-900'}`}
                      >
                        {order.id}
                      </td>
                      <td className="px-3 py-2">
                        <p
                          className={`font-bold ${isCancelled ? 'text-slate-600' : 'text-slate-900'}`}
                        >
                          {order.nama}
                        </p>
                        <p className="text-[9px] text-slate-500">{order.nomor_wa}</p>
                      </td>
                      <td className="px-3 py-2 text-slate-600 truncate max-w-[12rem]">
                        <div className="font-medium text-indigo-700">
                          {order.items?.map((i) => i.jenis_produk).join(', ') || '-'}
                        </div>
                        <div
                          className="text-[10px] text-slate-400 mt-0.5 truncate"
                          title={order.catatan_pelanggan}
                        >
                          {order.catatan_pelanggan || '-'}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {(() => {
                          const staffs = [];
                          order.items?.forEach((item) => {
                            item.jobs?.forEach((job) => {
                              if (job.pic_nama && !staffs.includes(job.pic_nama)) {
                                staffs.push(job.pic_nama);
                              }
                            });
                          });
                          if (staffs.length === 0)
                            return <span className="text-slate-400 italic">Belum diset</span>;
                          return <span className="font-bold">{staffs.join(', ')}</span>;
                        })()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="font-bold text-slate-900">
                          {formatRupiah(order.total_harga)}
                        </div>
                        <div
                          className={`text-[9px] font-semibold ${order.sisa_tagihan <= 0 ? 'text-emerald-500' : 'text-red-500'}`}
                        >
                          {order.sisa_tagihan <= 0
                            ? 'LUNAS'
                            : `Sisa: ${formatRupiah(order.sisa_tagihan)}`}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">{renderBadge(order.status_global)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1.5 relative">
                          {/* DROPDOWN TERPADU CETAK */}
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() =>
                                setActiveDropdownId(activeDropdownId === order.id ? null : order.id)
                              }
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-[4px] text-[10px] font-bold flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                            >
                              <Printer className="w-3 h-3" /> Cetak
                            </button>

                            {activeDropdownId === order.id && (
                              <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 shadow-xl rounded-lg z-50 py-1 overflow-hidden animate-fade-in text-left">
                                <button
                                  onClick={() => {
                                    setPrintOrder(order);
                                    setActiveDropdownId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-[11px] font-medium text-slate-700 flex items-center gap-2 border-b border-slate-100 cursor-pointer"
                                >
                                  <Printer size={13} className="text-slate-400" /> Resi Thermal
                                </button>
                                <button
                                  onClick={() => {
                                    setPrintInvoiceOrder(order);
                                    setActiveDropdownId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-blue-50 text-[11px] font-medium text-blue-700 flex items-center gap-2 border-b border-slate-100 cursor-pointer"
                                >
                                  <FileText size={13} className="text-blue-500" /> Invoice Resmi
                                </button>
                                <button
                                  onClick={() => {
                                    setPrintSuratJalanOrder(order);
                                    setActiveDropdownId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-[11px] font-medium text-emerald-700 flex items-center gap-2 border-b border-slate-100 cursor-pointer"
                                >
                                  <Truck size={13} className="text-emerald-500" /> Surat Jalan
                                </button>
                                <button
                                  onClick={() => {
                                    setPrintSpkOrder(order);
                                    setActiveDropdownId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-orange-50 text-[11px] font-medium text-orange-700 flex items-center gap-2 cursor-pointer"
                                >
                                  <FileCheck size={13} className="text-orange-500" /> SPK Produksi
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="w-px h-4 bg-slate-200 mx-0.5"></div>

                          {/* ACTION ASLI (Edit, Cancel, Delete) */}
                          <button
                            onClick={() => setEditModalData(order)}
                            title="Edit Status"
                            className="p-1 bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 rounded-[4px] transition-colors shadow-sm cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {type !== 'cancelled' && type !== 'completed' && (
                            <button
                              onClick={async () => {
                                if (window.confirm(`Batalkan pesanan ${order.id}?`)) {
                                  await apiClient.patch(`/orders/${order.id}/`, {
                                    status_global: 'batal',
                                  });
                                  fetchOrders();
                                }
                              }}
                              title="Batalkan Order"
                              className="p-1 bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-[4px] transition-colors shadow-sm cursor-pointer"
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          )}
                          {isManager && (
                            <button
                              onClick={() => handleDeleteOrder(order)}
                              title="Hapus Permanen"
                              className="p-1 bg-white border border-slate-200 text-slate-300 hover:bg-red-100 hover:text-red-700 hover:border-red-300 rounded-[4px] transition-colors shadow-sm cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPONENT FORM INPUT FULLSCREEN */}
      <OrderInputForm
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSuccess={() => {
          setIsManualModalOpen(false);
          fetchOrders(); // Refresh table
        }}
      />

      {/* EDIT STATUS MODAL */}
      {editModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] overflow-y-auto w-full h-full flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <form onSubmit={handleUpdateStatus}>
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-[14px] font-bold text-slate-900">Update Job Status</h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {editModalData.id} - {editModalData.nama}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditModalData(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-800">Job Status</label>
                  <select
                    name="status"
                    defaultValue={editModalData.status_global}
                    className="w-full text-[12px] border border-slate-200 bg-white rounded-md px-3 py-2 focus:ring-1 focus:ring-slate-900 outline-none"
                  >
                    <option value="review">Pending / Review</option>
                    <option value="proses">In Progress / Proses Cetak</option>
                    <option value="selesai">Completed / Selesai</option>
                    <option value="batal" className="text-red-500 font-bold">
                      Cancelled / Batal
                    </option>
                  </select>
                </div>

                {isManager && (
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-800 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                      Assign Staff (PIC)
                    </label>
                    <select
                      name="assign_staff"
                      className="w-full text-[12px] border border-slate-200 bg-white rounded-md px-3 py-2 focus:ring-1 focus:ring-slate-900 outline-none"
                    >
                      <option value="">-- Pilih Staff --</option>
                      {staffList.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.username}
                          {staff.divisi_nama ? ` (${staff.divisi_nama})` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 italic">
                      Memilih staff akan otomatis membuat job di Papan Produksi
                    </p>
                  </div>
                )}

                {editModalData.sisa_tagihan > 0 && (
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[12px] font-bold text-slate-800">
                        Pembayaran & Pelunasan
                      </label>
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        Piutang: {formatRupiah(editModalData.sisa_tagihan)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500">
                          Bayar Cicilan / Pelunasan (Rp)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            name="jumlah_bayar"
                            placeholder="Cth: 50000"
                            className="w-full text-[12px] border border-slate-200 bg-white rounded-md pl-3 pr-12 py-2 focus:ring-1 focus:ring-slate-900 outline-none"
                            id="jumlah_bayar_input"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById('jumlah_bayar_input');
                              if (input) input.value = editModalData.sisa_tagihan;
                            }}
                            className="absolute right-1 top-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[9px] rounded cursor-pointer"
                          >
                            Lunas
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500">
                          Metode Pembayaran
                        </label>
                        <select
                          name="metode_pembayaran"
                          defaultValue={editModalData.metode_pembayaran || 'tunai'}
                          className="w-full text-[12px] border border-slate-200 bg-white rounded-md px-2 py-2 focus:ring-1 focus:ring-slate-900 outline-none"
                        >
                          <option value="tunai">Tunai / Kas</option>
                          <option value="transfer">Transfer Bank</option>
                          <option value="qris">QRIS / E-Wallet</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalData(null)}
                  className="px-4 py-1.5 border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-black text-white rounded-md text-[11px] font-bold hover:bg-slate-800 shadow-sm transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CETAK RESI THERMAL MODAL */}
      {printOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm flex flex-col overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-slate-50 no-print">
              <h3 className="font-bold text-slate-800 text-[13px] flex items-center gap-2">
                <Printer size={14} /> Cetak Resi
              </h3>
              <button
                onClick={() => setPrintOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 receipt-print-area text-slate-900 text-sm font-mono max-h-[70vh] overflow-y-auto bg-white">
              <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-4">
                <h2 className="font-extrabold text-[16px] uppercase tracking-widest text-slate-900">
                  {businessSettings?.nama_bisnis || 'Brandy'}
                </h2>
                <p className="text-[11px] text-slate-500 mt-1">{businessSettings?.alamat || 'Jl. Produksi No. 123, Kota'}</p>
                <p className="text-[11px] text-slate-500">Telp: {businessSettings?.no_telepon || '0812-3456-7890'}</p>
              </div>

              <div className="space-y-1 mb-4 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Order:</span>
                  <span className="font-bold">{printOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal:</span>
                  <span>{new Date(printOrder.waktu).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pelanggan:</span>
                  <span className="font-bold">{printOrder.nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">No. WA:</span>
                  <span>{printOrder.nomor_wa}</span>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-3 mb-4 space-y-3">
                {printOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex flex-col text-[11px]">
                    <div className="flex justify-between font-bold">
                      <span>
                        {item.qty}x {item.jenis_produk}
                      </span>
                      <span>{formatRupiah(item.harga_jual || 0)}</span>
                    </div>
                    {item.keterangan_detail && (
                      <span className="text-[10px] text-slate-500 mt-0.5 max-w-[80%] break-words">
                        {item.keterangan_detail}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px] font-bold">
                <div className="flex justify-between">
                  <span>TOTAL:</span>
                  <span>{formatRupiah(printOrder.total_harga || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>DP / BAYAR:</span>
                  <span>{formatRupiah(printOrder.dp_dibayar || 0)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-dashed border-slate-300 text-indigo-700">
                  <span>SISA TAGIHAN:</span>
                  <span>
                    {printOrder.sisa_tagihan <= 0
                      ? 'LUNAS'
                      : formatRupiah(printOrder.sisa_tagihan || 0)}
                  </span>
                </div>
              </div>

              <div className="text-center mt-6 text-[10px] text-slate-500 italic">
                <p>Terima kasih telah mempercayakan</p>
                <p>kebutuhan advertising Anda pada kami.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 no-print">
              <button
                onClick={() => setPrintOrder(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-md hover:bg-slate-100 cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-md hover:bg-indigo-700 flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Printer size={14} /> Cetak Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE A4 MODAL */}
      {printInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-start justify-center p-4 backdrop-blur-[2px] overflow-y-auto pt-10 pb-10">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col border border-slate-200 mt-4">
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-slate-50 no-print">
              <h3 className="font-bold text-slate-800 text-[13px] flex items-center gap-2">
                <FileText size={14} /> Preview Invoice A4
              </h3>
              <button
                onClick={() => setPrintInvoiceOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-8 print-area bg-white text-slate-800 text-[12px]">
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
                <div>
                  <h1 className="text-2xl font-black tracking-widest uppercase text-slate-900">
                    INVOICE
                  </h1>
                  <p className="text-slate-500 font-mono mt-1">#{printInvoiceOrder.id}</p>
                </div>
                <div className="text-right">
                  <h2 className="font-bold text-[14px]">{businessSettings?.nama_bisnis || 'Brandy'}</h2>
                  <p className="text-slate-500 mt-0.5">{businessSettings?.alamat || 'Jl. Produksi No. 123, Kota'}</p>
                  <p className="text-slate-500">WA: {businessSettings?.no_telepon || '0812-3456-7890'}</p>
                </div>
              </div>

              <div className="flex justify-between mb-8">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    DITAGIHKAN KEPADA:
                  </p>
                  <p className="font-bold text-[14px]">{printInvoiceOrder.nama}</p>
                  <p className="text-slate-600">{printInvoiceOrder.nomor_wa}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    TANGGAL INVOICE:
                  </p>
                  <p className="font-bold">
                    {new Date(printInvoiceOrder.waktu).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-1 capitalize">
                    Pembayaran: {printInvoiceOrder.metode_pembayaran || 'Tunai'}
                  </p>
                </div>
              </div>

              <table className="w-full text-left border-collapse mb-8">
                <thead>
                  <tr className="bg-slate-100 border-y border-slate-300">
                    <th className="py-2 px-2 font-bold text-slate-700 w-10 text-center">NO</th>
                    <th className="py-2 px-2 font-bold text-slate-700">DESKRIPSI PRODUK</th>
                    <th className="py-2 px-2 font-bold text-slate-700 text-center">UKURAN</th>
                    <th className="py-2 px-2 font-bold text-slate-700 text-center">QTY</th>
                    <th className="py-2 px-2 font-bold text-slate-700 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {printInvoiceOrder.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-2 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-2">
                        <p className="font-bold text-slate-800">{item.jenis_produk}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">
                          Bahan: {item.bahan || '-'}
                        </p>
                        {item.keterangan_detail && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5">
                            {item.keterangan_detail}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {parseFloat(item.panjang) > 0 && parseFloat(item.lebar) > 0
                          ? `${item.panjang} x ${item.lebar} m`
                          : '-'}
                      </td>
                      <td className="py-3 px-2 text-center font-bold">{item.qty}</td>
                      <td className="py-3 px-2 text-right font-bold">
                        {formatRupiah(item.harga_jual)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end mb-12">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>
                      {formatRupiah(
                        printInvoiceOrder.items?.reduce((s, i) => s + (i.harga_jual || 0), 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Diskon ({printInvoiceOrder.diskon_persen || 0}%)</span>
                    <span>
                      -{' '}
                      {formatRupiah(
                        ((printInvoiceOrder.items?.reduce((s, i) => s + (i.harga_jual || 0), 0) ||
                          0) *
                          (printInvoiceOrder.diskon_persen || 0)) /
                          100
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-[14px] border-t border-slate-300 pt-2 text-slate-900">
                    <span>TOTAL</span>
                    <span>{formatRupiah(printInvoiceOrder.total_harga)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>DP Dibayar</span>
                    <span>{formatRupiah(printInvoiceOrder.dp_dibayar)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[14px] bg-slate-100 p-2 rounded border border-slate-200 mt-2">
                    <span>SISA TAGIHAN</span>
                    <span
                      className={
                        printInvoiceOrder.sisa_tagihan <= 0 ? 'text-emerald-600' : 'text-red-600'
                      }
                    >
                      {printInvoiceOrder.sisa_tagihan <= 0
                        ? 'LUNAS'
                        : formatRupiah(printInvoiceOrder.sisa_tagihan)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end mt-10">
                <div className="text-[10px] text-slate-500 space-y-1">
                  <p className="font-bold text-slate-700">Metode Pembayaran:</p>
                  <p>{businessSettings?.deskripsi || `Transfer BCA: 1234567890 a/n ${businessSettings?.nama_bisnis || 'Brandy'}`}</p>
                </div>
                <div className="text-center w-40">
                  <p className="mb-12">Hormat Kami,</p>
                  <p className="font-bold border-t border-slate-400 pt-1">Finance Dept.</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 no-print">
              <button
                onClick={() => setPrintInvoiceOrder(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-md hover:bg-slate-100 cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-md hover:bg-blue-700 flex items-center gap-2 cursor-pointer"
              >
                <Printer size={14} /> Cetak (Ctrl+P)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SURAT JALAN MODAL */}
      {printSuratJalanOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-start justify-center p-4 backdrop-blur-[2px] overflow-y-auto pt-10 pb-10">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col border border-slate-200 mt-4">
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-slate-50 no-print">
              <h3 className="font-bold text-slate-800 text-[13px] flex items-center gap-2">
                <Truck size={14} /> Preview Surat Jalan
              </h3>
              <button
                onClick={() => setPrintSuratJalanOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-8 print-area bg-white text-slate-800 text-[12px]">
              <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
                <h1 className="text-xl font-black tracking-widest uppercase text-slate-900">
                  SURAT JALAN
                </h1>
                <p className="text-slate-500 font-mono mt-1">
                  Ref Order: #{printSuratJalanOrder.id}
                </p>
              </div>

              <div className="flex justify-between mb-8">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    PENERIMA:
                  </p>
                  <p className="font-bold text-[14px]">{printSuratJalanOrder.nama}</p>
                  <p className="text-slate-600">{printSuratJalanOrder.nomor_wa}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    TANGGAL KIRIM:
                  </p>
                  <p className="font-bold border-b border-slate-300 pb-1 w-32 ml-auto">&nbsp;</p>
                </div>
              </div>

              <table className="w-full text-left border-collapse mb-16 border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="py-2 px-3 font-bold text-slate-700 w-10 text-center border-r border-slate-300">
                      NO
                    </th>
                    <th className="py-2 px-3 font-bold text-slate-700 border-r border-slate-300">
                      NAMA BARANG / DESKRIPSI
                    </th>
                    <th className="py-2 px-3 font-bold text-slate-700 text-center border-r border-slate-300">
                      UKURAN
                    </th>
                    <th className="py-2 px-3 font-bold text-slate-700 text-center">QTY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {printSuratJalanOrder.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-3 text-center border-r border-slate-300">{idx + 1}</td>
                      <td className="py-3 px-3 border-r border-slate-300">
                        <p className="font-bold text-slate-800">{item.jenis_produk}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">
                          Bahan: {item.bahan || '-'}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-center border-r border-slate-300">
                        {parseFloat(item.panjang) > 0 && parseFloat(item.lebar) > 0
                          ? `${item.panjang} x ${item.lebar} m`
                          : '-'}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-[14px]">{item.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-start mt-10">
                <div className="text-center w-40">
                  <p className="mb-16">Penerima,</p>
                  <p className="font-bold border-t border-slate-400 pt-1">
                    ( {printSuratJalanOrder.nama} )
                  </p>
                </div>
                <div className="text-center w-40">
                  <p className="mb-16">Pengirim,</p>
                  <p className="font-bold border-t border-slate-400 pt-1">( Kurir / Staff )</p>
                </div>
                <div className="text-center w-40">
                  <p className="mb-16">Mengetahui,</p>
                  <p className="font-bold border-t border-slate-400 pt-1">{businessSettings?.nama_bisnis || 'Brandy'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 no-print">
              <button
                onClick={() => setPrintSuratJalanOrder(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-md hover:bg-slate-100 cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-md hover:bg-emerald-700 flex items-center gap-2 cursor-pointer"
              >
                <Printer size={14} /> Cetak Surat Jalan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SURAT PERINTAH KERJA (SPK) MODAL */}
      {printSpkOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-start justify-center p-4 backdrop-blur-[2px] overflow-y-auto pt-10 pb-10">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col border border-slate-200 mt-4">
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-slate-50 no-print">
              <h3 className="font-bold text-slate-800 text-[13px] flex items-center gap-2">
                <FileCheck size={14} className="text-orange-500" /> Preview SPK Produksi
              </h3>
              <button
                onClick={() => setPrintSpkOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Area SPK yang diprint (TANPA HARGA JUAL) */}
            <div className="p-8 print-area bg-white text-slate-800 text-[12px]">
              <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
                <h1 className="text-xl font-black tracking-widest uppercase text-slate-900">
                  SURAT PERINTAH KERJA (SPK)
                </h1>
                <p className="text-slate-500 font-mono mt-1">No. Order: #{printSpkOrder.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    NAMA PELANGGAN:
                  </p>
                  <p className="font-bold text-[13px]">{printSpkOrder.nama}</p>
                  <p className="text-slate-500">{printSpkOrder.nomor_wa}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    TANGGAL ORDER / MASUK:
                  </p>
                  <p className="font-bold">
                    {new Date(printSpkOrder.waktu).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {printSpkOrder.catatan_pelanggan && (
                <div className="bg-slate-50 border border-slate-200 rounded p-3 mb-6">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Catatan Global / Instruksi Khusus CS:
                  </p>
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {printSpkOrder.catatan_pelanggan}
                  </p>
                </div>
              )}

              <table className="w-full text-left border-collapse mb-10 border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="py-2 px-3 font-bold text-slate-700 w-10 text-center border-r border-slate-300">
                      NO
                    </th>
                    <th className="py-2 px-3 font-bold text-slate-700 border-r border-slate-300">
                      BARANG / SPEK TEKNIS
                    </th>
                    <th className="py-2 px-3 font-bold text-slate-700 text-center border-r border-slate-300">
                      UKURAN (PxL)
                    </th>
                    <th className="py-2 px-3 font-bold text-slate-700 text-center border-r border-slate-300">
                      QTY
                    </th>
                    <th className="py-2 px-3 font-bold text-slate-700">KETERANGAN / FINISHING</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {printSpkOrder.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-3 text-center border-r border-slate-300">{idx + 1}</td>
                      <td className="py-3 px-3 border-r border-slate-300">
                        <p className="font-bold text-slate-800">{item.jenis_produk}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">
                          Bahan: {item.bahan || '-'}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-center border-r border-slate-300">
                        {parseFloat(item.panjang) > 0 && parseFloat(item.lebar) > 0
                          ? `${item.panjang} x ${item.lebar} m`
                          : '-'}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-[14px] border-r border-slate-300">
                        {item.qty}
                      </td>
                      <td className="py-3 px-3">
                        <p className="text-[11px] text-slate-700 whitespace-pre-wrap">
                          {item.keterangan_detail || '-'}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Lembar Checklist Alur Produksi */}
              <div className="border border-slate-300 rounded p-4 mb-8">
                <p className="text-[11px] font-bold text-slate-600 mb-3 uppercase tracking-wider">
                  Lembar Checklist Alur Produksi:
                </p>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="border border-slate-200 rounded p-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-4">
                      1. Desain / Layout
                    </p>
                    <div className="h-10 border-b border-dashed border-slate-300 mb-1"></div>
                    <p className="text-[9px] text-slate-500">Nama & Paraf</p>
                  </div>
                  <div className="border border-slate-200 rounded p-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-4">
                      2. Proses Cetak
                    </p>
                    <div className="h-10 border-b border-dashed border-slate-300 mb-1"></div>
                    <p className="text-[9px] text-slate-500">Nama & Paraf</p>
                  </div>
                  <div className="border border-slate-200 rounded p-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-4">
                      3. Finishing
                    </p>
                    <div className="h-10 border-b border-dashed border-slate-300 mb-1"></div>
                    <p className="text-[9px] text-slate-500">Nama & Paraf</p>
                  </div>
                  <div className="border border-slate-200 rounded p-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-4">
                      4. Quality Control
                    </p>
                    <div className="h-10 border-b border-dashed border-slate-300 mb-1"></div>
                    <p className="text-[9px] text-slate-500">Nama & Paraf</p>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 italic text-center mt-6">
                <p>
                  Dokumen Internal Produksi {businessSettings?.nama_bisnis || 'Brandy'}. Harap kembalikan ke meja CS setelah
                  selesai.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 no-print">
              <button
                onClick={() => setPrintSpkOrder(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-md hover:bg-slate-100 cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-orange-600 text-white font-bold text-xs rounded-md hover:bg-orange-700 flex items-center gap-2 cursor-pointer"
              >
                <Printer size={14} /> Cetak SPK Produksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-komponen StatCard
function StatCard({ title, icon: Icon, count, iconColor, subtitle }) {
  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-20">
      <div className="flex justify-between items-start">
        <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">{title}</p>
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
      </div>
      <div>
        <h3 className="text-xl font-extrabold text-slate-900">{count}</h3>
        {subtitle && (
          <p className="text-[9px] text-red-500 font-bold truncate mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// Sub-komponen Skeleton Table Row
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-3 py-3">
        <div className="h-3 bg-slate-200 rounded w-16"></div>
      </td>
      <td className="px-3 py-3">
        <div className="h-3 bg-slate-200 rounded w-20 mb-1"></div>
        <div className="h-2 bg-slate-200 rounded w-16"></div>
      </td>
      <td className="px-3 py-3">
        <div className="h-3 bg-slate-200 rounded w-full"></div>
      </td>
      <td className="px-3 py-3">
        <div className="h-3 bg-slate-200 rounded w-16"></div>
      </td>
      <td className="px-3 py-3">
        <div className="h-3 bg-slate-200 rounded w-16 ms-auto"></div>
      </td>
      <td className="px-3 py-3">
        <div className="h-3 bg-slate-200 rounded w-16"></div>
      </td>
      <td className="px-3 py-3">
        <div className="h-5 bg-slate-200 rounded w-8 mx-auto"></div>
      </td>
    </tr>
  );
}
