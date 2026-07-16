import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Dropdown Tipe Promosi. Nilai default 'Semua' tampil sebagai "Tipe Promosi"
 * di kolomnya; memilih tipe lain (DQ/BX/DA/FI) menampilkan tipe tsb.
 */
export default function PromoTipeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  const options = ['Semua', 'DQ', 'BX', 'DA', 'FI'];
  const isAll = value === 'Semua';
  return (
    <div className="relative min-w-[140px]" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white hover:border-slate-300 cursor-pointer"
      >
        <span className={isAll ? 'text-slate-400' : 'text-slate-700'}>{isAll ? 'Tipe Promosi' : value}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg z-30 py-1">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm cursor-pointer ${
                opt === value ? 'text-blue-600 font-semibold bg-blue-50/60' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
