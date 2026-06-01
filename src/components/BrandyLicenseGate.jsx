import { useState, useRef, useEffect } from 'react';
import { FileText, Check, ShieldAlert, Terminal, Lock, Unlock } from 'lucide-react';

export default function BrandyLicenseGate({ onApprove }) {
  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const textContainerRef = useRef(null);

  // Monitor scroll untuk membuka persetujuan setelah membaca/scroll ke bawah
  const handleScroll = () => {
    const container = textContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Beri toleransi 15px di ujung bawah scroll
    if (scrollHeight - scrollTop - clientHeight < 15) {
      setHasReadToBottom(true);
    }
  };

  // Cek jika teks lisensi sangat pendek sehingga tidak bisa di-scroll
  useEffect(() => {
    const container = textContainerRef.current;
    if (container) {
      const { scrollHeight, clientHeight } = container;
      if (scrollHeight <= clientHeight) {
        setHasReadToBottom(true);
      }
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasReadToBottom || !isChecked) return;

    setIsActivating(true);
    setTimeout(() => {
      onApprove();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center p-4 font-mono select-none">
      {/* Clean Grid pattern instead of AI glowing circles */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none"></div>

      <div className="w-full max-w-xl bg-slate-900 border-2 border-slate-805 border-slate-800 rounded-lg shadow-2xl relative flex flex-col text-slate-100 animate-scale-up overflow-hidden">
        
        {/* System Bar Header (Windows/macOS native look) */}
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-indigo-400" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Security License Console v1.0.0
            </span>
          </div>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span>
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col">
          {/* Header Title Section */}
          <div className="border-b border-slate-800 pb-5 mb-5">
            <h1 className="text-base font-black uppercase tracking-wider text-white mb-1.5">
              SYSTEM LICENSE & AGREEMENT
            </h1>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Aplikasi Bintang Advertising ini dilisensikan dan diawasi secara resmi oleh{' '}
              <strong className="text-white font-bold">Brandy (tumbuh bersama)</strong>. Sebagai organisasi pengembang aplikasi, website, dan engineering developer.
            </p>
          </div>

          {/* System Specification Grid (Flat System style) */}
          <div className="grid grid-cols-2 gap-2 mb-5 text-[10px] bg-slate-950 border border-slate-800 p-3 rounded font-mono">
            <div>
              <span className="text-slate-500 block">DEVELOPER ORGANISASI:</span>
              <span className="text-indigo-400 font-bold">BRANDY (tumbuh bersama)</span>
            </div>
            <div>
              <span className="text-slate-500 block">NAMA PRODUK:</span>
              <span className="text-slate-200 font-bold">Bintang Advertising Suite</span>
            </div>
            <div className="border-t border-slate-900 pt-2 mt-1">
              <span className="text-slate-500 block">STATUS LISENSI:</span>
              <span className="text-amber-500 font-bold">AWAITING AGREEMENT</span>
            </div>
            <div className="border-t border-slate-900 pt-2 mt-1">
              <span className="text-slate-500 block">TIPE LISENSI:</span>
              <span className="text-slate-200 font-bold">Enterprise Dedicated</span>
            </div>
          </div>

          {/* EULA Monospace Scrollbox */}
          <div className="bg-slate-950 border border-slate-800 rounded p-4 mb-5 flex flex-col">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold border-b border-slate-850 pb-2 mb-3">
              <FileText size={12} className="text-indigo-400" />
              <span>DOKUMEN HUKUM PERJANJIAN PENGGUNA AKHIR (EULA)</span>
            </div>

            <div
              ref={textContainerRef}
              onScroll={handleScroll}
              className="text-[11px] text-slate-400 leading-relaxed space-y-4 max-h-[180px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent select-text"
            >
              <p className="font-bold text-slate-300">
                Aplikasi ini dilisensikan, dikembangkan, dan dipelihara secara eksklusif oleh Brandy, sebuah organisasi pengembang aplikasi, website, dan engineering developer global yang berdedikasi untuk tumbuh bersama bisnis Anda.
              </p>
              
              <p>
                Dengan menggunakan aplikasi ini, Anda secara sah menyatakan tunduk pada ketentuan lisensi berikut:
              </p>

              <div className="space-y-3 pl-2.5 border-l-2 border-slate-800">
                <p>
                  <strong className="text-slate-200 block mb-0.5">1. HAK CIPTA & LISENSI PENGGUNAAN</strong>
                  Semua hak atas kekayaan intelektual (IP), source code (baik kode frontend React maupun backend Django), aset desain, arsitektur database, dan algoritma sistem Bintang Advertising adalah milik eksklusif dari Developer (Brandy). Anda diberikan hak lisensi non-eksklusif dan terbatas hanya untuk mengoperasikan sistem ini untuk kebutuhan manajemen internal Bintang Advertising.
                </p>
                
                <p>
                  <strong className="text-slate-200 block mb-0.5">2. BATASAN PENGGUNAAN & KEAMANAN KODE</strong>
                  Anda secara tegas dilarang untuk menyalin, mendistribusikan ulang, menjual kembali, menyewakan, atau mentransfer bagian apa pun dari aplikasi ini kepada pihak ketiga tanpa izin tertulis dari Brandy. Dilarang melakukan reverse engineering atau mencoba membongkar kode sumber sistem.
                </p>

                <p>
                  <strong className="text-slate-200 block mb-0.5">3. PRIVASI & KEBIJAKAN DATA</strong>
                  Brandy menghormati privasi data Anda. Semua data transaksi konsumen, keuangan, absensi, dan data operasional Bintang Advertising disimpan secara aman di server lokal/cloud terenkripsi untuk kelancaran operasional internal Anda sesuai dengan UU PDP.
                </p>

                <p>
                  <strong className="text-slate-200 block mb-0.5">4. GARANSI & DUKUNGAN TEKNIS</strong>
                  Brandy berkomitmen penuh untuk memberikan dukungan pemeliharaan sistem, mitigasi bug, dan optimasi performa server secara berkelanjutan agar bisnis Anda terus tumbuh bersama kami.
                </p>
              </div>

              <p className="text-indigo-400 font-bold text-center pt-2 text-[10px] animate-pulse">
                [ MOHON GULIR TEKS HINGGA BATAS PALING BAWAH UNTUK MELANJUTKAN ]
              </p>
            </div>
          </div>

          {/* Form and Agreement Gate */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Scroll Alert or Checkbox */}
            {!hasReadToBottom ? (
              <div className="flex items-center gap-2 p-3 rounded bg-amber-950/20 border border-amber-900/40 text-amber-500 text-[10px] font-bold justify-center">
                <ShieldAlert size={12} className="shrink-0" />
                <span>Harap baca dan scroll teks lisensi di atas sampai paling bawah.</span>
              </div>
            ) : (
              /* Checkbox Persetujuan (Sharp, clean native system look) */
              <label className="flex items-start gap-3 p-3.5 rounded bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all select-none">
                <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      isChecked
                        ? 'bg-indigo-650 border-indigo-500'
                        : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                    }`}
                  >
                    {isChecked && <Check size={10} className="text-white font-black" />}
                  </div>
                </div>
                <div className="flex flex-col font-sans">
                  <span className="text-[11px] font-bold text-slate-200 leading-none">
                    Saya menyetujui Ketentuan Lisensi Developer
                  </span>
                  <span className="text-[9px] text-slate-500 mt-1 font-mono leading-relaxed">
                    Menyatakan setuju secara penuh atas syarat, ketentuan, dan lisensi dari Brandy.
                  </span>
                </div>
              </label>
            )}

            {/* Flat System Action Button */}
            <button
              type="submit"
              disabled={!hasReadToBottom || !isChecked || isActivating}
              className={`w-full py-3 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${
                isActivating
                  ? 'bg-indigo-805 bg-indigo-900 border-indigo-850 text-indigo-400 cursor-wait'
                  : hasReadToBottom && isChecked
                    ? 'bg-indigo-650 hover:bg-indigo-600 border-indigo-500 text-white cursor-pointer active:scale-[0.99]'
                    : 'bg-slate-800/40 border-slate-800 text-slate-650 text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              {isActivating ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>MENGAKTIFKAN AKSES SISTEM...</span>
                </>
              ) : (
                <>
                  {hasReadToBottom && isChecked ? (
                    <>
                      <Unlock size={13} />
                      <span>AKTIFKAN LISENSI & LANJUTKAN</span>
                    </>
                  ) : (
                    <>
                      <Lock size={13} />
                      <span>LANJUTKAN KE SISTEM (TERKUNCI)</span>
                    </>
                  )}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer (Classic Console/System Style) */}
        <div className="bg-slate-950 border-t border-slate-800 px-4 py-2.5 flex justify-between items-center text-[9px] text-slate-500 font-mono">
          <span>[SYSTEM OK] - BRANDY SECURITY PROTOCOL ACTIVE</span>
          <span className="text-emerald-600 font-bold">tumbuh bersama</span>
        </div>

      </div>
    </div>
  );
}
