import DataTable from '../components/DataTable';
import { Button, PageHeader, Select, StatusBadge, Toolbar } from '../components/PageShell';
import { formatCurrency } from '../productInventoryData';

const rows = [];

export function ProductOthersPage() {
  return (
    <>
      <PageHeader
        title="Produk Lain-lain"
        description="Produk non-stok / jasa tambahan seperti ongkos desain, biaya kirim, atau item lain di luar katalog utama."
        actions={<Button variant="success">Tambah</Button>}
      />
      <Toolbar
        searchPlaceholder="Cari produk lain-lain"
        left={
          <Select defaultValue="all">
            <option value="all">Semua Kategori</option>
            <option value="service">Jasa</option>
            <option value="fee">Biaya</option>
          </Select>
        }
      />
      <DataTable
        rows={rows}
        emptyText="Belum ada produk lain-lain"
        columns={[
          { key: 'name', label: 'Nama' },
          { key: 'sku', label: 'SKU' },
          { key: 'category', label: 'Kategori' },
          { key: 'price', label: 'Harga Jual', render: (r) => formatCurrency(r.price) },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge active={r.active} /> },
        ]}
      />
    </>
  );
}
