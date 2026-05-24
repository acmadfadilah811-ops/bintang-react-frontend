import { ShieldCheck, Lock } from 'lucide-react';

/** Modal admin — menampilkan kode OTP untuk diberikan ke staff */
export default function AdminOtpModal({ modal, orderMap, onClose }) {
  if (!modal) return null;
  const { job, otpCode } = modal;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden text-center">
        <div className="bg-indigo-700 text-white py-4 flex flex-col items-center gap-2">
          <ShieldCheck size={40} className="text-indigo-200" />
          <h2 className="font-bold text-sm">Akses Keamanan OTP</h2>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            Berikan kode ini kepada{' '}
            <strong className="text-slate-800">{job.pic_nama || 'Operator'}</strong> untuk
            mengotorisasi penyelesaian job{' '}
            <strong className="text-indigo-600">#{orderMap[job.order_item]?.orderId}</strong>.
          </p>

          <div className="bg-slate-100 border border-slate-300 rounded-lg py-4 px-6 inline-block mx-auto shadow-inner">
            <span className="font-mono text-4xl font-black text-slate-800 tracking-[0.2em]">
              {otpCode}
            </span>
          </div>

          <p className="text-[10px] text-red-500 font-bold flex items-center justify-center gap-1 mt-2">
            <Lock size={10} /> Kode ini bersifat rahasia.
          </p>
        </div>

        <div className="border-t border-slate-100 p-3 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-lg text-xs transition-colors"
          >
            Tutup Jendela
          </button>
        </div>
      </div>
    </div>
  );
}
