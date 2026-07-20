import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Plus, Trash2, ShoppingCart, ShoppingBag, Send, FileText, X, AlertTriangle, Search } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import ProductMasterPicker from '../../orders/components/ProductMasterPicker';
import SpkPublishModal from './SpkPublishModal';
import NumericInput from '../../../components/NumericInput';
import { useKasir } from '../context/KasirContext';

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

export default function CreateOrderModal({ isOpen, onClose, onSuccess, initialCustomer, initialCart }) {
  const navigate = useNavigate();
  let shiftAktif = null;
  try {
    const kasirCtx = useKasir();
    shiftAktif = kasirCtx?.shiftAktif;
  } catch (e) {
    // If used outside KasirProvider
  }

  const [orderBaru, setOrderBaru] = useState(null);
  const [nama, setNama] = useState('');
  const [nomorWa, setNomorWa] = useState('');
  const [metode, setMetode] = useState('tunai');
  const [dp, setDp] = useState(0);
  const [diskon, setDiskon] = useState(0);
  const [catatan, setCatatan] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [saving, setSaving] = useState(false);

  // Customer Autocomplete States
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (initialCustomer) {
        setNama(initialCustomer.nama || '');
        setNomorWa(initialCustomer.nomor_wa || '');
      }
      if (initialCart && initialCart.length > 0) {
        const mappedItems = initialCart.map((c) => ({
          id: `cart-${c.id || Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          jenis_produk: c.nama || c.jenis_produk || '',
          product: c.product_id || c.id || null,
          product_nama: c.nama || '',
          panjang: c.panjang || 1,
          lebar: c.lebar || 1,
          qty: c.qty || 1,
          harga_jual: c.harga_jual_toko || c.harga || 0,
        }));
        setItems(mappedItems);
      }
    }
  }, [isOpen, initialCustomer, initialCart]);

  // Click outside to close customer dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchCustomers = async (query) => {
    try {
      const res = await apiClient.get('/contacts/', { params: { search: query } });
      setCustomerSuggestions(res.data || []);
    } catch (err) {
      console.error('Error searching customers:', err);
    }
  };

  // Product Catalog States for Left Panel
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Fetch Categories
  useEffect(() => {
    if (!isOpen) return;
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get('/product-categories/');
        const activeCats = (res.data || []).filter((c) => c.tampil_pos);
        setCategories(activeCats);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, [isOpen]);

  // Fetch Products based on category & search
  useEffect(() => {
    if (!isOpen) return;
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const params = { is_active: true };
        if (selectedCategory && selectedCategory !== 'all') {
          params.kategori = selectedCategory;
        }
        if (searchTerm) {
          params.search = searchTerm;
        }
        const res = await apiClient.get('/products/', { params });
        setProducts(res.data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    const delayDebounce = setTimeout(fetchProducts, 300);
    return () => clearTimeout(delayDebounce);
  }, [isOpen, selectedCategory, searchTerm]);

  // Add Product from Left Catalog to Right Order Items
  const addProductToOrder = (product) => {
    const detectedPrice = product.harga_jual_toko ?? product.harga_jual ?? 0;
    const newItem = {
      id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      jenis_produk: product.nama,
      product: product.id,
      product_nama: product.nama,
      panjang: 1,
      lebar: 1,
      qty: 1,
      harga_jual: detectedPrice,
    };

    setItems((prev) => {
      if (prev.length === 1 && !prev[0].jenis_produk && !prev[0].product) {
        return [newItem];
      }
      return [...prev, newItem];
    });
  };

  if (!isOpen && !orderBaru) return null;

  const formatCurrency = (v) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

  const changeItem = (idx, field, value) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };
  const updateItem = (idx, patch) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const getSubtotal = () =>
    items.reduce((sum, it) => sum + parseFloat(it.harga_jual || 0) * parseFloat(it.qty || 1), 0);
  const getTotal = () => Math.max(0, getSubtotal() - (getSubtotal() * parseFloat(diskon || 0)) / 100);
  const getSisa = () => Math.max(0, getTotal() - parseFloat(dp || 0));

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!shiftAktif) {
      alert('Shift kasir belum dibuka. Buka shift terlebih dahulu sebelum membuat order.');
      return;
    }
    if (!nama.trim() || !nomorWa.trim()) {
      alert('Nama pelanggan dan nomor WhatsApp wajib diisi.');
      return;
    }
    const validItems = items.filter((it) => it.jenis_produk.trim());
    if (validItems.length === 0) {
      alert('Order harus memuat minimal satu item pesanan.');
      return;
    }

    setSaving(true);
    try {
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
      setOrderBaru({ id: orderId, nama });
    } catch (err) {
      console.error('Gagal membuat order:', err);
      alert(
        'Order gagal disimpan: ' +
          (err.response?.data?.detail || err.response?.data?.error || err.message || 'terjadi kesalahan pada server.')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = () => {
    setOrderBaru(null);
    setNama('');
    setNomorWa('');
    setCatatan('');
    setDp(0);
    setDiskon(0);
    setItems([emptyItem()]);
    if (onSuccess) onSuccess();
    if (onClose) onClose();
  };

  const terbitkanSpk = async (payload) => {
    try {
      await apiClient.post(`/orders/${orderBaru.id}/assign/`, payload);
      alert(`Order #${orderBaru.id} tersimpan dan SPK telah diterbitkan ke divisi produksi.`);
    } catch (err) {
      console.error('Gagal terbit SPK:', err);
      alert(
        `Order #${orderBaru.id} tersimpan, namun SPK gagal diterbitkan. Terbitkan ulang melalui menu Antrean WA.`
      );
    }
    handleFinish();
  };

  const lewatiSpk = () => {
    handleFinish();
  };

  const inputCls =
    'w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F4F7FE] overflow-hidden">
      {orderBaru && (
        <SpkPublishModal
          judul={`Terbitkan SPK — Order ${orderBaru.id}`}
          keterangan={`Order atas nama ${orderBaru.nama} telah tersimpan. Pilih divisi produksi untuk menerbitkan SPK sekarang, atau lewati bila penugasan akan dilakukan kemudian melalui Antrean WA.`}
          onTerbitkan={terbitkanSpk}
          onClose={lewatiSpk}
        />
      )}

      {!orderBaru && (
        <div className="flex-1 flex flex-col h-screen w-full bg-[#F4F7FE] overflow-hidden">
          {/* Top Navbar Header */}
          <header className="bg-white border-b border-slate-200 px-6 py-3 shadow-sm flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-md shadow-emerald-600/20">
                <ShoppingCart size={20} />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-800 tracking-tight">Pembuatan Order & Penerbitan SPK</h1>
                <p className="text-[11px] font-semibold text-slate-500">
                  Pilih produk dari katalog atau tambahkan item manual, lengkapi data pelanggan, lalu terbitkan SPK ke divisi produksi.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <X size={16} />
                <span>Kembali ke Terminal</span>
              </button>
            </div>
          </header>

          {!shiftAktif && (
            <div className="mx-6 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h4 className="font-extrabold text-amber-900 text-xs uppercase tracking-wider">Shift Kasir Belum Dibuka</h4>
                  <p className="text-[11px] text-amber-700 font-medium">
                    Order tidak dapat disimpan sebelum shift dibuka. Buka shift terlebih dahulu agar transaksi tercatat pada periode kas yang benar.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  navigate('/kasir/shift');
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-lg shrink-0 transition-all shadow-sm cursor-pointer"
              >
                Buka Shift Sekarang
              </button>
            </div>
          )}

          {/* 2-Column Terminal Split View */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
            {/* Left Column: Product Catalog */}
            <div className="w-full lg:w-5/12 xl:w-[420px] bg-slate-50 border-r border-slate-200 flex flex-col h-full shrink-0">
              <div className="p-3.5 bg-white border-b border-slate-200 space-y-2.5 shrink-0">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari produk berdasarkan nama atau SKU"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.nama}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Cards Grid */}
              <div className="flex-1 p-3.5 overflow-y-auto">
                {loadingProducts ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600"></div>
                  </div>
                ) : products.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white border border-dashed border-slate-200 rounded-xl">
                    <ShoppingBag size={28} className="text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-500">Produk tidak ditemukan</p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-1">
                      Ubah kata kunci pencarian atau pilih kategori lain.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                    {products.map((product) => {
                      const fotoUtama =
                        product.fotos?.find((f) => f.is_primary)?.foto ||
                        product.fotos?.[0]?.foto ||
                        product.gambar ||
                        product.foto ||
                        null;

                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addProductToOrder(product)}
                          className="group bg-white rounded-xl border border-slate-200 p-2 text-left hover:shadow-md hover:border-indigo-300 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          {fotoUtama ? (
                            <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-150">
                              <img
                                src={fotoUtama}
                                alt={product.nama}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                onError={(e) => {
                                  e.target.parentElement.style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 shrink-0 flex items-center justify-center text-indigo-500">
                              <ShoppingBag size={16} />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h6 className="font-extrabold text-slate-800 text-xs truncate leading-snug">
                              {product.nama}
                            </h6>
                            <span className="text-[11px] font-black text-indigo-600 block mt-0.5">
                              {formatCurrency(product.harga_jual_toko)}
                            </span>
                          </div>
                          <div className="p-1 rounded-lg bg-indigo-50 text-indigo-600 opacity-80 group-hover:opacity-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                            <Plus size={14} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Customer Data & SPK Order Form */}
            <div className="flex-1 bg-white overflow-y-auto p-5 flex flex-col gap-4">
              {/* Customer Data Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
                <h2 className="text-xs font-extrabold text-slate-800 mb-2.5 flex items-center gap-2">
                  <User size={15} className="text-indigo-600" /> Data Pelanggan
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative" ref={customerDropdownRef}>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Nama Pelanggan *</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={nama}
                        onChange={(e) => {
                          setNama(e.target.value);
                          searchCustomers(e.target.value);
                          setShowCustomerDropdown(true);
                        }}
                        onFocus={() => {
                          searchCustomers(nama);
                          setShowCustomerDropdown(true);
                        }}
                        placeholder="Ketik nama untuk mencari pelanggan terdaftar"
                        className={inputCls}
                      />
                      <Search size={14} className="absolute right-3 text-slate-400 pointer-events-none" />
                    </div>

                    {showCustomerDropdown && customerSuggestions.length > 0 && (
                      <div className="absolute inset-x-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                        {customerSuggestions.map((c) => (
                          <button
                            key={c.id || c.nomor_wa}
                            type="button"
                            onClick={() => {
                              setNama(c.nama);
                              setNomorWa(c.nomor_wa);
                              setShowCustomerDropdown(false);
                            }}
                            className="w-full px-3 py-2 hover:bg-indigo-50 text-left text-xs font-semibold text-slate-700 flex justify-between cursor-pointer border-b border-slate-100"
                          >
                            <span className="font-bold text-slate-800">{c.nama}</span>
                            <span className="text-slate-400">{c.nomor_wa}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1 flex items-center gap-1">
                      <Phone size={12} /> Nomor WhatsApp *
                    </label>
                    <input
                      type="text"
                      value={nomorWa}
                      onChange={(e) => setNomorWa(e.target.value)}
                      placeholder="Format 62, contoh: 6281234567890"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Order Items Table Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm flex-1">
                <div className="flex items-center justify-between mb-2.5">
                  <h2 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                    <FileText size={15} className="text-indigo-600" /> Rincian Item Pesanan ({items.length})
                  </h2>
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                    title="Tambahkan item di luar katalog produk"
                  >
                    <Plus size={14} /> Tambah Item Manual
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl bg-white overflow-visible">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200">
                        <th className="px-3 py-2 min-w-[220px]">Deskripsi Item / Produk Master</th>
                        <th className="px-3 py-2 w-28">Ukuran P × L (m)</th>
                        <th className="px-3 py-2 w-16 text-center">Qty</th>
                        <th className="px-3 py-2 w-28 text-right">Harga Satuan</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                        <th className="px-2 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr
                          key={it.id}
                          className="border-b border-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-50/50"
                        >
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={it.jenis_produk}
                              placeholder="Contoh: Cetak Banner Flexi 280gr"
                              onChange={(e) => changeItem(idx, 'jenis_produk', e.target.value)}
                              className="w-full bg-transparent border-0 focus:outline-none p-0 text-xs font-extrabold text-slate-800 placeholder:font-normal mb-1"
                            />
                            <ProductMasterPicker
                              value={it.product}
                              valueLabel={it.product_nama}
                              onChange={(p) => {
                                if (p) {
                                  const detectedPrice = p.harga_jual_toko ?? p.harga_jual ?? 0;
                                  updateItem(idx, {
                                    product: p.id,
                                    product_nama: p.nama,
                                    jenis_produk: it.jenis_produk ? it.jenis_produk : p.nama,
                                    harga_jual: detectedPrice > 0 ? detectedPrice : it.harga_jual,
                                  });
                                } else {
                                  updateItem(idx, { product: null, product_nama: '' });
                                }
                              }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <NumericInput
                                allowDecimal={true}
                                value={it.panjang}
                                onChange={(val) => changeItem(idx, 'panjang', val)}
                                className="w-10 bg-slate-50 border border-slate-200 rounded-lg px-1 py-0.5 text-center text-xs font-extrabold focus:bg-white focus:outline-none"
                              />
                              <span className="text-slate-400 text-xs font-bold">×</span>
                              <NumericInput
                                allowDecimal={true}
                                value={it.lebar}
                                onChange={(val) => changeItem(idx, 'lebar', val)}
                                className="w-10 bg-slate-50 border border-slate-200 rounded-lg px-1 py-0.5 text-center text-xs font-extrabold focus:bg-white focus:outline-none"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <NumericInput
                              min={1}
                              value={it.qty}
                              onChange={(val) => changeItem(idx, 'qty', val)}
                              className="w-12 bg-slate-50 border border-slate-200 rounded-lg px-1 py-0.5 text-center text-xs font-bold focus:bg-white focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <NumericInput
                              value={it.harga_jual}
                              onChange={(val) => changeItem(idx, 'harga_jual', val)}
                              className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-right text-xs font-extrabold focus:bg-white focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-black text-slate-900 text-xs">
                            {formatCurrency(parseFloat(it.harga_jual || 0) * parseFloat(it.qty || 1))}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                              >
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

              {/* Order Notes & Payment Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-800 block mb-1">Catatan Produksi</label>
                  <textarea
                    rows="4"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Instruksi desain, spesifikasi bahan, finishing, atau tenggat pengerjaan"
                    className={`${inputCls} resize-none`}
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between items-center">
                    <span>Subtotal</span>
                    <span className="text-slate-800 font-extrabold text-xs">{formatCurrency(getSubtotal())}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Diskon (%)</span>
                    <NumericInput
                      min={0}
                      max={100}
                      allowDecimal={true}
                      value={diskon}
                      onChange={(val) => setDiskon(val)}
                      className="w-20 text-right px-2 py-0.5 border border-slate-200 rounded-lg font-bold bg-white text-slate-800"
                    />
                  </div>
                  <div className="flex justify-between items-center font-black text-slate-900 text-xs">
                    <span>Total</span>
                    <span className="text-indigo-600 text-sm">{formatCurrency(getTotal())}</span>
                  </div>
                  <div className="h-px bg-slate-200 my-0.5" />
                  <div className="flex items-center justify-between">
                    <span>DP / Uang Muka</span>
                    <NumericInput
                      value={dp}
                      onChange={(val) => setDp(val)}
                      className="w-28 text-right px-2 py-0.5 border border-slate-200 rounded-lg font-extrabold bg-white text-slate-800"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Metode Pembayaran DP</span>
                    <select
                      value={metode}
                      onChange={(e) => setMetode(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 font-bold text-slate-800 focus:outline-none"
                    >
                      <option value="tunai">Tunai</option>
                      <option value="transfer">Transfer</option>
                      <option value="debit">Debit</option>
                      <option value="qris">QRIS</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center font-black text-slate-900 pt-1 border-t border-slate-200">
                    <span>Sisa Tagihan</span>
                    <span className="text-rose-600 text-sm">{formatCurrency(getSisa())}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Submit Action */}
              <div className="flex justify-end gap-3 pt-2 pb-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send size={16} />
                  )}
                  <span>{saving ? 'Menyimpan Order...' : 'Simpan Order & Terbitkan SPK'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
