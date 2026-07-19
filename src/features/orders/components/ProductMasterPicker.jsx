import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import apiClient from '../../../api/apiClient';

/**
 * Pemilih master Produk (opsional) untuk sebuah item pesanan.
 *
 * Berbeda dari tombol "Cari Harga" yang memakai pricelist lama (ProductPrice),
 * ini menautkan item ke master `Product` sehingga laporan penjualan per
 * SKU/Kategori/Brand/Koleksi bisa mencakup pesanan advertising. Sengaja opsional
 * agar alur input lama tetap berjalan bila produk belum terdaftar di master.
 *
 * Props: value (id produk|null), valueLabel (nama tersimpan), onChange(product|null)
 */
export default function ProductMasterPicker({ value, valueLabel = '', onChange }) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setOptions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/products/?search=${encodeURIComponent(query)}`);
        setOptions((res.data.results || res.data || []).slice(0, 8));
      } catch {
        setOptions([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  if (value) {
    return (
      <div className="mt-1 flex items-center justify-between gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-[10px]">
        <span className="truncate font-bold text-emerald-700" title={valueLabel}>{valueLabel}</span>
        <button
          type="button"
          onClick={() => { onChange(null); setQuery(''); setOpen(false); }}
          title="Lepas tautan produk"
          className="shrink-0 text-emerald-600 hover:text-emerald-800 cursor-pointer"
        >
          <X size={11} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative mt-1">
      <div className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded">
        <Search size={11} className="text-slate-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Tautkan produk (opsional)"
          className="w-full text-[10px] bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
        />
      </div>
      {open && options.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border border-slate-200 rounded shadow-lg max-h-40 overflow-y-auto">
          {options.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onChange(p); setQuery(''); setOpen(false); }}
              className="w-full text-left px-2 py-1.5 text-[10px] hover:bg-slate-50 cursor-pointer block"
            >
              <span className="font-semibold text-slate-700 block truncate">{p.nama}</span>
              {p.sku && <span className="text-slate-400 font-mono">{p.sku}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
