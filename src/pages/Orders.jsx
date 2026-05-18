import apiClient from '../api/apiClient';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Download, Plus, FileText, FileClock, FileCheck, 
  CheckSquare, XCircle, Search, Calendar, Edit2, X, UserCheck, Trash2, Printer
} from 'lucide-react';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editModalData, setEditModalData] = useState(null);
  const [printOrder, setPrintOrder] = useState(null);

  const isManager = ['owner', 'manager'].includes(user?.role);

  // Fetch Data API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/orders/');
      setOrders(res.data);
    } catch (err) {
      console.error("Gagal menarik data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Fetch daftar staff untuk dropdown assign
    apiClient.get('/users/').then(res => {
      setStaffList(res.data.filter(u => u.role === 'staff'));
    }).catch(() => {});
  }, []);

  // Isu 2 Fix — Menyesuaikan dengan value status_global Django
  const getStatusType = (statusText = '') => {
    if (statusText === 'batal') return 'cancelled';
    if (statusText === 'review') return 'pending';
    if (statusText === 'proses') return 'printing';
    if (statusText === 'selesai') return 'completed';
    return 'other';
  };

  // Hitung jumlah stats
  const stats = useMemo(() => {
    const counts = { pending: 0, progress: 0, ready: 0, completed: 0, cancelled: 0 };
    orders.forEach(order => {
      const type = getStatusType(order.status_global);
      if (type === 'pending') counts.pending++;
      if (type === 'printing') counts.progress++;
      if (type === 'ready') counts.ready++;
      if (type === 'completed') counts.completed++;
      if (type === 'cancelled') counts.cancelled++;
    });
    return counts;
  }, [orders]);

  // Filter & Search Data
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchData = `${order.id} ${(order.nama || '').toLowerCase()} ${(order.nomor_wa || '').toLowerCase()}`;
      const matchesSearch = searchData.includes(searchQuery.toLowerCase());
      
      const type = getStatusType(order.status_global);
      const matchesTab = activeTab === 'all' || type === activeTab;
      
      return matchesSearch && matchesTab;
    });
  }, [orders, searchQuery, activeTab]);

  // Render Helper Badge
  const renderBadge = (statusText = '') => {
    const type = getStatusType(statusText);
    if (type === 'cancelled') {
      return <span className="px-1.5 py-0.5 rounded-[4px] text-[8.5px] font-bold bg-red-100 text-red-700 uppercase tracking-wider flex items-center gap-1 w-max mx-auto"><X className="w-2.5 h-2.5" /> Cancelled</span>;
    }
    if (type === 'pending') {
      return <span className="px-1.5 py-0.5 rounded-[4px] text-[8.5px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">Pending</span>;
    }
    if (type === 'printing') {
      return <span className="px-1.5 py-0.5 rounded-[4px] text-[8.5px] font-bold bg-orange-100 text-orange-700 uppercase tracking-wider">Printing</span>;
    }
    if (type === 'ready') {
      return <span className="px-1.5 py-0.5 rounded-[4px] text-[8.5px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">Ready</span>;
    }
    if (type === 'completed') {
      return <span className="px-1.5 py-0.5 rounded-[4px] text-[8.5px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">Completed</span>;
    }
    return null;
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    const form = e.target;

    try {
      // STEP 1: Buat Order header dulu
      const orderRes = await apiClient.post('/orders/', {
        nama: form.nama.value,
        nomor_wa: form.nomor_wa.value,
        status_global: 'review',
        catatan_pelanggan: form.ui_notes.value || '',
      });
      const newOrderId = orderRes.data.id;

      // STEP 2: Buat OrderItem (detail produk) yang terhubung ke order tadi
      await apiClient.post('/order-items/', {
        order: newOrderId,
        jenis_produk: form.ui_job_type.value,
        qty: parseInt(form.ui_quantity.value) || 1,
        harga_jual: parseInt(form.harga_jual.value) || 0,
        estimasi: form.estimasi.value || '-',
        detail: {
          deskripsi: form.ui_description.value,
          bahan: form.ui_material.value || '-',
          warna: form.ui_color.value,
        },
      });

      alert('Order berhasil dibuat!');
      setIsManualModalOpen(false);
      fetchOrders();
    } catch (error) {
      console.error('Gagal membuat order:', error);
      alert('Gagal membuat pesanan. Cek koneksi atau data form.');
    }
  };


  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    const form = e.target;
    const newStatus = form.status.value;
    const staffId = form.assign_staff?.value;
    
    try {
      // 1. Update status order
      await apiClient.patch(`/orders/${editModalData.id}/`, {
        status_global: newStatus
      });

      // 2. Assign staff jika dipilih (buat/update JobBoard)
      if (staffId && staffId !== '') {
        await apiClient.post(`/orders/${editModalData.id}/assign/`, {
          staff_id: parseInt(staffId)
        });
      }

      setEditModalData(null);
      fetchOrders();
    } catch (error) {
      console.error('Gagal update:', error);
      alert('Gagal menyimpan perubahan.');
    }
  };

  const handleDeleteOrder = async (order) => {
  const konfirmasi = window.confirm(
    `⚠️ HAPUS PERMANEN order ${order.id}?\n\nNama: ${order.nama}\n\nSemua item dan job terkait juga akan terhapus. Tindakan ini tidak dapat dibatalkan!`
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
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Orders</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">Manage and track all jobs</p>
        </div>
        <div className="flex items-center gap-2">
          {isManager && (
            <button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm">
              <Download className="w-3.5 h-3.5" /> Export Excel
            </button>
          )}
          <button onClick={() => setIsManualModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm">
            <Plus className="w-3.5 h-3.5" /> New Order
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        <StatCard title="Pending" icon={FileText} count={stats.pending} iconColor="text-slate-400" />
        <StatCard title="In Progress" icon={FileClock} count={stats.progress} iconColor="text-orange-500" />
        <StatCard title="Ready" icon={FileCheck} count={stats.ready} iconColor="text-emerald-500" />
        <StatCard title="Completed" icon={CheckSquare} count={stats.completed} iconColor="text-blue-600" />
        <StatCard title="Cancelled" icon={XCircle} count={stats.cancelled} iconColor="text-red-500" />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
        <div className="flex gap-1 bg-slate-100/50 p-1 rounded-md border border-slate-200 overflow-x-auto">
          {['all', 'pending', 'printing', 'ready', 'completed', 'cancelled'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded text-[10px] font-bold transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-white shadow-sm border border-slate-200 text-slate-900' 
                  : tab === 'cancelled' ? 'text-red-500 hover:text-red-700' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab === 'all' ? 'All Jobs' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
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
          <h3 className="text-[12px] font-bold text-slate-800">Job List <span className="text-[10px] text-slate-500 font-normal ml-1">({filteredOrders.length} items)</span></h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px] border-collapse min-w-[800px]">
            <thead className="bg-white text-slate-500 border-b border-slate-200 font-bold">
              <tr>
                <th className="px-3 py-2">Job #</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2 w-48">Description</th>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2 text-right">Price</th>
                <th className="px-3 py-2">Due Date</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <SkeletonRow />
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-3 py-6 text-center text-slate-400 text-[10px] italic">No jobs found matching your criteria.</td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const type = getStatusType(order.status_global);
                  const isCancelled = type === 'cancelled';
                  
                  return (
                    <tr key={order.id} className={`hover:bg-slate-50/50 transition-colors ${isCancelled ? 'opacity-60 bg-red-50/20 hover:bg-red-50/40' : ''}`}>
                      <td className={`px-3 py-2 font-bold ${isCancelled ? 'line-through text-slate-500' : 'text-slate-900'}`}>{order.id}</td>
                      <td className="px-3 py-2">
                        <p className={`font-bold ${isCancelled ? 'text-slate-600' : 'text-slate-900'}`}>{order.nama}</p>
                        <p className="text-[9px] text-slate-500">{order.nomor_wa}</p>
                      </td>
                      <td className="px-3 py-2 text-slate-600 truncate max-w-[12rem]">
                        <div className="font-medium text-indigo-700">
                          {order.items?.map(i => i.jenis_produk).join(', ') || '-'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate" title={order.catatan_pelanggan}>
                          {order.catatan_pelanggan || '-'}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {(() => {
                          // Ambil semua staff yang ada di job dari seluruh items order ini
                          const staffs = [];
                          order.items?.forEach(item => {
                            item.jobs?.forEach(job => {
                              if (job.pic_nama && !staffs.includes(job.pic_nama)) {
                                staffs.push(job.pic_nama);
                              }
                            });
                          });
                          if (staffs.length === 0) return <span className="text-slate-400 italic">Belum diset</span>;
                          return <span className="font-bold">{staffs.join(', ')}</span>;
                        })()}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">
                        {(() => {
                          const total = order.items?.reduce((sum, item) => sum + (item.harga_jual || 0), 0) || 0;
                          return `Rp ${new Intl.NumberFormat('id-ID').format(total)}`;
                        })()}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Calendar className="w-3 h-3" /> 
                          {(() => {
                            const estimasiList = order.items?.map(i => i.estimasi).filter(e => e && e !== '-');
                            return estimasiList?.length > 0 ? estimasiList[0] : "TBD";
                          })()}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">{renderBadge(order.status_global)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setEditModalData(order)} className="p-1 bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 rounded-[4px] transition-colors shadow-sm">
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {type !== 'cancelled' && type !== 'completed' && (
                            <button 
                              onClick={async () => { 
                                if(window.confirm(`Batalkan pesanan ${order.id}?`)) {
                                  await apiClient.patch(`/orders/${order.id}/`, { status_global: 'batal' });
                                  fetchOrders();
                                }
                              }} 
                              className="p-1 bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-[4px] transition-colors shadow-sm"
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          )}
                          {/* Cetak Resi (hanya jika order selesai) */}
                          {type === 'completed' && (
                            <button
                              onClick={() => setPrintOrder(order)}
                              title="Cetak Resi"
                              className="p-1 bg-white border border-emerald-200 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 rounded-[4px] transition-colors shadow-sm"
                            >
                              <Printer className="w-3 h-3" />
                            </button>
                          )}
                          {/* Hapus Permanen — hanya owner/manager */}
                          {isManager && (
                            <button
                              onClick={() => handleDeleteOrder(order)}
                              title="Hapus permanen"
                              className="p-1 bg-white border border-slate-200 text-slate-300 hover:bg-red-100 hover:text-red-700 hover:border-red-300 rounded-[4px] transition-colors shadow-sm"
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

      {/* Manual Order Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] overflow-y-auto w-full h-full flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[42rem] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-[1.15rem] font-bold text-slate-900">Create New Print Job</h3>
                <p className="text-[13px] text-slate-500 mt-1">Enter the details for the new print order</p>
              </div>
              <button type="button" onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateOrder}>
              <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-900">Customer Name *</label>
                    <div className="flex gap-2">
                      <input type="text" name="nama" required placeholder="Customer Name" className="w-1/2 text-[13px] border-0 bg-slate-100 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-slate-900 outline-none" />
                      <input type="text" name="nomor_wa" required placeholder="WhatsApp" className="w-1/2 text-[13px] border-0 bg-slate-100 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-slate-900 outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-900">Job Type *</label>
                    <select name="ui_job_type" className="w-full text-[13px] border-0 bg-slate-100 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-slate-900 outline-none">
                      <option value="Business Cards">Business Cards</option>
                      <option value="Flyers">Flyers</option>
                      <option value="Posters">Posters</option>
                      <option value="Banners">Banners</option>
                      <option value="Custom Print">Custom Print</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-900">Description *</label>
                  <input type="text" name="ui_description" required placeholder="Brief description" className="w-full text-[13px] border-0 bg-slate-100 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-slate-900 outline-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-900">Quantity *</label>
                    <input type="number" name="ui_quantity" required placeholder="1000" className="w-full text-[13px] border-0 bg-slate-100 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-slate-900 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-900">Material</label>
                    <input type="text" name="ui_material" placeholder="100lb Gloss" className="w-full text-[13px] border-0 bg-slate-100 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-slate-900 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-900">Color Mode</label>
                    <select name="ui_color" className="w-full text-[13px] border-0 bg-slate-100 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-slate-900 outline-none">
                      <option>Full Color</option>
                      <option>Black & White</option>
                      <option>Spot Color</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-900">Price (Rp) *</label>
                    <input type="number" name="harga_jual" required placeholder="0" className="w-full text-[13px] border-0 bg-slate-100 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-slate-900 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-900">Due Date *</label>
                    <input type="date" name="estimasi" required className="w-full text-[13px] border-0 bg-slate-100 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-slate-900 outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-900">Notes</label>
                  <input type="text" name="ui_notes" placeholder="Any special instructions" className="w-full text-[13px] border-0 bg-slate-100 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-slate-900 outline-none" />
                </div>
              </div>
              <div className="bg-white px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsManualModalOpen(false)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-md text-[13px] font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-[#0a0a0a] text-white rounded-md text-[13px] font-bold hover:bg-black shadow-sm transition-colors">Create Job</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] overflow-y-auto w-full h-full flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <form onSubmit={handleUpdateStatus}>
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-[14px] font-bold text-slate-900">Update Job Status</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{editModalData.id} - {editModalData.nama}</p>
                </div>
                <button type="button" onClick={() => setEditModalData(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-800">Job Status</label>
                  <select name="status" defaultValue={editModalData.status_global} className="w-full text-[12px] border border-slate-200 bg-white rounded-md px-3 py-2 focus:ring-1 focus:ring-slate-900 outline-none">
                    <option value="review">Pending / Review</option>
                    <option value="proses">In Progress / Proses Cetak</option>
                    <option value="selesai">Completed / Selesai</option>
                    <option value="batal" className="text-red-500 font-bold">Cancelled / Batal</option>
                  </select>
                </div>

                {/* Assign Staff — hanya tampil untuk owner/manager */}
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
                      {staffList.map(staff => (
                        <option key={staff.id} value={staff.id}>
                          {staff.username}{staff.divisi_nama ? ` (${staff.divisi_nama})` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 italic">
                      Memilih staff akan otomatis membuat job di Papan Produksi
                    </p>
                  </div>
                )}
              </div>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setEditModalData(null)} className="px-4 py-1.5 border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-black text-white rounded-md text-[11px] font-bold hover:bg-slate-800 shadow-sm transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cetak Resi Modal */}
      {printOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm flex flex-col overflow-hidden">
            {/* Header Modal - tidak ikut dicetak */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Printer size={16} /> Cetak Resi
              </h3>
              <button onClick={() => setPrintOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            {/* Area Resi (yang akan dicetak) */}
            <div className="p-6 receipt-print-area text-slate-800 text-sm font-mono max-h-[70vh] overflow-y-auto">
              <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-4">
                <h2 className="font-extrabold text-xl uppercase tracking-widest">BINTANG ADVERTISING</h2>
                <p className="text-xs text-slate-500 mt-1">Jl. Produksi No. 123, Kota</p>
                <p className="text-xs text-slate-500">Telp: 0812-3456-7890</p>
              </div>
              
              <div className="space-y-1 mb-4 text-xs">
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
                  <div key={idx} className="flex flex-col text-xs">
                    <div className="flex justify-between font-bold">
                      <span>{item.qty}x {item.jenis_produk}</span>
                      <span>Rp {new Intl.NumberFormat('id-ID').format(item.harga_jual || 0)}</span>
                    </div>
                    {item.keterangan && (
                      <span className="text-[10px] text-slate-500 mt-0.5 max-w-[80%] break-words">{item.keterangan}</span>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL BAYAR:</span>
                <span>
                  Rp {new Intl.NumberFormat('id-ID').format(
                    printOrder.items?.reduce((sum, item) => sum + (item.harga_jual || 0), 0) || 0
                  )}
                </span>
              </div>
              
              <div className="text-center mt-8 text-xs text-slate-500 italic">
                <p>Terima kasih telah mempercayakan</p>
                <p>kebutuhan advertising Anda pada kami.</p>
              </div>
            </div>
            
            {/* Footer Modal - Action buttons (tidak ikut dicetak) */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button 
                onClick={() => setPrintOrder(null)} 
                className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-md hover:bg-slate-100"
              >
                Tutup
              </button>
              <button 
                onClick={() => window.print()} 
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-md hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
              >
                <Printer size={14} /> Cetak Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-komponen StatCard
function StatCard({ title, icon: Icon, count, iconColor }) {
  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-20">
      <div className="flex justify-between items-start">
        <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">{title}</p>
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
      </div>
      <h3 className="text-xl font-extrabold text-slate-900">{count}</h3>
    </div>
  );
}

// Sub-komponen Skeleton Table Row untuk Loading State
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-3 py-3"><div className="h-3 bg-slate-200 rounded w-16"></div></td>
      <td className="px-3 py-3">
        <div className="h-3 bg-slate-200 rounded w-20 mb-1"></div>
        <div className="h-2 bg-slate-200 rounded w-16"></div>
      </td>
      <td className="px-3 py-3"><div className="h-3 bg-slate-200 rounded w-full"></div></td>
      <td className="px-3 py-3"><div className="h-3 bg-slate-200 rounded w-16"></div></td>
      <td className="px-3 py-3"><div className="h-3 bg-slate-200 rounded w-16 ms-auto"></div></td>
      <td className="px-3 py-3"><div className="h-3 bg-slate-200 rounded w-16"></div></td>
      <td className="px-3 py-3"><div className="h-4 bg-slate-200 rounded w-12 mx-auto"></div></td>
      <td className="px-3 py-3"><div className="h-5 bg-slate-200 rounded w-8 mx-auto"></div></td>
    </tr>
  );
}