import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Plus, Trash2, ShoppingCart, Send, FileText } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import ProductMasterPicker from '../../orders/components/ProductMasterPicker';
import SpkPublishModal from '../components/SpkPublishModal';

const emptyItem = () => ({
  id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  jenis_produk: '',
  product: null,
  product_nama: '',
  panjang: 1,
  lebar: 1,
  qty: 1,
  harga_jual: 0,
});

export default function CreateOrderPage() {
  const navigate = useNavigate();
  // Order yang baru dibuat, ditahan sebentar supaya kasir bisa langsung
  // mengarahkannya ke divisi tanpa berpindah halaman dulu.
  const [orderBaru, setOrderBaru] = useState(null);

  const [nama, setNama] = useState('');
  const [nomorWa, setNomorWa] = useState('');
  const [metode, setMetode] = useState('tunai');
  const [dp, setDp] = useState(0);
  const [diskon, setDiskon] = useState(0);
  const [catatan, setCatatan] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [saving, setSaving] = useState(false);

  const formatCurrency = (v) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

  const changeItem = (idx, field, value) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const getSubtotal = () =>
    items.reduce((sum, it) => sum + parseFloat(it.harga_jual || 0) * parseFloat(it.qty || 1), 0);
  const getTotal = () => Math.max(0, getSubtotal() - (getSubtotal() * parseFloat(diskon || 0)) / 100);
  const getSisa = () => Math.max(0, getTotal() - parseFloat(dp || 0));

  const handleSubmit = async () => {
    if (!nama.trim() || !nomorWa.trim()) {
      alert('Nama pelanggan dan nomor WhatsApp wajib diisi.');
      return;
    }
    const validItems = items.filter((it) => it.jenis_produk.trim());
    if (validItems.length === 0) {
      alert('Tambahkan minimal satu item pesanan.');
      return;
    }

    setSaving(true);
    try {
      // 1. Buat Order induk (status review, menunggu verifikasi/diteruskan)
      const resOrder = await apiClient.post('/orders/', {
        nama,
        nomor_wa: nomorWa,
        catatan_pelanggan: catatan,
        metode_pembayaran: metode,
        dp_dibayar: parseInt(dp || 0),
        diskon_persen: parseFloat(diskon || 0),
        status_global: 'review',
      });
      const orderId = resOrder.data.id;

      // 2. Tambahkan item pesanan
      for (const it of validItems) {
        await apiClient.post('/order-items/', {
          order: orderId,
          jenis_produk: it.jenis_produk,
          product: it.product || null,
          panjang: parseFloat(it.panjang || 0),
          lebar: parseFloat(it.lebar || 0),
          qty: parseInt(it.qty || 1),
          harga_jual: parseInt(it.harga_jual || 0),
        });
      }

      // Tawarkan penerbitan SPK di sini juga — kalau kasir sudah tahu
      // divisinya, pesanan tidak perlu menunggu diproses lewat antrean WA.
      setOrderBaru({ id: orderId, nama });
    } catch (err) {
      console.error('Gagal membuat order:', err);
      alert('Gagal membuat order: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

  const terbitkanSpk = async (payload) => {
    await apiClient.post(`/orders/${orderBaru.id}/assign/`, payload);
    alert(`Order ${orderBaru.id} dibuat dan SPK-nya sudah diterbitkan ke produksi.`);
    navigate('/kasir/antrean-wa');
  };

  const lewatiSpk = () => {
    alert(`Order ${orderBaru.id} berhasil dibuat dan masuk daftar pesanan untuk diverifikasi.`);
    navigate('/kasir/antrean-wa');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#F4F7FE]">
      {orderBaru && (
        <SpkPublishModal
          judul={`Terbitkan SPK — Order ${orderBaru.id}`}
          keterangan={`Order untuk ${orderBaru.nama} sudah tersimpan. Arahkan langsung ke divisi produksi, atau lewati untuk memprosesnya nanti lewat antrean WA.`}
          onTerbitkan={terbitkanSpk}
          onClose={lewatiSpk}
        />
      )}
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">
          <ShoppingCart size={18} />
        </div>
        <div>
          <h1 className="text-base font-black text-slate-800">Buat Order</h1>
          <p className="text-[11px] font-semibold text-slate-500">Input pesanan pelanggan (walk-in) untuk diteruskan ke produksi.</p>
        </div>
      </div>

      <div className="max-w-4xl space-y-5">
        {/* Customer */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-xs font-extrabold text-slate-800 mb-3 flex items-center gap-2">
            <User size={14} className="text-indigo-600" /> Data Pelanggan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Nama Pelanggan *</label>
              <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama pemesan" className={inputCls} />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1 flex items-center gap-1">
                <Phone size={11} /> Nomor WhatsApp *
              </label>
              <input type="text" value={nomorWa} onChange={(e) => setNomorWa(e.target.value)} placeholder="6281234567890" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
              <FileText size={14} className="text-indigo-600" /> Item Pesanan
            </h2>
            <button onClick={addItem} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer">
              <Plus size={14} /> Tambah Item
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200">
                  <th className="px-4 py-2">Jenis Produk</th>
                  <th className="px-4 py-2 w-28">P × L (m)</th>
                  <th className="px-4 py-2 w-20">Qty</th>
                  <th className="px-4 py-2 w-32">Harga Satuan</th>
                  <th className="px-4 py-2 text-right">Subtotal</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={it.id} className="border-b border-slate-100 text-xs font-semibold text-slate-700">
                    <td className="px-4 py-2">
                      <input type="text" value={it.jenis_produk} placeholder="Nama produk / jasa cetak" onChange={(e) => changeItem(idx, 'jenis_produk', e.target.value)} className="w-full bg-transparent border-0 focus:outline-none p-0 text-xs font-bold text-slate-800" />
                      {/* Tautan opsional ke master Produk untuk laporan penjualan */}
                      <ProductMasterPicker
                        value={it.product}
                        valueLabel={it.product_nama}
                        onChange={(p) => {
                          changeItem(idx, 'product', p ? p.id : null);
                          changeItem(idx, 'product_nama', p ? p.nama : '');
                        }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <input type="number" step="0.01" value={it.panjang} onChange={(e) => changeItem(idx, 'panjang', parseFloat(e.target.value) || 0)} className="w-10 bg-transparent border-0 focus:outline-none text-center p-0" />
                        <span>×</span>
                        <input type="number" step="0.01" value={it.lebar} onChange={(e) => changeItem(idx, 'lebar', parseFloat(e.target.value) || 0)} className="w-10 bg-transparent border-0 focus:outline-none text-center p-0" />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" value={it.qty} onChange={(e) => changeItem(idx, 'qty', parseInt(e.target.value) || 1)} className="w-12 bg-transparent border-0 focus:outline-none p-0" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" value={it.harga_jual} onChange={(e) => changeItem(idx, 'harga_jual', parseInt(e.target.value) || 0)} className="w-24 bg-transparent border-0 focus:outline-none p-0 font-bold" />
                    </td>
                    <td className="px-4 py-2 text-right font-black text-slate-900">
                      {formatCurrency(parseFloat(it.harga_jual || 0) * parseFloat(it.qty || 1))}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {items.length > 1 && (
                        <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-rose-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary + notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <label className="text-xs font-extrabold text-slate-800 block mb-2">Catatan Pesanan</label>
            <textarea rows="4" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Instruksi desain / finishing / deadline..." className={`${inputCls} resize-none`} />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-2.5 text-xs font-semibold text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-slate-800">{formatCurrency(getSubtotal())}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Diskon (%)</span>
              <input type="number" min="0" max="100" value={diskon} onChange={(e) => setDiskon(parseFloat(e.target.value) || 0)} className="w-16 text-right px-2 py-0.5 border border-slate-200 rounded-md font-bold focus:outline-none text-slate-700" />
            </div>
            <div className="flex justify-between font-black text-slate-800">
              <span>Total</span>
              <span>{formatCurrency(getTotal())}</span>
            </div>
            <div className="h-px bg-slate-200 my-1" />
            <div className="flex items-center justify-between">
              <span>DP / Uang Muka</span>
              <input type="number" value={dp} onChange={(e) => setDp(parseInt(e.target.value) || 0)} className="w-28 text-right px-2 py-0.5 border border-slate-200 rounded-md font-bold focus:outline-none text-slate-700" />
            </div>
            <div className="flex items-center justify-between">
              <span>Metode DP</span>
              <select value={metode} onChange={(e) => setMetode(e.target.value)} className="bg-white border border-slate-200 rounded-md px-2 py-0.5 font-bold text-slate-700 focus:outline-none">
                <option value="tunai">Tunai</option>
                <option value="transfer">Transfer</option>
                <option value="debit">Debit</option>
                <option value="qris">QRIS</option>
              </select>
            </div>
            <div className="flex justify-between font-black text-slate-800 pt-1.5 border-t border-slate-200">
              <span>Sisa Tagihan</span>
              <span className="text-rose-600 text-sm">{formatCurrency(getSisa())}</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2 pb-4">
          <button onClick={() => navigate('/kasir/dashboard')} className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl cursor-pointer">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={saving} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/10 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
            {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Send size={14} />}
            <span>{saving ? 'Menyimpan...' : 'Simpan Order'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
