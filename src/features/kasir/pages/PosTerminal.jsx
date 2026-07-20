import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Minus, Trash2, User, CreditCard, ShoppingBag, Percent, AlertCircle, X, Factory } from 'lucide-react';
import { useKasir } from '../context/KasirContext';
import apiClient from '../../../api/apiClient';
import CustomItemModal from '../components/CustomItemModal';
import SpkPublishModal from '../components/SpkPublishModal';
import SplitBillModal from '../components/SplitBillModal';
import ReceiptPrint from '../components/ReceiptPrint';

export default function PosTerminal() {
  const navigate = useNavigate();
  const {
    shiftAktif,
    cart,
    addToCart,
    addCustomToCart,
    setCartItemUom,
    removeFromCart,
    removeItemsFromCart,
    updateCartQty,
    updateCartItemNote,
    clearCart,
    selectedContact,
    setSelectedContact,
    discountPercent,
    setDiscountPercent,
    taxPercent,
    setTaxPercent,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
    cartNotes,
    setCartNotes,
  } = useKasir();

  // Catalog States
  // Pengaturan POS yang memengaruhi perilaku kasir. Penegakan sesungguhnya ada
  // di server; ini hanya cermin agar kasir dapat umpan balik lebih awal.
  const [uomAktif, setUomAktif] = useState(false);
  const [fullSettings, setFullSettings] = useState(null);
  const [aturanPos, setAturanPos] = useState({
    blokirStokKosong: true,
    sembunyikanStok: false,
    sembunyikanDaftarPelanggan: false,
    disableAddCustomItem: false,
    hideSplitbill: false,
    passkey: {},
  });
  useEffect(() => {
    (async () => {
      try {
        const [bs, rules] = await Promise.all([
          apiClient.get('/business-settings/'),
          apiClient.get('/pos/sales/pos-rules/'),
        ]);
        setUomAktif(!!bs.data?.uom_multi_enabled);
        setFullSettings(bs.data);
        setAturanPos({
          blokirStokKosong: !!rules.data?.blokir_stok_kosong,
          sembunyikanStok: !!rules.data?.sembunyikan_stok,
          sembunyikanDaftarPelanggan: !!rules.data?.sembunyikan_daftar_pelanggan,
          disableAddCustomItem: !!rules.data?.disable_add_custom_item,
          hideSplitbill: !!rules.data?.hide_splitbill,
          passkey: rules.data?.passkey || {},
        });
      } catch (err) {
        console.error('Gagal memuat aturan POS:', err);
      }
    })();
  }, []);

  /**
   * Minta PIN PassKey untuk tindakan sensitif (diskon / pilih pelanggan).
   * Verifikasi dilakukan di server; UI hanya menampung input.
   * Mengembalikan true bila boleh lanjut.
   */
  const mintaPasskey = async (aksi) => {
    if (!aturanPos.passkey?.[aksi]) return true;
    const pin = window.prompt('Masukkan PIN PassKey untuk melanjutkan:');
    if (pin === null) return false;
    try {
      const res = await apiClient.post('/pos/sales/verify-passkey/', { aksi, pin });
      if (res.data?.ok) return true;
      alert('PIN salah.');
      return false;
    } catch (err) {
      alert(err.response?.data?.error || 'PIN salah.');
      return false;
    }
  };

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Variant Picker Modal State
  const [activeProductForVariant, setActiveProductForVariant] = useState(null);

  // Custom Item Modal State
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Split Bill Modal State
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);

  // Customer Select States
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [isSubmittingTrans, setIsSubmittingTrans] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  // Nota yang sedang diterbitkan SPK-nya (pesanan custom yang perlu produksi).
  const [spkUntukNota, setSpkUntukNota] = useState(null);

  const contactDropdownRef = useRef(null);

  // Fetch Categories and initial Products
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get('/product-categories/');
        // Filter categories showing on POS
        const activeCats = (res.data || []).filter(c => c.tampil_pos);
        setCategories(activeCats);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Products based on search and category
  useEffect(() => {
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
  }, [selectedCategory, searchTerm]);

  // Fetch Contacts for Customer autocomplete
  useEffect(() => {
    if (contactSearch.length < 2) {
      setContacts([]);
      return;
    }
    const fetchContacts = async () => {
      try {
        const res = await apiClient.get('/contacts/', {
          params: { search: contactSearch },
        });
        setContacts(res.data || []);
      } catch (err) {
        console.error('Error fetching contacts:', err);
      }
    };
    const delayDebounce = setTimeout(fetchContacts, 300);
    return () => clearTimeout(delayDebounce);
  }, [contactSearch]);

  // Close contact dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contactDropdownRef.current && !contactDropdownRef.current.contains(e.target)) {
        setShowContactDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const handleProductClick = (product) => {
    if (product.has_variant && product.variants && product.variants.length > 0) {
      setActiveProductForVariant(product);
    } else {
      addToCart(product);
    }
  };

  const handleSelectVariant = (variant) => {
    if (activeProductForVariant) {
      addToCart(activeProductForVariant, variant);
      setActiveProductForVariant(null);
    }
  };

  const handlePayClick = () => {
    if (cart.length === 0) return;
    setAmountPaid(getTotal().toString());
    setShowPaymentModal(true);
  };

  const handleQuickCash = (amt) => {
    setAmountPaid(amt.toString());
  };

  const submitTransaction = async (autoPublishSpk = false) => {
    const paidVal = parseFloat(amountPaid || 0);
    const totalVal = getTotal();
    if (paidVal < totalVal) {
      alert('Jumlah bayar kurang dari total belanja.');
      return;
    }

    setIsSubmittingTrans(true);
    try {
      const payload = {
        pelanggan: selectedContact ? selectedContact.id : null,
        subtotal: getSubtotal(),
        diskon: getDiscountAmount(),
        pajak: getTaxAmount(),
        total: totalVal,
        metode_bayar: paymentMethod,
        dibayar: paidVal,
        kembalian: paidVal - totalVal,
        catatan: cartNotes,
        status: 'paid',
        items: cart.map(item => ({
          product_id: item.product ? item.product.id : null,
          variant_id: item.variant ? item.variant.id : null,
          nama: item.nama,
          harga: item.harga,
          qty: item.qty,
          catatan: item.catatan,
          uom_kode: item.uomKode || null,
        })),
      };

      const res = await apiClient.post('/pos/sales/', payload);
      clearCart();
      setShowPaymentModal(false);
      if (autoPublishSpk) {
        setSpkUntukNota(res.data);
      } else {
        setLastReceipt(res.data);
      }
    } catch (err) {
      console.error('Error saving transaction:', err);
      alert('Gagal memproses transaksi: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmittingTrans(false);
    }
  };

  const terbitkanSpkNota = async (payload) => {
    await apiClient.post(`/pos/sales/${spkUntukNota.id}/terbitkan-spk/`, payload);
    setSpkUntukNota(null);
    alert('SPK produksi berhasil diterbitkan.');
  };

  return (
    <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden w-full">
      {/* Kolom Kiri: Katalog Produk */}
      <div className="flex-1 flex flex-col p-4 overflow-y-auto border-r border-slate-200">
        
        {/* Warning if Shift is closed */}
        {!shiftAktif && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Shift Belum Dibuka</h4>
                <p className="text-xs text-slate-500 font-semibold">Harap buka shift kasir terlebih dahulu sebelum memproses transaksi belanja.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/kasir/shift')}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Buka Shift Sekarang
            </button>
          </div>
        )}

        {/* Bar pencarian & scan barcode */}
        <div className="flex gap-2 mb-4 shrink-0">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Cari nama produk, SKU, atau scan barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          {!aturanPos.disableAddCustomItem && (
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-500/10 flex items-center gap-1 transition-all cursor-pointer shrink-0"
            >
              <Plus size={14} />
              <span>Item Kustom</span>
            </button>
          )}
        </div>

        {/* Kategori Horizontal Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2 shrink-0 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.nama}
            </button>
          ))}
        </div>

        {/* Grid Produk */}
        {loadingProducts ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white border border-dashed border-slate-200 rounded-2xl">
            <div className="bg-slate-50 p-4 rounded-full text-slate-400 mb-2">
              <ShoppingBag size={32} />
            </div>
            <h5 className="font-extrabold text-slate-700 text-sm">Produk Tidak Ditemukan</h5>
            <p className="text-xs text-slate-400 font-semibold max-w-xs mt-1">Coba gunakan kata kunci lain atau pilih kategori yang berbeda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
            {products.map((product) => {
              // Produk tanpa stok hanya dikunci bila aturan "blokir jual saat
              // stok kosong" aktif — cerminan aturan yang ditegakkan server.
              const stokHabis = product.lacak_inventori && product.qty_stok <= 0;
              const hasStock = !stokHabis || !aturanPos.blokirStokKosong;
              return (
                <button
                  key={product.id}
                  disabled={!shiftAktif || !hasStock}
                  onClick={() => handleProductClick(product)}
                  className={`bg-white rounded-2xl border border-slate-200 p-3 text-left hover:shadow-lg hover:border-indigo-200 transition-all flex flex-col justify-between h-48 cursor-pointer ${
                    (!shiftAktif || !hasStock) && 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="w-full">
                    {/* Category Label */}
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider block w-max mb-1.5">
                      {product.kategori_nama || 'Produk'}
                    </span>
                    <h6 className="font-extrabold text-slate-800 text-xs leading-snug line-clamp-2">
                      {product.nama}
                    </h6>
                    {product.sku && (
                      <span className="text-[10px] text-slate-400 font-semibold tracking-tight block mt-0.5">
                        SKU: {product.sku}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-3 w-full flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block leading-none mb-0.5">Harga</span>
                      <span className="text-xs font-black text-slate-900">
                        {formatCurrency(product.harga_jual_toko)}
                      </span>
                    </div>

                    {/* Stock badge — disembunyikan bila setelan "Sembunyikan sisa stok di POS" aktif */}
                    {aturanPos.sembunyikanStok ? null : product.lacak_inventori ? (
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        product.qty_stok > 10
                          ? 'bg-emerald-50 text-emerald-600'
                          : product.qty_stok > 0
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}>
                        Stok: {product.qty_stok}
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        Stok ∞
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Kolom Kanan: Keranjang Belanja */}
      <div className="w-full lg:w-[400px] bg-white border-l border-slate-200 flex flex-col h-full shadow-sm">
        {/* Customer & Info */}
        <div className="p-4 border-b border-slate-200 flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-800 text-sm">Keranjang Belanja</span>
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="text-xs font-bold text-rose-500 hover:text-rose-700 disabled:opacity-50 cursor-pointer"
            >
              Kosongkan
            </button>
          </div>

          {/* Customer Lookup Dropdown Search */}
          <div className="relative" ref={contactDropdownRef}>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <User size={14} className="text-slate-400" />
              {selectedContact ? (
                <div className="flex-1 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>{selectedContact.nama} ({selectedContact.nomor_wa})</span>
                  <button
                    onClick={() => {
                      setSelectedContact(null);
                      setContactSearch('');
                    }}
                    className="text-slate-400 hover:text-slate-600 text-sm"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Cari Pelanggan..."
                  value={contactSearch}
                  onChange={(e) => {
                    setContactSearch(e.target.value);
                    setShowContactDropdown(true);
                  }}
                  onFocus={() => setShowContactDropdown(true)}
                  className="flex-1 bg-transparent text-xs font-semibold focus:outline-none"
                />
              )}
            </div>

            {/* Suggestions Dropdown — disembunyikan bila setelan
                "Sembunyikan daftar pelanggan" aktif (kasir harus ketik kode/nomor persis) */}
            {showContactDropdown && contacts.length > 0 && !aturanPos.sembunyikanDaftarPelanggan && (
              <div className="absolute inset-x-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={async () => {
                      // PassKey pelanggan: minta PIN sebelum menautkan pelanggan.
                      if (!(await mintaPasskey('pelanggan'))) return;
                      setSelectedContact(contact);
                      setShowContactDropdown(false);
                    }}
                    className="w-full px-4 py-2 hover:bg-slate-50 text-left text-xs font-semibold text-slate-700 flex justify-between cursor-pointer border-b border-slate-100"
                  >
                    <span>{contact.nama}</span>
                    <span className="text-slate-400">{contact.nomor_wa}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="bg-slate-100 p-3 rounded-full text-slate-400 mb-2">
                <ShoppingBag size={24} />
              </div>
              <p className="text-xs text-slate-400 font-bold">Keranjang masih kosong</p>
              <p className="text-[10px] text-slate-400 max-w-[200px] mt-0.5">Pilih produk di katalog sebelah kiri untuk menambah ke keranjang belanja.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.key} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h6 className="font-extrabold text-xs text-slate-800 leading-tight truncate">
                      {item.nama}
                    </h6>
                    <span className="text-[10px] font-bold text-indigo-600 block mt-0.5">
                      {formatCurrency(item.harga)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.key)}
                    className="text-slate-300 hover:text-rose-500 transition-colors p-0.5"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Pemilih Satuan (UOM) — muncul bila produk punya satuan alternatif */}
                {uomAktif && item.product?.uom_enabled
                  && Array.isArray(item.product.uom_units) && item.product.uom_units.length > 0 && (
                  <select
                    value={item.uomKode || ''}
                    onChange={(e) => setCartItemUom(item.key, e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white cursor-pointer focus:outline-none"
                  >
                    <option value="">{item.product.satuan || 'pcs'} (satuan dasar)</option>
                    {item.product.uom_units.map((u) => (
                      <option key={u.id || u.kode_satuan} value={u.kode_satuan}>
                        {u.nama_satuan} — 1 = {u.konverter} {item.product.satuan || 'pcs'}
                      </option>
                    ))}
                  </select>
                )}

                <div className="flex items-center justify-between mt-1">
                  {/* Quantity Controls */}
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() => updateCartQty(item.key, item.qty - 1)}
                      className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-bold"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-800">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateCartQty(item.key, item.qty + 1)}
                      className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-bold"
                    >
                      <Plus size={10} />
                    </button>
                  </div>

                  <span className="text-xs font-black text-slate-900">
                    {formatCurrency(item.harga * item.qty)}
                  </span>
                </div>

                {/* Optional Item Note */}
                <input
                  type="text"
                  placeholder="Tambah catatan item..."
                  value={item.catatan}
                  onChange={(e) => updateCartItemNote(item.key, e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 border border-slate-100 rounded-lg text-[10px] font-semibold bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-300 transition-all"
                />
              </div>
            ))
          )}
        </div>

        {/* Summary and Action Buttons */}
        <div className="p-4 border-t border-slate-200 space-y-3 bg-white shrink-0">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between font-semibold text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(getSubtotal())}</span>
            </div>

            {/* Discount Section */}
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1">
                <Percent size={12} /> Diskon (%)
              </span>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent || ''}
                onChange={async (e) => {
                  const nilai = parseFloat(e.target.value) || 0;
                  // PassKey diskon: minta PIN saat kasir mulai memberi diskon.
                  if (nilai > 0 && !discountPercent && !(await mintaPasskey('diskon'))) return;
                  setDiscountPercent(nilai);
                }}
                className="w-16 text-right px-2 py-0.5 border border-slate-200 rounded-md font-bold focus:outline-none text-slate-700"
              />
            </div>

            {/* Tax Section */}
            <div className="flex items-center justify-between text-slate-500">
              <span>Pajak (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={taxPercent || ''}
                onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                className="w-16 text-right px-2 py-0.5 border border-slate-200 rounded-md font-bold focus:outline-none text-slate-700"
              />
            </div>

            <div className="h-px bg-slate-200 my-2" />

            <div className="flex justify-between font-black text-sm text-slate-900">
              <span>Total Belanja</span>
              <span className="text-indigo-600">{formatCurrency(getTotal())}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (window.confirm('Batalkan transaksi keranjang?')) {
                  clearCart();
                }
              }}
              disabled={cart.length === 0}
              className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl disabled:opacity-50 cursor-pointer text-center"
            >
              Batal
            </button>
            {!aturanPos.hideSplitbill && (
              <button
                onClick={() => setIsSplitModalOpen(true)}
                disabled={cart.length === 0}
                className="flex-1 py-2.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl disabled:opacity-50 cursor-pointer text-center"
              >
                Split Bill
              </button>
            )}
            <button
              onClick={handlePayClick}
              disabled={!shiftAktif || cart.length === 0}
              className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <CreditCard size={14} />
              <span>Bayar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Variant Picker */}
      {activeProductForVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full p-6 relative flex flex-col">
            <button
              onClick={() => setActiveProductForVariant(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={16} />
            </button>
            <h5 className="font-extrabold text-slate-800 text-sm mb-1">Pilih Varian</h5>
            <p className="text-xs text-slate-500 font-semibold mb-4">{activeProductForVariant.nama}</p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {activeProductForVariant.variants.map((v) => {
                const isOutOfStock =
                  activeProductForVariant.lacak_inventori && v.qty_stok <= 0
                  && aturanPos.blokirStokKosong;
                return (
                  <button
                    key={v.id}
                    disabled={isOutOfStock}
                    onClick={() => handleSelectVariant(v)}
                    className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/20 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <div>
                      <span className="font-extrabold text-slate-800 text-xs">{v.nama_varian}</span>
                      {v.sku && <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">SKU: {v.sku}</span>}
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 text-xs block">{formatCurrency(v.harga)}</span>
                      {activeProductForVariant.lacak_inventori && !aturanPos.sembunyikanStok && (
                        <span className="text-[10px] text-slate-500 font-bold">Stok: {v.qty_stok}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Pembayaran */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full p-6 relative flex flex-col shadow-2xl">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={16} />
            </button>
            <h5 className="font-extrabold text-slate-800 text-base mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-indigo-600" />
              <span>Pembayaran</span>
            </h5>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Sisi Kiri: Metode & Input */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-600 block mb-1">Metode Pembayaran</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Cash', 'Transfer', 'Debit', 'QRIS'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          paymentMethod === m
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-600 block mb-1">Jumlah Bayar (Rp.)</label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Sisi Kanan: Ringkasan & Kembalian */}
              <div className="bg-slate-50 rounded-2xl p-4 flex flex-col justify-between border border-slate-100">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-500 font-bold">
                    <span>Total Belanja:</span>
                    <span>{formatCurrency(getTotal())}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 font-bold">
                    <span>Dibayar:</span>
                    <span>{formatCurrency(parseFloat(amountPaid || 0))}</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 my-2 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 block leading-none mb-1">Kembalian</span>
                  <span className="text-lg font-black text-emerald-600">
                    {formatCurrency(Math.max(0, parseFloat(amountPaid || 0) - getTotal()))}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick cash shortcuts */}
            <div className="mb-4">
              <span className="text-[10px] font-bold text-slate-400 block mb-1.5">Uang Pas / Pintasan Cash</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleQuickCash(getTotal())}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Uang Pas
                </button>
                {[10000, 20000, 50000, 100000].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleQuickCash(val)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                  >
                    {formatCurrency(val)}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => submitTransaction(false)}
                disabled={isSubmittingTrans || parseFloat(amountPaid || 0) < getTotal()}
                className="py-3 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingTrans ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CreditCard size={15} />
                    <span>Bayar (Biasa)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => submitTransaction(true)}
                disabled={isSubmittingTrans || parseFloat(amountPaid || 0) < getTotal()}
                className="py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingTrans ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Factory size={15} />
                    <span>Bayar & Terbitkan SPK</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Receipt Preview / Printer Simulation */}
      {spkUntukNota && (
        <SpkPublishModal
          judul={`Terbitkan SPK — Nota ${spkUntukNota.nomor}`}
          keterangan="Item pada nota ini akan masuk papan kerja produksi sesuai divisi yang dipilih."
          onTerbitkan={terbitkanSpkNota}
          onClose={() => setSpkUntukNota(null)}
        />
      )}
      {lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full p-6 relative flex flex-col shadow-2xl">
            <button
              onClick={() => setLastReceipt(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={16} />
            </button>
            
            <div className="flex flex-col items-center text-center pb-4 border-b border-dashed border-slate-200">
              <h5 className="font-extrabold text-slate-800 text-base">Bintang Advertising</h5>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Nota Penjualan Kasir</p>
              <span className="text-[9px] text-slate-400 font-semibold block mt-1">No: {lastReceipt.nomor}</span>
              <span className="text-[9px] text-slate-400 font-semibold block">{new Date(lastReceipt.created_at).toLocaleString('id-ID')}</span>
            </div>

            {/* Receipt Items */}
            <div className="py-4 space-y-2 max-h-48 overflow-y-auto text-xs font-semibold text-slate-700">
              {lastReceipt.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-bold">{item.nama_snapshot}</p>
                    <span className="text-[10px] text-slate-400 font-semibold block">{item.qty} x {formatCurrency(item.harga_snapshot)}</span>
                  </div>
                  <span className="font-extrabold text-slate-900">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-3 border-t border-dashed border-slate-200 text-xs font-semibold text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(lastReceipt.subtotal)}</span>
              </div>
              {parseFloat(lastReceipt.diskon) > 0 && (
                <div className="flex justify-between text-rose-500">
                  <span>Diskon</span>
                  <span>-{formatCurrency(lastReceipt.diskon)}</span>
                </div>
              )}
              {parseFloat(lastReceipt.pajak) > 0 && (
                <div className="flex justify-between">
                  <span>Pajak</span>
                  <span>{formatCurrency(lastReceipt.pajak)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-slate-900 pt-1">
                <span>Total</span>
                <span>{formatCurrency(lastReceipt.total)}</span>
              </div>
              <div className="h-px bg-slate-100 my-1" />
              <div className="flex justify-between text-[10px]">
                <span>Metode Pembayaran</span>
                <span className="font-bold">{lastReceipt.metode_bayar}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>Dibayar</span>
                <span>{formatCurrency(lastReceipt.dibayar)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-emerald-600 font-bold">
                <span>Kembalian</span>
                <span>{formatCurrency(lastReceipt.kembalian)}</span>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl text-center cursor-pointer"
              >
                Cetak Resi
              </button>
              <button
                onClick={() => setLastReceipt(null)}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl text-center cursor-pointer"
              >
                Tutup
              </button>
            </div>
            {/* Pesanan custom di terminal tetap perlu dikerjakan divisi
                produksi — SPK-nya diterbitkan dari nota ini. */}
            <button
              onClick={() => setSpkUntukNota(lastReceipt)}
              className="w-full mt-2 py-2 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-xs rounded-xl text-center cursor-pointer"
            >
              Terbitkan SPK Produksi
            </button>
          </div>
        </div>
      )}

      {/* Modal & Print Sub-components */}
      <CustomItemModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onAdd={addCustomToCart}
      />

      <SplitBillModal
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
        cart={cart}
        selectedContact={selectedContact}
        discountPercent={discountPercent}
        taxPercent={taxPercent}
        cartNotes={cartNotes}
        onSplitSuccess={removeItemsFromCart}
        settings={fullSettings}
      />

      <ReceiptPrint
        receipt={lastReceipt}
        settings={fullSettings}
      />
    </div>
  );
}
