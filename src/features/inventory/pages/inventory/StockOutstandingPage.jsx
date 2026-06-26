import DataTable from '../components/DataTable';
import { Button, PageHeader, Select, StatusBadge, Toolbar } from '../components/PageShell';

const rows = [];

export function StockOutstandingPage() {
  return (
    <>
      <PageHeader
        title="Stok Outstanding"
        description="Daftar stok yang masih outstanding — sudah dipesan/diproses tetapi belum sepenuhnya diterima atau dikeluarkan."
        actions={<Button variant="info">Ekspor</Button>}
      />
      <Toolbar
        searchPlaceholder="Cari produk / no. dokumen"
        left={
          <Select defaultValue="all">
            <option value="all">Semua Tipe</option>
            <option value="in">Stok Masuk</option>
            <option value="out">Stok Keluar</option>
          </Select>
        }
      />
      <DataTable
        rows={rows}
        emptyText="Tidak ada stok outstanding"
        columns={[
          { key: 'no', label: 'No. Dokumen' },
          { key: 'type', label: 'Tipe' },
          { key: 'product', label: 'Produk' },
          { key: 'ordered', label: 'Qty Dipesan' },
          { key: 'received', label: 'Qty Terpenuhi' },
          { key: 'outstanding', label: 'Outstanding' },
          { key: 'date', label: 'Tanggal' },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge active={false} label={r.status} /> },
        ]}
      />
    </>
  );
}
