/** Sakelar on/off. */
export function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
        on ? 'bg-blue-500' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          on ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
}

/** Sakelar Aktif/Nonaktif dipakai di kolom Aksi tiap daftar. */
export function StatusToggle({ active, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={active ? 'Nonaktifkan' : 'Aktifkan'}
      className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
        active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
    >
      {active ? 'Aktif' : 'Nonaktif'}
    </button>
  );
}

/** Baris form: label (kanan) + helper, kontrol di kanan. */
export function FormRow({ label, required, help, children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-2 md:gap-6 px-6 py-5">
      <div className="md:text-right md:pt-2">
        <label className="text-sm text-slate-600">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {help && <p className="text-[11px] text-orange-400 mt-1 leading-snug">{help}</p>}
      </div>
      <div className="max-w-xl">{children}</div>
    </div>
  );
}

/** Pilihan tipe diskon: % Persen / $ Nominal. */
export function PercentNominalField({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => onChange('percent')}
        className={`px-4 py-1.5 text-sm font-semibold cursor-pointer transition-colors ${
          value === 'percent' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
        }`}
      >
        % Persen
      </button>
      <button
        type="button"
        onClick={() => onChange('nominal')}
        className={`px-4 py-1.5 text-sm font-semibold cursor-pointer transition-colors border-l border-slate-200 ${
          value === 'nominal' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
        }`}
      >
        $ Nominal
      </button>
    </div>
  );
}

export const ErrorBanner = ({ message }) =>
  message ? (
    <div className="mx-6 mt-4 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs">
      {message}
    </div>
  ) : null;
