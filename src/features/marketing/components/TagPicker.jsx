import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import apiClient from '../../../api/apiClient';

/**
 * Input tag multi-pilih yang mengambil opsi dari data asli (produk/brand/grup/paket/pelanggan)
 * lewat apiClient, dipakai untuk field kriteria yang sebelumnya cuma teks bebas.
 * Value tersimpan sebagai string dipisah koma agar tetap kompatibel dengan CharField backend.
 */
export default function TagPicker({ value, onChange, fetchUrl, placeholder }) {
  const [options, setOptions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const tags = value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const loadOptions = async () => {
    if (loaded) return;
    try {
      const res = await apiClient.get(fetchUrl);
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setOptions(list.map((o) => o.nama).filter(Boolean));
      setLoaded(true);
    } catch (err) {
      console.error('[TagPicker] fetch error:', err);
    }
  };

  const addTag = (name) => {
    if (!tags.includes(name)) onChange([...tags, name].join(', '));
    setQuery('');
  };
  const removeTag = (name) => onChange(tags.filter((t) => t !== name).join(', '));

  const filteredOptions = options.filter((o) => !tags.includes(o) && o.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <div className="flex flex-wrap items-center gap-1.5 border border-slate-200 rounded-lg px-2 py-1.5 focus-within:border-blue-400">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-md">
            {t}
            <button type="button" onClick={() => removeTag(t)} className="hover:text-blue-900 cursor-pointer">
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setOpen(true);
            loadOptions();
          }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[100px] text-sm outline-none py-0.5 text-slate-700 placeholder-slate-400"
        />
      </div>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-full max-h-48 overflow-y-auto bg-white rounded-lg border border-slate-200 shadow-lg z-30 py-1">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400">{loaded ? 'Tidak ada hasil' : 'Memuat...'}</div>
          ) : (
            filteredOptions.slice(0, 20).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => addTag(o)}
                className="w-full text-left px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {o}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
