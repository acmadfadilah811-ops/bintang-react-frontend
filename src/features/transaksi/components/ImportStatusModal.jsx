import { useRef, useState } from 'react';
import { X, UploadCloud } from 'lucide-react';

const STATUS_LEGEND = [
  ['P', 'Tunda'],
  ['A', 'Dikonfirmasi'],
  ['S', 'Dikirim'],
  ['T', 'Terkirim'],
  ['Z', 'Selesai'],
  ['X', 'Batal'],
];

/**
 * Modal "Perbarui Status (CSV)" — import status pesanan dari CSV.
 */
export default function ImportStatusModal({ onClose, onProcess }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);

  const pickFile = (f) => setFile(f || null);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Import</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-50 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Kiri: template + legenda status */}
          <div>
            {/* TODO: unduh template CSV asli */}
            <button
              type="button"
              className="w-full border border-slate-200 rounded-lg py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer mb-4"
            >
              Download Template
            </button>
            <p className="text-sm font-semibold text-slate-700 mb-2">Deskripsi</p>
            <p className="text-sm text-slate-500 mb-1">Status</p>
            <ul className="text-sm text-slate-500 space-y-0.5">
              {STATUS_LEGEND.map(([code, label]) => (
                <li key={code}>
                  {code} = {label}
                </li>
              ))}
            </ul>
            <p className="text-sm text-slate-500 mt-3">Import dari CSV (max. 500 baris)</p>
          </div>

          {/* Kanan: dropzone */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">
              Import dari CSV (max. 500 baris)
            </p>
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pickFile(e.dataTransfer.files?.[0]);
              }}
              className="w-full border-2 border-dashed border-slate-200 rounded-xl py-10 px-4 flex flex-col items-center justify-center gap-2 hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer text-center"
            >
              <UploadCloud className="text-slate-300" size={40} />
              <span className="text-sm text-slate-500">
                {file ? (
                  file.name
                ) : (
                  <>
                    Drop file here or <span className="text-blue-600">click to upload</span>
                  </>
                )}
              </span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            <p className="text-xs text-slate-400 mt-2">Import dari CSV (max. 500 baris)</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg px-6 py-2 hover:bg-slate-50 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!file}
            onClick={() => onProcess?.(file)}
            className={`text-sm font-semibold rounded-lg px-6 py-2 transition-colors ${
              file
                ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-sm'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            Proses
          </button>
        </div>
      </div>
    </div>
  );
}
