import { useState, useEffect, useRef } from 'react';
import { Copy } from 'lucide-react';
import apiClient from '../../../api/apiClient';

/** Dropdown "Salin Diskon" — pilih promo yang sudah ada untuk diduplikasi jadi draft baru. */
export default function SalinDiskonButton({ rows, onCopied }) {
  const [open, setOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleCopy = async (row) => {
    setCopying(true);
    try {
      await apiClient.post(`/pos-promotions/${row.id}/duplicate/`);
      onCopied();
    } catch (err) {
      console.error('[VoucherDiskon] duplicate promotion error:', err);
    } finally {
      setCopying(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={rows.length === 0 || copying}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer transition-colors"
      >
        <Copy size={15} /> {copying ? 'Menyalin...' : 'Salin Diskon'}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 max-h-64 overflow-y-auto bg-white rounded-lg border border-slate-200 shadow-lg z-30 py-1">
          {rows.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400">Belum ada promosi</div>
          ) : (
            rows.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => handleCopy(row)}
                className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {row.judul}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
