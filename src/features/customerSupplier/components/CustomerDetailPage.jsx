import { useState } from 'react';
import { ArrowLeft, ChevronDown, Wallet, Award, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../pages/customerSupplierData';
import { formatDisplayDate } from '../../../utils/date';

const GENDER_LABEL = { L: 'Laki-laki', P: 'Perempuan' };

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-800 text-right break-all">{value || '-'}</span>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <h4 className="text-sm font-bold text-slate-800 mb-1">{title}</h4>
      <div className="divide-y divide-slate-50">{children}</div>
    </div>
  );
}

/**
 * Rincian Pelanggan — mengikuti layar Olsera, dengan satu perbedaan yang disengaja.
 *
 * TIDAK ditampilkan: kartu Total Transaksi / Nominal transaksi / Lunas / Hutang,
 * dan tab Pesanan / Pengembalian / Item. Semuanya butuh jalan dari Customer ke
 * Order, dan jalan itu TIDAK ADA — Order menyebut pembeli lewat nomor_wa + nama
 * teks bebas, tanpa FK ke Customer. Menampilkan "Total Transaksi: 0" berarti
 * berbohong: kita bukan tahu nol, kita tidak tahu.
 *
 * Baris "Kata Sandi" juga dilewati: `password` write_only di serializer, jadi
 * tidak pernah sampai ke sini. Titik-titik palsu = mengarang.
 */
const FIELD_ALAMAT = [
  ['alamat', 'Alamat'],
  ['negara', 'Negara'],
  ['provinsi', 'Propinsi'],
  ['kota', 'Kota'],
  ['kecamatan', 'Kecamatan'],
  ['kode_pos', 'Kode Pos'],
];

export default function CustomerDetailPage({ customer, notes = [], onBack, onEdit, onDelete, onAddNote }) {
  const [showMore, setShowMore] = useState(false);
  const c = customer;
  const catatanPelanggan = notes.filter((n) => String(n.customer) === String(c.id));

  // Template import Olsera tidak punya kolom province, dan kita belum punya master
  // wilayah untuk menurunkannya dari kota. Daripada membiarkan '-' membisu,
  // sebutkan apa yang kosong dan ke mana mengisinya.
  const alamatKosong = FIELD_ALAMAT.filter(([key]) => !c[key]).map(([, label]) => label);

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={onBack}
          className="text-slate-500 hover:text-slate-800 rounded-full p-1.5 hover:bg-slate-100 cursor-pointer"
          aria-label="Kembali"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="flex-1 text-center text-xl font-bold text-slate-800 pr-9">Rincian Pelanggan</h2>
      </div>

      {/* Banner */}
      <div className="bg-sky-50 border border-sky-100 rounded-xl px-6 py-5 flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="min-w-0">
          <div className="text-3xl font-bold text-slate-800 truncate">{c.nama}</div>
          <div className="text-sm text-slate-500 mt-0.5">{c.kode_pelanggan || '-'}</div>
        </div>
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex flex-col items-center">
            <Wallet size={22} className="text-sky-500" />
            <span className="text-sm font-bold text-slate-700 mt-1">{formatCurrency(c.deposit)}</span>
          </div>
          <div className="flex flex-col items-center">
            <Award size={22} className="text-amber-500" />
            <span className="text-sm font-bold text-slate-700 mt-1">{c.loyalty_points ?? 0} pts</span>
          </div>
          <button
            type="button"
            onClick={onAddNote}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg px-4 py-2.5 cursor-pointer shadow-sm shrink-0"
          >
            <Plus size={16} /> Catatan
          </button>
        </div>
      </div>

      {/* Profil Pelanggan */}
      <div className="border border-slate-200 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-800">Profil Pelanggan</h3>
          <div className="flex items-center gap-2">
            {/* Hapus ikut pindah ke sini. Kolom Aksi di daftar sudah dibuang, dan
                tanpa tombol ini pelanggan tidak bisa dihapus dari mana pun. */}
            <button
              type="button"
              onClick={() => onDelete(c)}
              className="flex items-center gap-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-semibold rounded-lg px-4 py-2 cursor-pointer"
            >
              <Trash2 size={15} /> Hapus
            </button>
            <button
              type="button"
              onClick={() => onEdit(c)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg px-6 py-2 cursor-pointer shadow-sm"
            >
              Ubah
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Profil">
            <Row label="Nama" value={c.nama} />
            <Row label="Tipe Pelanggan" value={c.customer_group_nama || 'Guest'} />
            <Row label="Jenis Kelamin" value={GENDER_LABEL[c.jenis_kelamin]} />
            <Row label="Nomor HP" value={c.handphone} />
          </Card>
          <Card title="Lainnya">
            <Row label="Tanggal Lahir" value={formatDisplayDate(c.tanggal_lahir)} />
            <Row label="Kode Pelanggan" value={c.kode_pelanggan} />
            <Row label="Batas Kredit/Hutang" value={formatCurrency(c.batas_kredit)} />
            <Row label="Perusahaan" value={c.nama_perusahaan} />
            <Row label="Terima Buletin Berkala" value={c.terima_buletin ? 'Ya' : 'Tidak'} />
            <Row label="Tanggal Berakhir" value={formatDisplayDate(c.tanggal_berakhir)} />
          </Card>
        </div>

        {showMore && (
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card title="Login">
              <Row label="Email" value={c.email} />
            </Card>
            <Card title="Alamat">
              <Row label="Alamat" value={c.alamat} />
              <Row label="Negara" value={c.negara} />
              <Row label="Propinsi" value={c.provinsi} />
              <Row label="Kota" value={c.kota} />
              <Row label="Kecamatan" value={c.kecamatan} />
              <Row label="Kode Pos" value={c.kode_pos} />
              {alamatKosong.length > 0 && (
                <p className="pt-2.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2.5 py-2 mt-2">
                  Belum diisi: <span className="font-semibold">{alamatKosong.join(', ')}</span>.
                  Template import tidak memuat kolom tersebut — lengkapi lewat <span className="font-semibold">Ubah</span>.
                </p>
              )}
            </Card>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowMore((s) => !s)}
          className="mt-4 w-full bg-sky-50 hover:bg-sky-100 text-blue-600 text-sm font-semibold rounded-lg py-2.5 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          Selengkapnya
          <ChevronDown size={16} className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Catatan — satu-satunya dari 4 tab Olsera yang datanya nyata */}
      <div className="border border-slate-200 rounded-xl p-5">
        <h3 className="text-base font-bold text-slate-800 mb-3">Catatan</h3>
        {catatanPelanggan.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">Belum ada catatan untuk pelanggan ini.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {catatanPelanggan.map((n) => (
              <li key={n.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-800">{n.judul || '(tanpa judul)'}</span>
                  <span className="text-xs text-slate-400 shrink-0">{formatDisplayDate(n.tanggal)}</span>
                </div>
                {n.entries?.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.entries[0].content}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
