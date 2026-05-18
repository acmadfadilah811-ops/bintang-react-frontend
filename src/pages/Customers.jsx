import { useState, useEffect } from 'react';
import { Plus, Search, Users, DollarSign, ShoppingCart, Phone, RefreshCw, Download, Trash2, FileText } from 'lucide-react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const isManager = ['owner', 'manager'].includes(user?.role);

  // Dialog State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", keterangan: "" });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/contacts/');
      const sorted = res.data.sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0));
      setCustomers(sorted);
    } catch (err) {
      console.error('Gagal memuat data pelanggan:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.nomor_wa.includes(searchTerm) ||
      (customer.keterangan || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topCustomers = customers.slice(0, 5);
  const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
  const avgOrderValue = customers.reduce((sum, c) => sum + (c.total_order || 0), 0) > 0
    ? totalRevenue / customers.reduce((sum, c) => sum + (c.total_order || 0), 0)
    : 0;

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) return;
    try {
      await apiClient.post('/contacts/', {
        nama: newCustomer.name,
        nomor_wa: newCustomer.phone,
        total_order: 0,
        total_spent: 0,
        last_order: '-',
        keterangan: newCustomer.keterangan || '',
      });
      setIsAddDialogOpen(false);
      setNewCustomer({ name: "", phone: "", keterangan: "" });
      fetchCustomers();
    } catch (err) {
      console.error("Gagal menambah pelanggan", err);
      alert("Gagal menambahkan pelanggan. Nomor WA mungkin sudah ada.");
    }
  };

  const handleDelete = async (customer) => {
    const konfirmasi = window.confirm(
      `🗑️ Hapus pelanggan "${customer.nama}" (${customer.nomor_wa})?\n\nPastikan data sudah di-backup sebelum menghapus.\nTindakan ini tidak dapat dibatalkan.`
    );
    if (!konfirmasi) return;
    try {
      await apiClient.delete(`/contacts/${customer.nomor_wa}/`);
      fetchCustomers();
    } catch (err) {
      console.error('Gagal hapus:', err);
      alert('Gagal menghapus data pelanggan.');
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await apiClient.post('/contacts/sync/');
      await fetchCustomers();
      alert(`✅ Sinkronisasi selesai! ${res.data.synced} pelanggan diperbarui.`);
    } catch (err) {
      console.error('Gagal sinkronisasi:', err);
      alert('Gagal sinkronisasi data pelanggan.');
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/export/contacts/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pelanggan_${new Date().toISOString().slice(0,10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export gagal:', err);
      alert('Gagal mengekspor data pelanggan.');
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Data Pelanggan</h1>
          <p className="text-xs text-slate-500 mt-0.5">Kelola database pelanggan dan lacak histori pesanan</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sync Data */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 h-8 px-3"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Data'}
          </button>

          {/* Export Excel — hanya manager/owner */}
          {isManager && (
            <button
              onClick={handleExport}
              className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors bg-green-600 text-white hover:bg-green-700 shadow h-8 px-3"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export Excel
            </button>
          )}

          {/* Tambah Pelanggan */}
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors bg-slate-900 text-white shadow hover:bg-slate-800 h-8 px-3"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Tambah Pelanggan
          </button>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden">
            <div className="p-4 space-y-1 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Tambah Pelanggan Baru</h2>
              <p className="text-xs text-slate-500">Masukkan data kontak pelanggan ke database.</p>
            </div>
            <div className="p-4 space-y-3">
              {/* Nama */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Nama Pelanggan <span className="text-red-500">*</span></label>
                <input
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Bapak Budi Santoso"
                  className="flex h-8 w-full rounded-md border border-slate-300 bg-transparent px-2.5 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 text-slate-900"
                />
              </div>
              {/* Nomor WA */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Nomor WhatsApp <span className="text-red-500">*</span></label>
                <input
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="08123456789"
                  className="flex h-8 w-full rounded-md border border-slate-300 bg-transparent px-2.5 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 text-slate-900"
                />
                <p className="text-[10px] text-slate-400">Nomor WA digunakan sebagai ID unik pelanggan.</p>
              </div>
              {/* Keterangan */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Keterangan / Catatan
                </label>
                <textarea
                  value={newCustomer.keterangan}
                  onChange={(e) => setNewCustomer({ ...newCustomer, keterangan: e.target.value })}
                  placeholder="Cth: Pelanggan tetap, selalu pesan banner spanduk. Referral dari pak Joko."
                  rows={3}
                  className="w-full rounded-md border border-slate-300 bg-transparent px-2.5 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 text-slate-900 resize-none"
                />
                <p className="text-[10px] text-slate-400">Catatan internal tentang pelanggan ini (tidak terlihat pelanggan).</p>
              </div>
            </div>
            <div className="p-4 pt-0 flex items-center justify-end gap-2">
              <button
                onClick={() => { setIsAddDialogOpen(false); setNewCustomer({ name: "", phone: "", keterangan: "" }); }}
                className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-slate-200 bg-white hover:bg-slate-100 h-8 px-3"
              >
                Batal
              </button>
              <button
                onClick={handleAddCustomer}
                className="inline-flex items-center justify-center rounded-md text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 h-8 px-3"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-900">Total Pelanggan</p>
            <Users size={14} className="text-slate-400" />
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-slate-900">{customers.length}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Basis pelanggan aktif</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-900">Total Pendapatan</p>
            <DollarSign size={14} className="text-slate-400" />
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Pendapatan sepanjang waktu</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-900">Rata-rata Nilai Order</p>
            <ShoppingCart size={14} className="text-slate-400" />
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(avgOrderValue)}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Rata-rata per order</p>
          </div>
        </div>
      </div>

      {/* Main Content Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left Column: All Customers Table */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">Semua Pelanggan</h3>
              <p className="text-xs text-slate-500 mt-0.5">Menampilkan {filteredCustomers.length} pelanggan</p>
            </div>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Cari nama, WA, keterangan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-md pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-slate-300 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-white text-slate-900 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Nama</th>
                  <th className="px-4 py-2.5">Kontak</th>
                  <th className="px-4 py-2.5 max-w-[160px]">Keterangan</th>
                  <th className="px-4 py-2.5 text-center">Orders</th>
                  <th className="px-4 py-2.5 text-right">Total Belanja</th>
                  <th className="px-4 py-2.5">Terakhir</th>
                  {isManager && <th className="px-4 py-2.5 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={isManager ? 7 : 6} className="px-4 py-6 text-center text-slate-500">
                      <div className="flex justify-center mb-1.5">
                        <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={isManager ? 7 : 6} className="px-4 py-6 text-center text-slate-500">
                      Tidak ada pelanggan ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.nomor_wa} className="hover:bg-slate-50/50 transition-colors bg-white">
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-slate-900">{customer.nama}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div
                          className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                          onClick={() => window.open(`https://wa.me/${customer.nomor_wa.replace(/^0/, '62')}`, '_blank')}
                        >
                          <Phone size={12} />
                          <span>{customer.nomor_wa}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 max-w-[160px]">
                        {customer.keterangan ? (
                          <p
                            className="text-xs text-slate-500 italic truncate"
                            title={customer.keterangan}
                          >
                            {customer.keterangan}
                          </p>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {customer.total_order}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                        {formatCurrency(customer.total_spent || 0)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {customer.last_order !== '-'
                          ? customer.last_order.split(' ')[0]
                          : <span className="italic">Belum pernah</span>
                        }
                      </td>
                      {isManager && (
                        <td className="px-4 py-2.5 text-center">
                          <button
                            onClick={() => handleDelete(customer)}
                            title="Hapus pelanggan (pastikan sudah di-backup)"
                            className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded transition-colors border border-transparent hover:border-red-200"
                          >
                            <Trash2 size={13} />
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

        {/* Right Column: Top Customers */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Top Customers</h3>
            <p className="text-xs text-slate-500 mt-0.5">Berdasarkan total belanja</p>
          </div>
          <div className="p-4 space-y-4 flex-1">
            {loading ? (
              <div className="text-center text-slate-500 text-xs py-2">Memuat data...</div>
            ) : topCustomers.length === 0 ? (
              <div className="text-center text-slate-500 text-xs py-2">Belum ada data.</div>
            ) : (
              topCustomers.map((customer, index) => (
                <div key={customer.nomor_wa} className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-900 font-bold text-xs shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-xs truncate">{customer.nama}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{customer.nomor_wa}</p>
                    {customer.keterangan && (
                      <p className="text-[10px] text-slate-400 italic truncate mt-0.5" title={customer.keterangan}>
                        📝 {customer.keterangan}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {customer.total_order} orders
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {formatCurrency(customer.total_spent || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
