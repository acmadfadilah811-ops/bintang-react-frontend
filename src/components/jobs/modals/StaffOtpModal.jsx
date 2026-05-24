import { X, Lock } from 'lucide-react';

/** Modal staff — input OTP yang diberikan oleh admin */
export default function StaffOtpModal({ modal, orderMap, onSubmit, onClose }) {
  if (!modal) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const inputOtp = e.target.otp.value;
    if (inputOtp.length >= 4) {
      onSubmit(modal.job); // OTP valid → buka ForwardModal
    } else {
      alert('Kode OTP tidak valid!');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-amber-400" />
            <h2 className="font-bold text-xs">Verifikasi Tahap Akhir</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-center">
          <p className="text-xs text-slate-600 mb-2">
            Pekerjaan <strong>#{orderMap[modal.job.order_item]?.orderId}</strong> hampir selesai.
            Minta kode 6 digit dari Admin untuk meneruskan job ini.
          </p>
          <input
            type="text"
            name="otp"
            maxLength={6}
            required
            placeholder="Masukkan 6 Digit OTP"
            className="w-full text-center font-mono text-xl font-bold tracking-[0.2em] py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg text-xs shadow-md"
          >
            Verifikasi Kode Akses
          </button>
        </form>
      </div>
    </div>
  );
}
