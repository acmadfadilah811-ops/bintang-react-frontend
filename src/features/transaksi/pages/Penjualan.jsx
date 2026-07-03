import { useState } from 'react';
import { Plus, FileSpreadsheet } from 'lucide-react';
import TransactionScaffold, { TButton } from '../components/TransactionScaffold';
import CreateOrderForm from '../components/CreateOrderForm';
import ReturnOrderForm from '../components/ReturnOrderForm';
import ImportStatusModal from '../components/ImportStatusModal';
import PolarBearEmpty from '../components/PolarBearEmpty';

const columns = [
  { key: 'no', label: 'No. Pesanan' },
  { key: 'tanggal', label: 'Tanggal Beli' },
  { key: 'pelanggan', label: 'Pelanggan' },
  { key: 'tujuan', label: 'Tujuan Pengiriman' },
  { key: 'total', label: 'Total' },
  { key: 'telahBayar', label: 'Telah Bayar', sortable: false },
  { key: 'terakhir', label: 'Terakhir Diperbarui' },
];

const returnColumns = [
  { key: 'no', label: 'No. Pesanan' },
  { key: 'tanggal', label: 'Tanggal' },
  { key: 'pelanggan', label: 'Pelanggan' },
  { key: 'jumlah', label: 'Jumlah' },
  { key: 'status', label: 'Status' },
];

const cancelColumns = [
  { key: 'no', label: 'No. Pesanan' },
  { key: 'tanggal', label: 'Tanggal Beli' },
  { key: 'pelanggan', label: 'Pelanggan' },
  { key: 'tujuan', label: 'Tujuan Pengiriman' },
  { key: 'total', label: 'Total' },
  { key: 'telahBayar', label: 'Telah Bayar' },
];

const tabs = [
  {
    id: 'butuh-diproses',
    label: 'Butuh Diproses',
    title: 'Pesanan Butuh Diproses',
    unit: 'Pesanan',
    emptyTitle: 'Belum ada penjualan yang butuh di proses.',
    emptyDesc: 'Pemesanan produk oleh outlet-outletmu akan muncul di sini.',
  },
  {
    id: 'selesai',
    label: 'Selesai',
    title: 'Pesanan Selesai',
    heading: 'Telah Diproses',
    unit: 'Pesanan',
    variant: 'table',
  },
  {
    id: 'pengembalian',
    label: 'Pengembalian',
    title: 'Pengembalian Penjualan',
    heading: 'Pengembalian Pesanan',
    unit: 'Pesanan',
    variant: 'table',
    columns: returnColumns,
  },
  {
    id: 'dibatalkan',
    label: 'Dibatalkan',
    title: 'Pesanan Dibatalkan',
    unit: 'Pesanan',
    variant: 'table',
    columns: cancelColumns,
  },
];

// Status mengikuti legenda import: Tunda/Dikonfirmasi/Dikirim/Terkirim/Selesai/Batal.
const statusOptions = ['Semua', 'Tunda', 'Dikonfirmasi', 'Dikirim', 'Terkirim', 'Selesai', 'Batal'];

export default function Penjualan() {
  const [view, setView] = useState('list'); // 'list' | 'create'
  const [showImport, setShowImport] = useState(false);
  const [activeTab, setActiveTab] = useState('butuh-diproses');

  // Tombol aksi header berbeda per tab.
  const actions =
    activeTab === 'butuh-diproses' ? (
      <>
        <TButton variant="secondary" onClick={() => setShowImport(true)}>
          <FileSpreadsheet size={16} /> Perbarui Status (CSV)
        </TButton>
        <TButton variant="primary" onClick={() => setView('create')}>
          <Plus size={16} /> Tambah
        </TButton>
      </>
    ) : activeTab === 'pengembalian' ? (
      <TButton variant="primary" onClick={() => setView('create')}>
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
        emptyArt={<PolarBearEmpty />}
        actions={actions}
        onTabChange={(id) => {
          setActiveTab(id);
          setView('list');
        }}
      >
        {view === 'create' ? (
          activeTab === 'pengembalian' ? (
            <ReturnOrderForm onCancel={() => setView('list')} />
          ) : (
            <CreateOrderForm onCancel={() => setView('list')} />
          )
        ) : null}
      </TransactionScaffold>

      {showImport && <ImportStatusModal onClose={() => setShowImport(false)} />}
    </>
  );
}
