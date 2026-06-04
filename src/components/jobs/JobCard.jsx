import { MapPin } from 'lucide-react';

/**
 * JobCard — Kartu job minimal di papan kanban staff.
 * Props: job, orderInfo, onOpenWorkspace
 *
 * BUG FIX: prop bernama `_job` (underscore) → tidak bisa diakses sebagai `job`.
 * Diubah ke `job` agar data status dan tahap bisa ditampilkan.
 */
export default function JobCard({ job, orderInfo, onOpenWorkspace }) {
  return (
    <div
      onClick={onOpenWorkspace}
      className="bg-white rounded-lg border border-slate-200 p-3 hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all leading-tight text-xs font-semibold text-slate-800"
      title="Klik untuk membuka layar kerja produksi"
    >
      <div className="flex justify-between items-center gap-2">
        <span className="truncate font-bold text-slate-900">
          {orderInfo?.customerName || 'Memuat...'}
        </span>
        <span className="text-[9px] text-slate-400 font-mono shrink-0">
          #{orderInfo?.orderId || '...'}
        </span>
      </div>
      <p className="text-[11px] text-indigo-700 font-semibold truncate mt-1">
        {orderInfo?.jenisProduk || '...'}
      </p>
      {job?.tahap_nama && (
        <p className="text-[9px] text-slate-400 mt-0.5 flex items-center">
          <MapPin size={10} className="mr-1 text-slate-400 shrink-0" />
          <span className="truncate">{job.tahap_nama}</span>
        </p>
      )}
    </div>
  );
}
