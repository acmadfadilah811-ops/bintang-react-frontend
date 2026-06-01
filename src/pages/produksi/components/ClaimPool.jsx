import { Inbox, UserCheck, Ruler, Clipboard, AlertCircle } from 'lucide-react';

export default function ClaimPool({ claimPool, onClaim, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold">Memuat antrean global divisi...</p>
      </div>
    );
  }

  if (claimPool.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <Inbox size={24} />
        </div>
        <h3 className="text-sm font-bold text-slate-700">Antrean Bersih!</h3>
        <p className="text-xs text-slate-400 mt-1">
          Saat ini tidak ada pekerjaan unassigned untuk divisi Anda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Claim Pool (Antrean Divisi)</h2>
          <p className="text-[11px] text-slate-400">
            Silakan klaim pekerjaan di bawah ini untuk dimasukkan ke Todo List personal Anda.
          </p>
        </div>
        <span className="bg-indigo-100 text-indigo-700 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
          {claimPool.length} Pekerjaan
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {claimPool.map((job) => {
          const item = job.order_item_detail || {};
          const formatUkuran =
            parseFloat(item.panjang) > 0 && parseFloat(item.lebar) > 0
              ? `${parseFloat(item.panjang)} x ${parseFloat(item.lebar)} m`
              : null;

          return (
            <div
              key={job.id}
              className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[9px] bg-slate-200 text-slate-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {job.tahap_nama}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-800 mt-1">
                      {item.jenis_produk || 'Produk'}
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    ID: #{job.id}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-2.5 flex-1">
                {/* Size and Material */}
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                  {formatUkuran && (
                    <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                      <Ruler size={12} className="text-slate-400" />
                      <strong>Ukuran:</strong> {formatUkuran}
                    </span>
                  )}
                  {item.bahan && (
                    <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                      <Clipboard size={12} className="text-slate-400" />
                      <strong>Bahan:</strong> {item.bahan}
                    </span>
                  )}
                </div>

                {/* Instructions */}
                {item.keterangan_detail && (
                  <div className="p-2 bg-amber-50/80 border border-amber-200/50 rounded-lg text-[10px] text-amber-800 leading-relaxed">
                    <strong className="flex items-center gap-1 mb-0.5">
                      <AlertCircle size={10} /> Catatan Khusus:
                    </strong>
                    {item.keterangan_detail}
                  </div>
                )}

                {/* Design Fee Info (Admin configures) */}
                {job.biaya_desain > 0 && (
                  <div className="text-[10px] text-slate-500">
                    Biaya Desain:{' '}
                    <span className="font-bold text-slate-700">
                      Rp{job.biaya_desain.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer Action */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">
                  Qty: <strong className="text-slate-700 text-xs">{item.qty || 1}</strong>
                </span>

                <button
                  onClick={() => onClaim(job.id)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <UserCheck size={14} />
                  Klaim Pekerjaan
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
