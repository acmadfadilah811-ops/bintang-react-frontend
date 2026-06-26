import { Button, PageHeader } from '../components/PageShell';

export function BarcodePage() {
  return (
    <>
      <PageHeader title="Cetak Barcode Produk" description="Pilih produk atau paket produk untuk membuat barcode siap cetak." />
      <div className="pi-card pi-form-stack">
        <label>Produk<input placeholder="Cari produk" /></label>
        <label>Atau Paket Produk<input placeholder="Cari paket produk" /></label>
        <label>Qty<input defaultValue="1" /></label>
        <div><Button variant="info">Terapkan</Button></div>
      </div>
    </>
  );
}
