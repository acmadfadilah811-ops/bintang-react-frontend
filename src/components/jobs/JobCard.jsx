import { User, Edit2, MessageCircle, ChevronRight, FolderOpen, Link2, Lock } from 'lucide-react';
import { parsePreviousNotes } from './jobConstants';

/**
 * JobCard — Kartu job di papan kanban staff.
 * Props: job, orderInfo, onOpenWorkspace(fromStart), onEdit, onVerifyOtp
 */
export default function JobCard({ job, orderInfo, onEdit, onOpenWorkspace, onVerifyOtp }) {
  const { previous } = parsePreviousNotes(job.catatan_staff);
  const hasPrevNotes = previous.length > 0;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 space-y-3 hover:border-indigo-300 hover:shadow-md transition-all group">
      {/* Header Kartu */}
      <div className="flex justify-between items-start gap-2">
        <div
          onClick={() => onOpenWorkspace(false)}
          className="cursor-pointer min-w-0 flex-1 hover:opacity-80 transition-opacity"
          title="Klik buka lembar kerja"
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] bg-slate-800 text-white px-1.5 py-0.5 rounded font-mono">
              #{orderInfo?.orderId || '...'}
            </span>
            <span className="text-xs font-extrabold text-slate-900 truncate block">
              {orderInfo?.customerName || 'Memuat...'}
            </span>
          </div>
          <p className="text-[11px] text-indigo-700 font-semibold truncate leading-tight">
            {orderInfo?.jenisProduk || '...'}
          </p>
          {orderInfo?.keterangan && (
            <div className="text-[10px] text-slate-500 mt-1 space-y-0.5 border-t border-slate-100 pt-1">
              {typeof orderInfo.keterangan === 'object' ? (
                <>
                  {orderInfo.keterangan.deskripsi && (
                    <p className="line-clamp-2">
                      <span className="font-semibold">Ket:</span> {orderInfo.keterangan.deskripsi}
                    </p>
                  )}
                  {orderInfo.keterangan.bahan && orderInfo.keterangan.bahan !== '-' && (
                    <p className="truncate">
                      <span className="font-semibold">Bahan:</span> {orderInfo.keterangan.bahan}
                    </p>
                  )}
                  {orderInfo.keterangan.warna && orderInfo.keterangan.warna !== '-' && (
                    <p className="truncate">
                      <span className="font-semibold">Warna:</span> {orderInfo.keterangan.warna}
                    </p>
                  )}
                </>
              ) : (
                <p className="line-clamp-2">{orderInfo.keterangan}</p>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          {orderInfo?.nomorWa && (
            <a
              href={`https://wa.me/${orderInfo.nomorWa.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="p-1 text-green-500 hover:text-green-600 bg-green-50 rounded transition-colors"
            >
              <MessageCircle size={14} />
            </a>
          )}
          <button
            onClick={onEdit}
            className="p-1 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded transition-colors"
          >
            <Edit2 size={14} />
          </button>
        </div>
      </div>

      {/* Tahap & PIC */}
      <div className="bg-slate-50 rounded p-1.5 space-y-1 border border-slate-100">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
          <ChevronRight size={11} className="text-slate-400 shrink-0" />
          <span className="font-semibold truncate">{job.tahap_nama || 'Belum ada tahap'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
          <User size={11} className="text-slate-400 shrink-0" />
          <span className="truncate">
            {job.pic_nama || <span className="italic text-slate-400">Belum ada PIC</span>}
          </span>
        </div>
      </div>

      {/* Link GDrive dari Divisi Sebelumnya */}
      {hasPrevNotes && (
        <div className="bg-amber-50 border border-amber-200 rounded p-2 space-y-1.5">
          <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
            <FolderOpen size={11} /> File dari Divisi Sebelumnya
          </p>
          {previous
            .filter(
              (r) => typeof r.keterangan === 'string' && r.keterangan.startsWith('--- Dari Divisi:')
            )
            .map((sep, i) => {
              const divisiLabel = sep.keterangan
                ?.replace('--- Dari Divisi:', '')
                .replace('---', '')
                .trim();
              const staffLabel = sep.catatan?.replace('Oleh:', '').trim();
              return (
                <div key={i} className="space-y-1">
                  <div className="text-[10px] text-amber-800">
                    <span className="font-semibold">{divisiLabel}</span>
                    <span className="text-amber-600 ml-1">({staffLabel})</span>
                  </div>
                  {sep.gdrive_link ? (
                    <a
                      href={sep.gdrive_link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-[10px] text-blue-700 font-bold bg-blue-50 border border-blue-300 rounded px-2 py-1 hover:bg-blue-100 transition-colors w-full truncate"
                    >
                      <Link2 size={10} className="shrink-0" /> 🔗 Buka File
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">
                      Tidak ada file diunggah
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Insentif */}
      {job.insentif > 0 && (
        <div className="text-[10px] text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded-md w-fit">
          Rp {new Intl.NumberFormat('id-ID').format(job.insentif)}
        </div>
      )}

      {/* Tombol Aksi */}
      <div className="flex gap-1.5 pt-1 border-t border-slate-100 flex-col">
        {job.status_pekerjaan === 'antrean' && (
          <button
            onClick={() => onOpenWorkspace(true)}
            className="flex-1 text-[10px] font-bold py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors shadow-sm"
          >
            ▶ Mulai Kerjakan
          </button>
        )}
        {job.status_pekerjaan === 'dikerjakan' && (
          <button
            onClick={onVerifyOtp}
            className="flex-1 text-[10px] font-bold py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Lock size={12} className="text-amber-400" /> Input OTP Verifikasi
          </button>
        )}
      </div>
    </div>
  );
}
