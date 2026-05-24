import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { BookOpen, Calendar, Filter, FileText, Download, Plus, Trash2, X } from 'lucide-react';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';

export default function BukuBesar() {
  const [akunList, setAkunList] = useState([]);
  const [bukuBesarData, setBukuBesarData] = useState([]);
  const [loading, setLoading] = useState(false);

  // State Filter
  const [filter, setFilter] = useState({
    akun_id: '',
    start_date: dayjs().startOf('month').format('YYYY-MM-DD'),
    end_date: dayjs().endOf('month').format('YYYY-MM-DD'),
  });

  // Auth & Permissions
  const { user } = useAuth();
  const isManagerOrOwner = user?.role === 'owner' || user?.role === 'manager';

  // Saldo awal dari backend
  const [saldoAwal, setSaldoAwal] = useState(0);

  // State Modal Form
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    tanggal: dayjs().format('YYYY-MM-DD'),
    no_referensi: '',
    keterangan: '',
    jenis: 'debit',
    nominal: '',
  });

  const fetchDaftarAkun = async () => {
    try {
      // Endpoint ini asumsikan mengembalikan daftar Chart of Accounts
      const res = await apiClient.get('/finance/akun/');
      setAkunList(res.data);
      if (res.data.length > 0) {
        setFilter((prev) => ({ ...prev, akun_id: res.data[0].id }));
      }
    } catch (err) {
      console.error('Gagal memuat daftar akun:', err);
    }
  };

  useEffect(() => {
    fetchDaftarAkun();
  }, []);

  const fetchBukuBesar = async () => {
    if (!filter.akun_id) return alert('Pilih akun terlebih dahulu!');

    try {
      setLoading(true);
      // Endpoint mengambil data buku besar berdasarkan akun dan tanggal
      const res = await apiClient.get('/finance/buku-besar/', { params: filter });
      setBukuBesarData(res.data.transaksi); // Array transaksi
      setSaldoAwal(res.data.saldo_awal); // Saldo sebelum tanggal mulai
    } catch (err) {
      console.error('Gagal memuat buku besar:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const submitTransaksi = async (e) => {
    e.preventDefault();
    if (!filter.akun_id)
      return alert('Pilih akun di filter terlebih dahulu sebelum menambah transaksi!');
    if (!formData.nominal || formData.nominal <= 0) return alert('Nominal harus lebih dari 0!');

    try {
      setFormLoading(true);
      const payload = {
        akun: filter.akun_id,
        tanggal: formData.tanggal,
        no_referensi: formData.no_referensi,
        keterangan: formData.keterangan,
        debit: formData.jenis === 'debit' ? formData.nominal : 0,
        kredit: formData.jenis === 'kredit' ? formData.nominal : 0,
      };
      await apiClient.post('/finance/transaksi/', payload);
      setShowModal(false);
      setFormData((prev) => ({ ...prev, no_referensi: '', keterangan: '', nominal: '' }));
      fetchBukuBesar(); // Refresh tabel
    } catch (err) {
      console.error('Gagal menambah transaksi:', err);
      alert('Gagal menambah transaksi.');
    } finally {
      setFormLoading(false);
    }
  };

  const hapusTransaksi = async (id) => {
    if (!window.confirm('Yakin ingin menghapus transaksi ini?')) return;
    try {
      await apiClient.delete(`/finance/transaksi/${id}/`);
      fetchBukuBesar();
    } catch (err) {
      console.error('Gagal menghapus:', err);
      alert('Gagal menghapus transaksi.');
    }
  };

  const exportToCSV = () => {
    if (bukuBesarData.length === 0) return alert('Tidak ada data untuk diexport!');

    const headers = ['Tanggal', 'No. Referensi', 'Keterangan', 'Debit', 'Kredit', 'Saldo'];
    let csvContent = headers.join(',') + '\n';

    let current = saldoAwal;
    csvContent += `,,Saldo Awal,,,${current}\n`;

    bukuBesarData.forEach((trx) => {
      current = current + parseFloat(trx.debit) - parseFloat(trx.kredit);
      const row = [
        dayjs(trx.tanggal).format('YYYY-MM-DD'),
        `"${trx.no_referensi || ''}"`,
        `"${trx.keterangan || ''}"`,
        trx.debit,
        trx.kredit,
        current,
      ];
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Buku_Besar_${filter.start_date}_${filter.end_date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatRupiah = (angka) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka || 0);

  // Menghitung saldo berjalan secara dinamis di frontend (bisa juga dari backend)
  let currentSaldo = saldoAwal;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BookOpen className="text-blue-600" /> Buku Besar
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Laporan mutasi transaksi per akun (General Ledger).
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={exportToCSV}
            className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Download size={16} /> Export Excel
          </button>
          {isManagerOrOwner && (
            <button
              onClick={() => {
                if (!filter.akun_id) return alert('Pilih Akun di filter terlebih dahulu!');
                setShowModal(true);
              }}
              className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Plus size={16} /> Transaksi
            </button>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-1.5 w-full">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Pilih Akun
          </label>
          <select
            name="akun_id"
            value={filter.akun_id}
            onChange={handleFilterChange}
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Pilih Akun --</option>
            {akunList.map((akun) => (
              <option key={akun.id} value={akun.id}>
                {akun.kode_akun} - {akun.nama_akun}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 space-y-1.5 w-full">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <Calendar size={14} /> Tanggal Mulai
          </label>
          <input
            type="date"
            name="start_date"
            value={filter.start_date}
            onChange={handleFilterChange}
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1 space-y-1.5 w-full">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <Calendar size={14} /> Tanggal Akhir
          </label>
          <input
            type="date"
            name="end_date"
            value={filter.end_date}
            onChange={handleFilterChange}
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={fetchBukuBesar}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:bg-blue-400 w-full md:w-auto justify-center"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <Filter size={18} />
          )}
          Tampilkan
        </button>
      </div>

      {/* Tabel Buku Besar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">No. Referensi</th>
                <th className="px-4 py-3 font-semibold">Keterangan</th>
                <th className="px-4 py-3 font-semibold text-right">Debit</th>
                <th className="px-4 py-3 font-semibold text-right">Kredit</th>
                <th className="px-4 py-3 font-semibold text-right">Saldo</th>
                {isManagerOrOwner && (
                  <th className="px-4 py-3 font-semibold text-center w-10">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {/* Baris Saldo Awal */}
              <tr className="bg-slate-50/50">
                <td colSpan="5" className="px-4 py-3 font-bold text-right italic">
                  Saldo Awal:
                </td>
                <td className="px-4 py-3 font-bold text-right text-blue-700">
                  {formatRupiah(saldoAwal)}
                </td>
                {isManagerOrOwner && <td></td>}
              </tr>

              {bukuBesarData.length > 0 ? (
                bukuBesarData.map((trx, index) => {
                  // Perhitungan Saldo Berjalan (Asumsi Akun Normal Debit. Jika normal Kredit, logicnya dibalik)
                  currentSaldo = currentSaldo + parseFloat(trx.debit) - parseFloat(trx.kredit);

                  return (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">{dayjs(trx.tanggal).format('DD MMM YYYY')}</td>
                      <td className="px-4 py-3 font-mono text-xs">{trx.no_referensi}</td>
                      <td className="px-4 py-3">{trx.keterangan}</td>
                      <td className="px-4 py-3 text-right text-emerald-600">
                        {trx.debit > 0 ? formatRupiah(trx.debit) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">
                        {trx.kredit > 0 ? formatRupiah(trx.kredit) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatRupiah(currentSaldo)}
                      </td>
                      {isManagerOrOwner && (
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => hapusTransaksi(trx.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Hapus Transaksi"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                    <FileText className="mx-auto mb-2 opacity-50" size={32} />
                    <p>Pilih filter dan klik Tampilkan untuk melihat data.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Transaksi */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Plus className="text-blue-600" size={16} /> Input Transaksi Manual
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitTransaksi} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Tanggal</label>
                  <input
                    required
                    type="date"
                    name="tanggal"
                    value={formData.tanggal}
                    onChange={handleFormChange}
                    className="w-full border border-slate-300 rounded p-2 text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">No Referensi</label>
                  <input
                    type="text"
                    name="no_referensi"
                    value={formData.no_referensi}
                    onChange={handleFormChange}
                    placeholder="Opsional"
                    className="w-full border border-slate-300 rounded p-2 text-sm focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Keterangan</label>
                <input
                  required
                  type="text"
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleFormChange}
                  placeholder="Misal: Pembayaran ATK"
                  className="w-full border border-slate-300 rounded p-2 text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Jenis Transaksi</label>
                  <select
                    name="jenis"
                    value={formData.jenis}
                    onChange={handleFormChange}
                    className="w-full border border-slate-300 rounded p-2 text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="debit">Debit (+)</option>
                    <option value="kredit">Kredit (-)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nominal (Rp)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    name="nominal"
                    value={formData.nominal}
                    onChange={handleFormChange}
                    placeholder="0"
                    className="w-full border border-slate-300 rounded p-2 text-sm focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-white text-xs font-bold bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
