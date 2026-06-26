import DataTable from '../components/DataTable';
import { Button, PageHeader, Toolbar } from '../components/PageShell';

export function ProductionCostPage() {
  return (
    <>
      <PageHeader
        title="Biaya Produksi"
        description="Master komponen biaya produksi non-bahan, seperti tenaga kerja, listrik, dan sewa mesin."
        actions={<Button variant="success">Tambah</Button>}
      />
      <Toolbar searchPlaceholder="Cari biaya" />
      <DataTable
        rows={[]}
        columns={[
          { key: 'name', label: 'Nama Biaya' },
          { key: 'value', label: 'Nilai Biaya' },
          { key: 'account', label: 'Akun Terkait' },
        ]}
      />
    </>
  );
}
