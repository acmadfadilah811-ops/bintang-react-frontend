import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../../../api/apiClient';
import { useAuth } from '../../../context/AuthContext';

const KasirContext = createContext(null);

export function KasirProvider({ children }) {
  const { user } = useAuth();
  const [shiftAktif, setShiftAktif] = useState(null);
  const [loadingShift, setLoadingShift] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartNotes, setCartNotes] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  // Fetch active shift status on mount
  const checkActiveShift = async () => {
    setLoadingShift(true);
    try {
      const response = await apiClient.get('/saldo-kas-harian/');
      const list = response.data.results || response.data || [];
      const now = new Date();
      const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const isOpen = (item) =>
        (item.kas_akhir === null || item.kas_akhir === undefined) && !item.waktu_tutup;
      const getKasirId = (item) => {
        if (!item || item.kasir === undefined || item.kasir === null) return null;
        if (typeof item.kasir === 'object') return item.kasir.id;
        return item.kasir;
      };
      const milikSaya = (item) => {
        const kId = getKasirId(item);
        return user?.id && kId && String(kId) === String(user.id);
      };
      const active =
        list.find((item) => isOpen(item) && milikSaya(item) && item.tanggal === todayStr) ||
        list.find((item) => isOpen(item) && milikSaya(item)) ||
        null;
      setShiftAktif(active);
    } catch (error) {
      console.error('Error checking active shift:', error);
      setShiftAktif(null);
    } finally {
      setLoadingShift(false);
    }
  };

  useEffect(() => {
    checkActiveShift();
  }, []);

  /**
   * Ganti satuan (UOM) sebuah baris keranjang. Harga ikut menyesuaikan ke harga
   * satuan tersebut; qty dibiarkan apa adanya karena diinput dalam satuan itu.
   * Backend yang mengonversi ke satuan dasar saat transaksi disimpan.
   */
  const setCartItemUom = (key, kode) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const units = Array.isArray(item.product?.uom_units) ? item.product.uom_units : [];
        const unit = units.find((u) => u.kode_satuan === kode);
        if (!unit) {
          // Kembali ke satuan dasar.
          const dasar = item.variant
            ? (item.variant.harga ?? 0)
            : (item.product?.harga_jual_toko || 0);
          return { ...item, uomKode: '', harga: Number(dasar) };
        }
        const hargaUnit =
          Number(unit.harga_jual_toko) ||
          Number(item.product?.harga_jual_toko || 0) * (Number(unit.konverter) || 1);
        return { ...item, uomKode: kode, harga: Number(hargaUnit) };
      })
    );
  };

  const addToCart = (product, variant = null) => {
    setCart((prev) => {
      const key = variant ? `${product.id}-${variant.id}` : `${product.id}`;
      const existing = prev.find((item) => item.key === key);

      if (existing) {
        return prev.map((item) =>
          item.key === key ? { ...item, qty: item.qty + 1 } : item
        );
      }

      // Snapshot harga: varian pakai `harga`/`nama_varian` sesuai model ProductVariant
      const price = variant ? (variant.harga ?? 0) : (product.harga_jual_toko || 0);
      const name = variant ? `${product.nama} (${variant.nama_varian})` : product.nama;

      return [
        ...prev,
        {
          key,
          product,
          variant,
          nama: name,
          harga: Number(price),
          qty: 1,
          catatan: '',
          // Satuan alternatif (UOM); '' = satuan dasar produk.
          uomKode: '',
        },
      ];
    });
  };

  const addCustomToCart = (nama, harga, qty = 1, catatan = '') => {
    setCart((prev) => {
      const key = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      return [
        ...prev,
        {
          key,
          product: null,
          variant: null,
          nama,
          harga: Number(harga),
          qty: Number(qty),
          catatan,
          uomKode: '',
        },
      ];
    });
  };

  const removeFromCart = (key) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  };

  const updateCartQty = (key, qty) => {
    if (qty <= 0) {
      removeFromCart(key);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.key === key ? { ...item, qty } : item))
    );
  };

  const updateCartItemNote = (key, note) => {
    setCart((prev) =>
      prev.map((item) => (item.key === key ? { ...item, catatan: note } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
    setCartNotes('');
    setSelectedContact(null);
    setDiscountPercent(0);
    setTaxPercent(0);
    setSelectedCoupon(null);
  };

  const removeItemsFromCart = (itemsToRemove) => {
    setCart((prev) => {
      let updated = prev.map(item => ({ ...item }));
      itemsToRemove.forEach((toRemove) => {
        const idx = updated.findIndex(item => item.key === toRemove.key);
        if (idx !== -1) {
          const newQty = updated[idx].qty - toRemove.qty;
          if (newQty <= 0) {
            updated = updated.filter(item => item.key !== toRemove.key);
          } else {
            updated[idx].qty = newQty;
          }
        }
      });
      return updated;
    });
  };

  const getSubtotal = () => {
    return Math.round(cart.reduce((sum, item) => sum + Number(item.harga) * Number(item.qty), 0));
  };

  const getDiscountAmount = () => {
    return Math.round((getSubtotal() * Number(discountPercent || 0)) / 100);
  };

  const getCouponDiscountAmount = () => {
    if (!selectedCoupon) return 0;
    const subtotal = getSubtotal();
    if (selectedCoupon.min_total_pesanan && subtotal < Number(selectedCoupon.min_total_pesanan)) {
      return 0;
    }
    if (selectedCoupon.tipe_diskon === 'percent') {
      let val = Math.round((subtotal * Number(selectedCoupon.jumlah_diskon || 0)) / 100);
      if (Number(selectedCoupon.maksimal_jumlah_diskon) > 0) {
        val = Math.min(val, Number(selectedCoupon.maksimal_jumlah_diskon));
      }
      return Math.min(val, subtotal);
    }
    return Math.min(subtotal, Number(selectedCoupon.jumlah_diskon || 0));
  };

  const getTaxAmount = () => {
    const afterDiscount = Math.max(0, getSubtotal() - getDiscountAmount() - getCouponDiscountAmount());
    return Math.round((afterDiscount * Number(taxPercent || 0)) / 100);
  };

  const getTotal = () => {
    return Math.max(0, Math.round(getSubtotal() - getDiscountAmount() - getCouponDiscountAmount() + getTaxAmount()));
  };

  return (
    <KasirContext.Provider
      value={{
        shiftAktif,
        setShiftAktif,
        loadingShift,
        checkActiveShift,
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
        selectedCoupon,
        setSelectedCoupon,
        getSubtotal,
        getDiscountAmount,
        getCouponDiscountAmount,
        getTaxAmount,
        getTotal,
        cartNotes,
        setCartNotes,
      }}
    >
      {children}
    </KasirContext.Provider>
  );
}

export function useKasir() {
  const context = useContext(KasirContext);
  if (!context) {
    throw new Error('useKasir must be used within a KasirProvider');
  }
  return context;
}
