import { useState } from 'react';
import { Plus, UploadCloud, Settings, ShoppingCart } from 'lucide-react';
import TransactionScaffold, { TButton } from '../components/TransactionScaffold';
import ImportPembelianModal from '../components/ImportPembelianModal';
import PembelianBaruModal from '../components/PembelianBaruModal';
import PembelianSettingsDrawer from '../components/PembelianSettingsDrawer';
import TambahReturModal from '../components/TambahReturModal';

const columns = [
  { key: 'no', label: 'No. Pembelian' },
  { key: 'tanggal', label: 'Tanggal Beli' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'jumlah', label: 'Jumlah' },
  { key: 'telahBayar', label: 'Telah Bayar' },
  { key: 'tanggalBayar', label: 'Tanggal Pembayaran' },
  { key: 'status', label: 'Status' },
];

const returColumns = [
  { key: 'noRetur', label: 'No. Retur' },
  { key: 'noPembelian', label: 'No. Pembelian' },
  { key: 'returDate', label: 'Retur Date' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'totalRetur', label: 'Total Retur' },
  { key: 'tanggalBayar', label: 'Tanggal Pembayaran' },
  { key: 'status', label: 'Status' },
  { key: 'pembayaran', label: 'Pembayaran/Pengembalian' },
];

const cancelColumns = [
  { key: 'no', label: 'No. Pembelian' },
  { key: 'tanggal', label: 'Tanggal Beli' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'jumlah', label: 'Jumlah' },
  { key: 'telahBayar', label: 'Telah Bayar' },
  { key: 'tanggalBayar', label: 'Tanggal Pembayaran' },
  { key: 'terakhir', label: 'Terakhir Diperbarui' },
];

const statusOptions = ['Semua', 'Tunda', 'Dikonfirmasi', 'Diterima', 'Selesai', 'Batal'];

const tabs = [
  {
    id: 'butuh-diproses',
    label: 'Butuh Diproses',
    title: 'Pembelian Butuh Diproses',
    unit: 'Pembelian',
    variant: 'table',
  },
  {
    id: 'selesai',
    label: 'Telah Diproses',
    title: 'Pembelian Telah Diproses',
    unit: 'Pembelian',
    variant: 'table',
  },
  {
    id: 'retur',
    label: 'Retur',
    title: 'Pembelian Dikembalikan',
    unit: 'Retur',
    variant: 'table',
    columns: returColumns,
    statusOptions: ['Semua', 'Dikonfirmasi', 'Tunda', 'Batal'],
    paymentOptions: ['Semua', 'Selesai', 'Tunda'],
  },
  {
    id: 'dibatalkan',
    label: 'Dibatalkan',
    title: 'Pembelian Dibatalkan',
    heading: 'Pesanan Dibatalkan',
    unit: 'Pembelian',
    variant: 'table',
    rowsTop: true,
    columns: cancelColumns,
  },
];

export default function Pembelian() {
  const [showImport, setShowImport] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRetur, setShowRetur] = useState(false);
  const [activeTab, setActiveTab] = useState('butuh-diproses');

  // Aksi header berbeda per tab.
  const actions =
    activeTab === 'butuh-diproses' ? (
      <>
        <TButton variant="primary" onClick={() => setShowImport(true)}>
          <UploadCloud size={16} /> Import
        </TButton>
        <TButton variant="success" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Tambah
        </TButton>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          title="Pengaturan pembelian"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
        >
          <Settings size={18} />
        </button>
      </>
    ) : activeTab === 'retur' ? (
      <TButton variant="success" onClick={() => setShowRetur(true)}>
        <Plus size={16} /> Tambah
      </TButton>
    ) : null;

  return (
    <>
      <TransactionScaffold
        tabs={tabs}
        columns={columns}
        statusOptions={statusOptions}
        searchPlaceholder="Cari Pesanan"
        emptyIcon={ShoppingCart}
        actions={actions}
        onTabChange={setActiveTab}
      />

      {showImport && <ImportPembelianModal onClose={() => setShowImport(false)} />}
      {showCreate && <PembelianBaruModal onClose={() => setShowCreate(false)} />}
      {showSettings && <PembelianSettingsDrawer onClose={() => setShowSettings(false)} />}
      {showRetur && <TambahReturModal onClose={() => setShowRetur(false)} />}
    </>
  );
}
