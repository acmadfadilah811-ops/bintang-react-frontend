import { useState, useRef, useEffect } from 'react';
import { FileText, Check, ShieldAlert, Sparkles, Lock, Unlock } from 'lucide-react';

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

  // Cek jika teks lisensi sangat pendek (atau di layar besar) sehingga tidak bisa di-scroll
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
    // Efek simulasi aktivasi premium sebelum masuk dashboard
    setTimeout(() => {
      onApprove();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center p-4 overflow-y-auto font-sans">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-650 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative flex flex-col text-slate-100 animate-scale-up">
        
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-850 text-indigo-400 text-[10px] font-black uppercase tracking-wider mb-3">
            <Sparkles size={11} className="animate-pulse" /> Lisensi Sistem Resmi
          </div>
          
          <h1 className="text-xl md:text-2xl font-black tracking-tight mb-1 text-white">
            Lisensi Pengembang & Layar Selamat Datang
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Sistem dilisensikan dan dikawal oleh{' '}
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Brandy
            </span>{' '}
            <span className="italic text-slate-500 font-bold">· tumbuh bersama</span>
          </p>
        </div>

        {/* EULA Container */}
        <div className="bg-slate-950/80 rounded-2xl border border-slate-850 p-4 mb-5 flex flex-col">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold border-b border-slate-850 pb-2 mb-3">
            <FileText size={14} className="text-indigo-400" />
            <span>PERJANJIAN LISENSI PENGGUNA AKHIR & KETENTUAN HUKUM</span>
          </div>

          <div
            ref={textContainerRef}
            onScroll={handleScroll}
            className="text-[11px] md:text-xs text-slate-300 leading-relaxed font-mono space-y-4 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent select-text"
          >
            <p className="font-sans font-bold text-slate-200">
              Selamat datang di Sistem Bintang Advertising. Aplikasi ini dilisensikan, dikembangkan, dan dipelihara secara eksklusif oleh Brandy, sebuah organisasi pengembang aplikasi, website, dan engineering developer global yang berdedikasi untuk tumbuh bersama bisnis Anda.
            </p>
            
            <p>
              Dengan menggunakan aplikasi ini, Anda secara sah menyatakan tunduk pada ketentuan lisensi berikut:
            </p>

            <div className="space-y-2 pl-2 border-l border-indigo-950">
              <p>
                <strong className="text-slate-100">1. HAK CIPTA & LISENSI PENGGUNAAN</strong>
                <br />
                Semua hak atas kekayaan intelektual (IP), source code (baik kode frontend React maupun backend Django), aset desain, arsitektur database, dan algoritma sistem Bintang Advertising adalah milik eksklusif dari Developer (Brandy). Anda diberikan hak non-eksklusif dan terbatas hanya untuk mengoperasikan sistem ini untuk kebutuhan manajemen internal Bintang Advertising.
              </p>
              
              <p>
                <strong className="text-slate-100">2. BATASAN PENGGUNAAN & KEAMANAN KODE</strong>
                <br />
                Anda secara tegas dilarang untuk:
                <br />
                a. Menyalin, mendistribusikan ulang, menjual kembali, menyewakan, atau mentransfer bagian apa pun dari aplikasi ini kepada pihak ketiga tanpa izin tertulis dari Brandy.
                <br />
                b. Melakukan reverse engineering, dekompilasi, atau mencoba membongkar kode sumber sistem.
                <br />
                c. Menggunakan aplikasi ini untuk tujuan ilegal atau melanggar hukum Negara Republik Indonesia.
              </p>

              <p>
                <strong className="text-slate-100">3. PRIVASI & KEBIJAKAN DATA</strong>
                <br />
                Brandy menghormati privasi data Anda. Semua data transaksi konsumen, keuangan, absensi, dan data operasional Bintang Advertising disimpan dengan enkripsi standar industri dan digunakan sepenuhnya untuk kelancaran operasional internal Anda. Developer berkomitmen penuh menjaga kerahasiaan data ini sesuai dengan UU Pelindungan Data Pribadi (UU PDP).
              </p>

              <p>
                <strong className="text-slate-100">4. GARANSI & DUKUNGAN TEKNIS</strong>
                <br />
                Brandy berkomitmen penuh untuk memberikan dukungan pemeliharaan sistem, mitigasi bug, dan optimasi performa server secara berkelanjutan agar bisnis Anda terus tumbuh bersama kami.
              </p>
            </div>

            <p className="text-indigo-300 font-sans font-semibold italic text-center pt-2">
              *** Silakan gulir (scroll) teks ini hingga bagian paling bawah untuk membuka opsi persetujuan lisensi ***
            </p>
          </div>
        </div>

        {/* Form and Agreement Option */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Scroll to agree note */}
          {!hasReadToBottom ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-950/20 border border-amber-900/30 text-amber-400 text-[10px] md:text-xs font-semibold animate-pulse justify-center">
              <ShieldAlert size={14} />
              <span>Harap gulir teks lisensi ke paling bawah untuk mengaktifkan persetujuan.</span>
            </div>
          ) : (
            /* Checkbox Persetujuan */
            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 cursor-pointer hover:border-indigo-500/30 transition-all select-none">
              <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    isChecked
                      ? 'bg-emerald-600 border-emerald-500 shadow-sm shadow-emerald-500/20'
                      : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                  }`}
                >
                  {isChecked && <Check size={12} className="text-white font-extrabold" />}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] md:text-xs font-bold text-slate-200">
                  Saya setuju dengan Lisensi Brandy
                </span>
                <span className="text-[9px] md:text-[10px] text-slate-400 mt-0.5">
                  Saya menyetujui semua Syarat, Ketentuan, dan Kebijakan Lisensi yang ditetapkan oleh Brandy.
                </span>
              </div>
            </label>
          )}

          {/* Locked / Unlocked Button */}
          <button
            type="submit"
            disabled={!hasReadToBottom || !isChecked || isActivating}
            className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all duration-300 relative overflow-hidden ${
              isActivating
                ? 'bg-indigo-700 text-white cursor-wait'
                : hasReadToBottom && isChecked
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-650/30 cursor-pointer active:scale-98 hover:shadow-indigo-500/40'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed shadow-none'
            }`}
          >
            {isActivating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                <span>Mengaktifkan Lisensi Premium...</span>
              </>
            ) : (
              <>
                {hasReadToBottom && isChecked ? (
                  <>
                    <Unlock size={14} className="animate-bounce" />
                    <span>Aktifkan Lisensi & Masuk Sistem</span>
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    <span>Lanjutkan ke Sistem (Terkunci)</span>
                  </>
                )}
              </>
            )}
            
            {/* Glossy overlay effect for premium button */}
            {hasReadToBottom && isChecked && !isActivating && (
              <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 opacity-40 group-hover:animate-shine"></div>
            )}
          </button>
        </form>

        {/* Footer Brand Credit */}
        <div className="text-center mt-6 border-t border-slate-850 pt-4 flex items-center justify-center gap-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Powered by Brandy Development Group
          </span>
          <span className="text-[10px] text-emerald-500 font-black italic">
            · tumbuh bersama
          </span>
        </div>
      </div>
    </div>
  );
}
