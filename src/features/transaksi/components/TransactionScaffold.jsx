import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Search,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react';
import { useTransaksiCrumb } from './TransaksiContext';

/** Dropdown kustom (dipakai untuk "Status order" & "Baris per halaman"). */
export function Dropdown({ options = [], value, onChange, placeholder = 'Pilih', minW = 'min-w-[180px]' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className={`relative ${minW}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white hover:border-slate-300 transition-colors cursor-pointer"
      >
        <span className={value ? 'text-slate-700 font-medium' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg z-30 py-1 max-h-64 overflow-y-auto animate-fade-in">
          {options.map((opt) => {
            const isActive = opt === value;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange?.(opt);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                  isActive
                    ? 'text-blue-600 font-semibold bg-blue-50/70'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const fmtShort = (d) =>
  new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' });

/** Hitung rentang tanggal dari preset terpilih. */
function computePresetRange(preset) {
  const today = new Date();
  let start = new Date();
  let end = new Date();
  switch (preset) {
    case 'today':
      break;
    case 'yesterday':
      start.setDate(today.getDate() - 1);
      end.setDate(today.getDate() - 1);
      break;
    case 'last7':
      start.setDate(today.getDate() - 6);
      break;
    case 'last30':
      start.setDate(today.getDate() - 29);
      break;
    case 'thisMonth':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case 'lastMonth':
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    default:
      return { start: null, end: null };
  }
  return { start, end };
}

const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7', label: 'Last 7 Days' },
  { id: 'last30', label: 'Last 30 Days' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
  { id: 'all', label: 'All Time' },
  { id: 'custom', label: 'Custom Range' },
];

/** Kontrol rentang tanggal — dropdown preset + custom range yang fungsional. */
export function DateRangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toISO = (d) => (d ? new Date(d).toISOString().split('T')[0] : '');

  const selectPreset = (id) => {
    if (id === 'all') {
      onChange({ preset: 'all', start: null, end: null });
      setOpen(false);
      return;
    }
    if (id === 'custom') {
      onChange({ preset: 'custom', start: value.start || new Date(), end: value.end || new Date() });
      return; // biarkan dropdown terbuka untuk isi tanggal
    }
    const { start, end } = computePresetRange(id);
    onChange({ preset: id, start, end });
    setOpen(false);
  };

  // Geser rentang maju/mundur sebesar panjang rentang aktif.
  const shift = (dir) => {
    if (!value.start || !value.end) return;
    const start = new Date(value.start);
    const end = new Date(value.end);
    const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
    start.setDate(start.getDate() + dir * days);
    end.setDate(end.getDate() + dir * days);
    onChange({ preset: 'custom', start, end });
  };

  const isAll = value.preset === 'all' || !value.start || !value.end;
  const label = isAll ? 'All Time' : `${fmtShort(value.start)} - ${fmtShort(value.end)}`;

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-600 bg-white">
        <button
          onClick={() => shift(-1)}
          disabled={isAll}
          className="p-1 hover:bg-slate-50 rounded text-slate-400 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 px-2 whitespace-nowrap cursor-pointer hover:text-slate-800"
        >
          <Calendar size={15} /> {label}
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        <button
          onClick={() => shift(1)}
          disabled={isAll}
          className="p-1 hover:bg-slate-50 rounded text-slate-400 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-52 bg-white rounded-lg border border-slate-200 shadow-lg z-30 py-1 animate-fade-in">
          {DATE_PRESETS.map((p) => {
            const isActive = value.preset === p.id;
            return (
              <div key={p.id}>
                <button
                  type="button"
                  onClick={() => selectPreset(p.id)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                    isActive
                      ? 'text-white bg-blue-500 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>

                {p.id === 'custom' && value.preset === 'custom' && (
                  <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/70 flex flex-col gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Mulai Dari
                      </label>
                      <input
                        type="date"
                        value={toISO(value.start)}
                        onChange={(e) =>
                          onChange({
                            preset: 'custom',
                            start: e.target.value ? new Date(e.target.value) : null,
                            end: value.end,
                          })
                        }
                        className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs outline-none focus:border-blue-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Sampai Dengan
                      </label>
                      <input
                        type="date"
                        value={toISO(value.end)}
                        onChange={(e) =>
                          onChange({
                            preset: 'custom',
                            start: value.start,
                            end: e.target.value ? new Date(e.target.value) : null,
                          })
                        }
                        className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs outline-none focus:border-blue-300"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-md py-1.5 mt-1 cursor-pointer transition-colors"
                    >
                      Terapkan
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Tabel data dengan header ber-sort + baris "No Data" saat kosong. */
function DataTableView({ columns, rows }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="px-4 py-3.5 text-left font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200 last:border-r-0"
                >
                  <span className="inline-flex items-center gap-1">
                    {c.label}
                    {c.sortable !== false && (
                      <ChevronsUpDown size={13} className="text-slate-400" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center text-slate-400">
                  No Data
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.id || i} className="border-b border-slate-100 hover:bg-slate-50/60">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className="px-4 py-3 text-slate-700 whitespace-nowrap border-r border-slate-100 last:border-r-0"
                    >
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Pagination (visual) — baris/halaman di kiri (opsional), navigasi di kanan. */
function Pagination({ rowsPerPage, onRowsPerPageChange, showRows = true }) {
  return (
    <div
      className={`flex items-center gap-5 px-1 py-4 text-sm text-slate-500 ${
        showRows ? 'justify-between' : ''
      }`}
    >
      {showRows && (
        <Dropdown
          options={['10 Baris', '20 Baris', '50 Baris', '100 Baris']}
          value={rowsPerPage}
          onChange={onRowsPerPageChange}
          minW="min-w-[140px]"
        />
      )}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded hover:bg-slate-100 text-slate-400 cursor-pointer">
            <ChevronLeft size={16} />
          </button>
          <button className="w-7 h-7 rounded-md text-blue-600 font-semibold hover:bg-blue-50 cursor-pointer">
            1
          </button>
          <button className="p-1.5 rounded hover:bg-slate-100 text-slate-400 cursor-pointer">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span>Go to</span>
          <input
            defaultValue="1"
            className="w-12 text-center border border-slate-200 rounded-md py-1 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
          />
        </div>
      </div>
    </div>
  );
}

/** Empty state: ilustrasi + judul + deskripsi, di dalam kotak abu lembut. */
function EmptyState({ icon: Icon, art, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6">
      {art ? (
        <div className="mb-4">{art}</div>
      ) : (
        <div className="w-32 h-32 rounded-full bg-sky-50 flex items-center justify-center mb-4">
          {Icon && <Icon size={52} strokeWidth={1.5} className="text-sky-300" />}
        </div>
      )}
      <h3 className="text-slate-600 font-semibold max-w-xs leading-relaxed">{title}</h3>
      {description && <p className="text-slate-400 text-sm mt-1.5 max-w-sm">{description}</p>}
    </div>
  );
}

/** Tombol aksi seragam untuk header halaman transaksi. */
export function TButton({ children, variant = 'primary', className = '', ...props }) {
  const base =
    'inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-4 py-2 transition-colors cursor-pointer focus:outline-none';
  const styles =
    variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
      : variant === 'success'
        ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
        : variant === 'danger'
          ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm'
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50';
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}

/**
 * Kerangka halaman transaksi (panel full-screen, flush tanpa gap).
 *
 * Setiap tab: { id, label, title, heading?, unit, variant?, emptyTitle, emptyDesc, match }.
 * - variant 'empty' (default): toolbar status + ilustrasi empty (mis. "Butuh Diproses").
 * - variant 'table': toolbar baris/halaman + tabel "No Data" + pagination (mis. "Selesai").
 * `children` mengganti area konten (mode form) tanpa menghilangkan tab.
 */
export default function TransactionScaffold({
  tabs,
  actions,
  statusOptions = [],
  searchPlaceholder = 'Cari',
  emptyIcon,
  emptyArt,
  columns = [],
  rows = [],
  children,
  onTabChange,
}) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState('20 Baris');
  const [dateFilter, setDateFilter] = useState({ preset: 'all', start: null, end: null });
  const { setSubtitle } = useTransaksiCrumb();
  const current = tabs.find((t) => t.id === activeTab) || tabs[0];
  const variant = current?.variant || 'empty';
  const cols = current?.columns || columns;
  const dateKey = current?.dateKey || 'tanggal';
  const statusOpts = current?.statusOptions || statusOptions; // status bisa di-override per tab
  const paymentOptions = current?.paymentOptions; // filter "Pembayaran" hanya bila tab menyediakannya
  const rowsTop = !!current?.rowsTop; // baris/halaman di toolbar (tanpa status), mis. tab Dibatalkan

  useEffect(() => {
    if (!children) setSubtitle(current?.title || '');
  }, [current?.title, children, setSubtitle]);

  // Filter rentang tanggal — baris tanpa tanggal valid tetap ditampilkan.
  const inDateRange = (r) => {
    if (dateFilter.preset === 'all' || !dateFilter.start || !dateFilter.end) return true;
    const raw = r[dateKey];
    if (!raw) return true;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return true;
    const s = new Date(dateFilter.start);
    s.setHours(0, 0, 0, 0);
    const e = new Date(dateFilter.end);
    e.setHours(23, 59, 59, 999);
    return d >= s && d <= e;
  };

  const filteredRows = rows.filter((r) => (!current?.match || current.match(r)) && inDateRange(r));

  const handleTab = (id) => {
    setActiveTab(id);
    onTabChange?.(id);
  };

  return (
    <div className="flex flex-col flex-1 bg-white">
      {/* Tabs — lebar sama, tersebar penuh ke samping */}
      <div className="flex border-b border-slate-200 shrink-0">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => handleTab(tab.id)}
              className={`flex-1 px-4 py-4 text-sm font-semibold whitespace-nowrap text-center transition-colors cursor-pointer ${
                isActive
                  ? 'text-blue-600 bg-blue-50/70'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/40'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {children ? (
        <div className="flex-1 bg-[#F4F7FE]">{children}</div>
      ) : (
        <div className="flex flex-col flex-1">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5 shrink-0">
            <div>
              <h2 className="text-slate-800 font-bold text-[15px]">
                {current?.heading || current?.title}
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {filteredRows.length} {current?.unit || 'Data'}
              </p>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>

          {/* Toolbar — dua gaya: dengan filter "Pembayaran" (mis. Retur) atau dengan rentang tanggal. */}
          {paymentOptions ? (
            /* Gaya filter: Status + Pembayaran di kiri, kolom cari memanjang. */
            <div className="flex items-center gap-3 px-6 py-4 shrink-0">
              <Dropdown
                options={statusOpts}
                value={status}
                onChange={setStatus}
                placeholder="Status"
                minW="min-w-[130px]"
              />
              <Dropdown
                options={paymentOptions}
                value={payment}
                onChange={setPayment}
                placeholder="Pembayaran"
                minW="min-w-[150px]"
              />
              <label className="flex-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-white focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300">
                <Search size={16} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="bg-transparent outline-none w-full placeholder:text-slate-400"
                />
              </label>
            </div>
          ) : (
            /* Gaya default & "rows": kiri (status / baris) — tanggal (tengah) — cari (kanan). */
            <div className="grid grid-cols-3 items-center gap-3 px-6 py-4 shrink-0">
              <div className="justify-self-start">
                {rowsTop ? (
                  <Dropdown
                    options={['10 Baris', '20 Baris', '50 Baris', '100 Baris']}
                    value={rowsPerPage}
                    onChange={setRowsPerPage}
                    minW="min-w-[140px]"
                  />
                ) : (
                  <Dropdown
                    options={statusOpts}
                    value={status}
                    onChange={setStatus}
                    placeholder="Status order"
                  />
                )}
              </div>

              <div className="justify-self-center">
                <DateRangePicker value={dateFilter} onChange={setDateFilter} />
              </div>

              <label className="justify-self-end w-full max-w-[260px] flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-white focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300">
                <Search size={16} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="bg-transparent outline-none w-full placeholder:text-slate-400"
                />
              </label>
            </div>
          )}

          {/* Body */}
          {variant === 'table' ? (
            <div className="px-6 pb-6">
              <DataTableView columns={cols} rows={filteredRows} />
              <Pagination
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={setRowsPerPage}
                showRows={!rowsTop}
              />
            </div>
          ) : (
            <div className="flex-1 px-6 pb-6 min-h-0">
              <div className="h-full rounded-xl bg-slate-50/50 border border-slate-100 flex items-center justify-center overflow-auto">
                {filteredRows.length === 0 ? (
                  <EmptyState
                    icon={emptyIcon}
                    art={emptyArt}
                    title={current?.emptyTitle}
                    description={current?.emptyDesc}
                  />
                ) : (
                  <div className="w-full self-stretch">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white text-slate-500 text-left border-b border-slate-100">
                          {cols.map((c) => (
                            <th key={c.key} className="px-4 py-3 font-semibold whitespace-nowrap">
                              {c.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredRows.map((row, i) => (
                          <tr key={row.id || i} className="hover:bg-slate-50/60">
                            {cols.map((c) => (
                              <td
                                key={c.key}
                                className="px-4 py-3 text-slate-700 whitespace-nowrap"
                              >
                                {c.render ? c.render(row) : row[c.key]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
