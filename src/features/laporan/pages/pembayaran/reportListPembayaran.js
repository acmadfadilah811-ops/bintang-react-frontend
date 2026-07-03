/**
 * Konfigurasi daftar laporan untuk tab "Laporan Pembayaran".
 * Bentuk sama dengan reportList.js (Produk). Sebagian kolom masih placeholder —
 * akan disesuaikan per screenshot Olsera.
 */

// Toolbar default: tanggal + PDF + EXCEL.
const TB = { paket: false, cari: false };

export const PEMBAYARAN_REPORTS = [
  {
    id: 'ringkasan-metode',
    label: 'Ringkasan Metode Pembayaran',
    toolbar: TB,
    summary: {
      title: 'Ringkasan',
      columns: [
        { key: 'mata_uang', label: 'Mata Uang' },
        { key: 'jumlah', label: 'Jumlah', align: 'right' },
      ],
    },
    columns: [
      { key: 'cara_pembayaran', label: 'Cara Pembayaran' },
      { key: 'akun_bank', label: 'Akun Bank' },
      { key: 'jumlah', label: 'Jumlah', align: 'right' },
    ],
  },
  {
    id: 'pembayaran-sudah-lunas',
    label: 'Pembayaran yang sudah lunas',
    toolbar: TB,
    summary: {
      title: 'Ringkasan',
      columns: [
        { key: 'mata_uang', label: 'Mata Uang' },
        { key: 'total_penjualan', label: 'Total Penjualan', align: 'right' },
        { key: 'total_pembayaran', label: 'Total Pembayaran', align: 'right' },
      ],
    },
    columns: [
      { key: 'no_pesanan', label: 'No. Pesanan' },
      { key: 'tanggal_pembayaran', label: 'Tanggal Pembayaran' },
      { key: 'pelanggan', label: 'Pelanggan' },
      { key: 'cara_pembayaran', label: 'Cara Pembayaran' },
      { key: 'sumber_pesanan', label: 'Sumber Pesanan' },
      { key: 'total_pembayaran', label: 'Total Pembayaran', align: 'right' },
    ],
  },
  {
    id: 'pembayaran-belum-lunas',
    label: 'Pembayaran yang belum lunas',
    dateMode: 'none',
    toolbar: TB,
    hideTable: true,
  },
  {
    id: 'penjualan-pembayaran-pelanggan',
    label: 'Penjualan berdasarkan Pembayaran Pelanggan',
    toolbar: TB,
    summary: {
      title: 'Ringkasan',
      columns: [
        { key: 'mata_uang', label: 'Mata Uang' },
        { key: 'total_penjualan', label: 'Total Penjualan', align: 'right' },
        { key: 'biaya_pengiriman', label: 'Biaya Pengiriman', align: 'right' },
        { key: 'total_minus_pengiriman', label: 'Total Penjualan - Biaya Pengiriman', align: 'right' },
      ],
    },
    columns: [
      { key: 'sumber_penjualan', label: 'Sumber Penjualan' },
      { key: 'tipe_pelanggan', label: 'Tipe Pelanggan' },
      { key: 'pelanggan', label: 'Pelanggan' },
      { key: 'total_penjualan', label: 'Total Penjualan', align: 'right' },
      { key: 'biaya_pengiriman', label: 'Biaya Pengiriman', align: 'right' },
      { key: 'total_minus_pengiriman', label: 'Total Penjualan - Biaya Pengiriman', align: 'right' },
    ],
  },
  {
    id: 'piutang-tipe-pelanggan',
    label: 'Piutang berdasarkan tipe pelanggan',
    toolbar: { paket: false, cari: false, sync: 'Resi Gabungan' },
    hideTable: true,
    bottomBar: { label: 'Pilih Pesanan', button: 'Gabung Resi' },
  },
  {
    id: 'penjualan-hutang-jatuh-tempo',
    label: 'Penjualan hutang yang jatuh tempo',
    toolbar: TB,
    hideTable: true,
  },
];

export default PEMBAYARAN_REPORTS;
