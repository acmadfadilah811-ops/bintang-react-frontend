import { useEffect, useState } from 'react';
import {
  Minus,
  Plus,
  FileSpreadsheet,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Search,
} from 'lucide-react';
import { Dropdown, DateRangePicker, TButton } from '../components/TransactionScaffold';
import { useTransaksiCrumb } from '../components/TransaksiContext';
import { useAuth } from '../../../context/AuthContext';
import TambahTransaksiModal from '../components/TambahTransaksiModal';
import TambahTipeTransaksiForm from '../components/TambahTipeTransaksiForm';
import ImportTipeTransaksiModal from '../components/ImportTipeTransaksiModal';

const transaksiColumns = [
  { key: 'no', label: 'No. Transaksi' },
  { key: 'tanggal', label: 'Tanggal' },
  { key: 'staff', label: 'Staff' },
  { key: 'waktu', label: 'Waktu' },
  { key: 'jumlah', label: 'Jumlah' },
  { key: 'catatan', label: 'Catatan' },
  { key: 'tipe', label: 'Tipe Transaksi' },
  { key: 'aksi', label: 'Aksi', sortable: false },
];

const tipeColumns = [
  { key: 'nama', label: 'Nama' },
  { key: 'tipe', label: 'Tipe Transaksi' },
  { key: 'aksi', label: 'Aksi', sortable: false },
];

/** Tabel sederhana dengan header sortable + baris "No Data". */
function SimpleTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((c) => (
              <th
                key={c.key}
                className="px-4 py-3.5 text-left font-semibold text-slate-600 whitespace-nowrap"
              >
                <span className="inline-flex items-center gap-1">
                  {c.label}
                  {c.sortable !== false && <ChevronsUpDown size={13} className="text-slate-400" />}
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
                  <td key={c.key} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    {row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Pagination ringkas (tanpa pemilih baris/halaman). */
function MiniPagination() {
  return (
    <div className="flex items-center gap-5 px-1 py-4 text-sm text-slate-500">
      <div className="flex items-center gap-1">
        <button className="p-1.5 rounded hover:bg-slate-100 text-slate-400 cursor-pointer">
          <ChevronLeft size={16} />
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
  );
}

export default function PendapatanPengeluaran() {
  const { user } = useAuth();
  const { setSubtitle } = useTransaksiCrumb();
  const [activeTab, setActiveTab] = useState('transaksi'); // 'transaksi' | 'tipe'
  const [modal, setModal] = useState(null); // null | 'pengeluaran' | 'pendapatan'

  // Toolbar tab "Transaksi"
  const [rowsPerPage, setRowsPerPage] = useState('5 Baris');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(() => {
    const d = new Date();
    return { preset: 'today', start: d, end: d };
  });

  // Tab "Tipe Transaksi"
  const [tipeView, setTipeView] = useState('list'); // 'list' | 'create'
  const [tipeRows, setTipeRows] = useState('5 Baris');
  const [tipeSearch, setTipeSearch] = useState('');
  const [showImportTipe, setShowImportTipe] = useState(false);

  const transaksiData = []; // TODO: hubungkan ke backend
  const tipeData = []; // TODO: hubungkan ke backend

  useEffect(() => {
    if (activeTab === 'tipe') {
      setSubtitle(tipeView === 'create' ? 'Buat Tipe Transaksi' : 'Tipe Transaksi');
    } else {
      setSubtitle('Transaksi');
    }
  }, [activeTab, tipeView, setSubtitle]);

  const tabs = [
    { id: 'transaksi', label: 'Transaksi' },
    { id: 'tipe', label: 'Tipe Transaksi' },
  ];

  // Mode buat tipe transaksi → halaman penuh tanpa tab.
  if (activeTab === 'tipe' && tipeView === 'create') {
    return (
      <div className="flex flex-col flex-1 bg-white p-6">
        <TambahTipeTransaksiForm onCancel={() => setTipeView('list')} />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-white">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 shrink-0">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      {activeTab === 'transaksi' ? (
        <div className="flex flex-col flex-1 p-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-slate-800 font-bold text-[15px]">Transaksi</h2>
              <p className="text-slate-400 text-xs mt-0.5">{transaksiData.length} Transaksi</p>
            </div>
            <div className="flex items-center gap-2">
              <TButton variant="danger" onClick={() => setModal('pengeluaran')}>
                <Minus size={16} /> Pengeluaran
              </TButton>
              <TButton variant="success" onClick={() => setModal('pendapatan')}>
                <Plus size={16} /> Pendapatan
              </TButton>
              <TButton variant="primary">
                <FileSpreadsheet size={16} /> Export Excel
              </TButton>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 py-4">
            <Dropdown
              options={['5 Baris', '10 Baris', '25 Baris', '50 Baris']}
              value={rowsPerPage}
              onChange={setRowsPerPage}
              minW="min-w-[120px]"
            />
            <div className="flex items-center gap-3">
              <label className="w-56 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-white focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300">
                <Search size={16} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari"
                  className="bg-transparent outline-none w-full placeholder:text-slate-400"
                />
              </label>
              <DateRangePicker value={dateFilter} onChange={setDateFilter} />
            </div>
          </div>

          <SimpleTable columns={transaksiColumns} rows={transaksiData} />
          <MiniPagination />
        </div>
      ) : (
        <div className="flex flex-col flex-1 p-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-slate-800 font-bold text-[15px]">Tipe Transaksi</h2>
              <p className="text-slate-400 text-xs mt-0.5">{tipeData.length} Tipe</p>
            </div>
            <div className="flex items-center gap-2">
              <TButton variant="primary" onClick={() => setShowImportTipe(true)}>
                <UploadCloud size={16} /> Import
              </TButton>
              <TButton variant="primary" onClick={() => setTipeView('create')}>
                <Plus size={16} /> Tambah
              </TButton>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 py-4">
            <Dropdown
              options={['5 Baris', '10 Baris', '25 Baris', '50 Baris']}
              value={tipeRows}
              onChange={setTipeRows}
              minW="min-w-[120px]"
            />
            <label className="w-56 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-white focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300">
              <Search size={16} className="text-slate-400" />
              <input
                value={tipeSearch}
                onChange={(e) => setTipeSearch(e.target.value)}
                placeholder="Cari"
                className="bg-transparent outline-none w-full placeholder:text-slate-400"
              />
            </label>
          </div>

          <SimpleTable columns={tipeColumns} rows={tipeData} />
          <MiniPagination />
        </div>
      )}

      {modal && (
        <TambahTransaksiModal
          mode={modal}
          staffName={user?.username || ''}
          onClose={() => setModal(null)}
        />
      )}
      {showImportTipe && <ImportTipeTransaksiModal onClose={() => setShowImportTipe(false)} />}
    </div>
  );
}
