import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Loader2, PackageCheck, RefreshCw, Wallet } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import PelunasanModal from './PelunasanModal';

/**
 * Papan pesanan produksi untuk meja kasir.
 *
 * Dua kelompok:
 *   - SIAP DIAMBIL  : status_global 'ready' — seluruh item selesai diproduksi,
 *                     backend menandainya otomatis di api/views/jobs.py.
 *   - MASIH PROSES  : status_global 'desain'/'proses', ditampilkan beserta
 *                     progres tiap item per divisi supaya kasir bisa menjawab
 *                     pelanggan yang menanyakan pesanannya.
 *
 * Progres per divisi dibaca dari items[].jobs[] yang sudah disertakan
 * OrderSerializer (lihat prefetch di OrderViewSet.get_queryset) — tidak ada
 * permintaan tambahan per item.
 */

const POLL_INTERVAL_MS = 30000;

// Job dianggap tuntas hanya pada 'selesai'. 'gagal'/'batal' sengaja dibedakan
// agar tidak tampil sebagai centang hijau yang menyesatkan di meja kasir.
const statusIkon = {
  selesai: { simbol: '✓', warna: 'text-emerald-600', label: 'selesai' },
  dikerjakan: { simbol: '⏳', warna: 'text-blue-600', label: 'dikerjakan' },
  antrean: { simbol: '•', warna: 'text-slate-400', label: 'antrean' },
  kendala: { simbol: '!', warna: 'text-amber-600', label: 'kendala' },
  gagal: { simbol: '×', warna: 'text-rose-600', label: 'gagal' },
  batal: { simbol: '×', warna: 'text-slate-400', label: 'batal' },
};

const formatCurrency = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(v || 0);

const formatJam = (iso) => {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

/** Waktu selesai produksi = job terakhir yang rampung di seluruh order. */
const waktuSelesaiProduksi = (order) => {
  const waktu = (order.items || [])
    .flatMap((it) => it.jobs || [])
    .map((j) => j.waktu_selesai)
    .filter(Boolean)
    .sort();
  return waktu.length ? waktu[waktu.length - 1] : null;
};

function ProgresItem({ item }) {
  const jobs = item.jobs || [];

  if (!jobs.length) {
    return (
      <div className="flex items-baseline gap-2 text-[11px]">
        <span className="font-bold text-slate-700 min-w-[120px] truncate">{item.jenis_produk}</span>
        <span className="text-slate-400 font-semibold italic">SPK belum diterbitkan</span>
      </div>
    );
  }

  return (
    <div className="flex items-baseline gap-2 text-[11px] flex-wrap">
      <span className="font-bold text-slate-700 min-w-[120px] truncate">{item.jenis_produk}</span>
      {jobs.map((job) => {
        const ikon = statusIkon[job.status_pekerjaan] || statusIkon.antrean;
        const divisi = job.tahap_divisi_nama || job.pic_divisi_nama || job.tahap_nama || 'Divisi';
        return (
          <span
            key={job.id}
            className={`font-semibold ${ikon.warna}`}
            title={`${divisi}: ${ikon.label}`}
          >
            {divisi} {ikon.simbol}
          </span>
        );
      })}
    </div>
  );
}

export default function SiapDiambilPanel() {
  const [siap, setSiap] = useState([]);
  const [proses, setProses] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState('');
  const [orderDibayar, setOrderDibayar] = useState(null);

  const muat = useCallback(async (tampilkanSpinner = false) => {
    if (tampilkanSpinner) setMemuat(true);
    try {
      const [resReady, resDesain, resProses] = await Promise.all([
        apiClient.get('/orders/', { params: { status_global: 'ready' } }),
        apiClient.get('/orders/', { params: { status_global: 'desain' } }),
        apiClient.get('/orders/', { params: { status_global: 'proses' } }),
      ]);
      setSiap(resReady.data || []);
      setProses([...(resDesain.data || []), ...(resProses.data || [])]);
      setError('');
    } catch (err) {
      console.error('Gagal memuat pesanan produksi:', err);
      setError('Daftar pesanan gagal dimuat. Periksa koneksi lalu muat ulang.');
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    muat(true);
    const id = setInterval(() => muat(false), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [muat]);

  const totalTagihanSiap = useMemo(
    () => siap.reduce((sum, o) => sum + Number(o.sisa_tagihan || 0), 0),
    [siap]
  );

  const setelahBayar = () => {
    setOrderDibayar(null);
    muat(false);
  };

  return (
    <>
      {orderDibayar && (
        <PelunasanModal
          order={orderDibayar}
          onClose={() => setOrderDibayar(null)}
          onSelesai={setelahBayar}
        />
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <PackageCheck size={16} className="text-emerald-600" />
            <h2 className="text-sm font-extrabold text-slate-800">Pesanan Produksi</h2>
          </div>
          <button
            type="button"
            onClick={() => muat(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Muat ulang"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-rose-50 text-rose-700 text-[11px] font-semibold">
            {error}
          </div>
        )}

        {memuat ? (
          <div className="flex items-center justify-center py-10 text-slate-400">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : (
          <div className="p-4 space-y-5">
            {/* Siap diambil */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Siap Diambil ({siap.length})
                </h3>
                {totalTagihanSiap > 0 && (
                  <span className="text-[11px] font-bold text-slate-500">
                    Total tagihan {formatCurrency(totalTagihanSiap)}
                  </span>
                )}
              </div>

              {siap.length === 0 ? (
                <p className="text-[11px] font-semibold text-slate-400 py-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Belum ada pesanan yang selesai produksi.
                </p>
              ) : (
                <div className="space-y-2">
                  {siap.map((order) => {
                    const sisa = Number(order.sisa_tagihan || 0);
                    const jam = formatJam(waktuSelesaiProduksi(order));
                    return (
                      <div
                        key={order.id}
                        className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-800">{order.id}</span>
                            {jam && (
                              <span className="text-[10px] font-bold text-slate-400">selesai {jam}</span>
                            )}
                          </div>
                          <p className="text-[11px] font-semibold text-slate-600 truncate">
                            {order.nama} &middot; {(order.items || []).length} item
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {sisa > 0 ? 'Sisa' : 'Status'}
                            </p>
                            <p
                              className={`text-xs font-black ${sisa > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
                            >
                              {sisa > 0 ? formatCurrency(sisa) : 'LUNAS'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setOrderDibayar(order)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                          >
                            <Wallet size={12} />
                            {sisa > 0 ? 'Lunasi & Faktur' : 'Cetak Faktur'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Masih diproses */}
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                <Clock size={13} /> Masih Proses ({proses.length})
              </h3>

              {proses.length === 0 ? (
                <p className="text-[11px] font-semibold text-slate-400 py-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Tidak ada pesanan yang sedang dikerjakan.
                </p>
              ) : (
                <div className="space-y-2">
                  {proses.map((order) => (
                    <div key={order.id} className="border border-slate-200 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-slate-800">{order.id}</span>
                        <span className="text-[11px] font-semibold text-slate-500">{order.nama}</span>
                      </div>
                      <div className="space-y-1 pl-1">
                        {(order.items || []).map((item) => (
                          <ProgresItem key={item.id} item={item} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
