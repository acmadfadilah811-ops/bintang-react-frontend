import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../../../api/apiClient';

const KasirContext = createContext(null);

export function KasirProvider({ children }) {
  const [shiftAktif, setShiftAktif] = useState(null);
  const [loadingShift, setLoadingShift] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartNotes, setCartNotes] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);

  // Fetch active shift status on mount
  const checkActiveShift = async () => {
    setLoadingShift(true);
    try {
      // API endpoint for checking active shift. 
      // If none, we should prompt to open shift (Kas Awal).
      const response = await apiClient.get('/saldo-kas-harian/');
      // Filter for today / active shift
      // Let's assume the API returns list or has an active flag.
      // Usually, it lists today's records. Let's find one that is active or use the last one.
      const list = response.data || [];
      // Shift terbuka = kas_akhir belum diisi (null). Model SaldoKasHarian tak punya `waktu_tutup`.
      const todayStr = new Date().toISOString().slice(0, 10);
      const isOpen = (item) => item.kas_akhir === null || item.kas_akhir === undefined;
      const active =
        list.find((item) => item.tanggal === todayStr && isOpen(item)) ||
        list.find(isOpen) ||
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
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.harga * item.qty, 0);
  };

  const getDiscountAmount = () => {
    return (getSubtotal() * discountPercent) / 100;
  };

  const getTaxAmount = () => {
    const afterDiscount = getSubtotal() - getDiscountAmount();
    return (afterDiscount * taxPercent) / 100;
  };

  const getTotal = () => {
    return getSubtotal() - getDiscountAmount() + getTaxAmount();
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
        removeFromCart,
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
