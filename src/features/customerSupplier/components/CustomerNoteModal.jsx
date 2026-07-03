import { useRef, useState } from 'react';
import { UploadCloud, FileText, Trash2, Plus } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import CustomerCombobox from './CustomerCombobox';
import TagMultiSelect from './TagMultiSelect';

const inputCls = 'w-full h-9 rounded-md border border-slate-300 px-2.5 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400';
const labelCls = 'text-xs font-semibold text-slate-700 mb-1 block';

const MAX_DOCS = 5;
const MAX_DOC_SIZE = 5 * 1024 * 1024;

const isAllowedFile = (file) => file.type.startsWith('image/') || file.type === 'application/pdf';

export default function CustomerNoteModal({ note, customers = [], allTags = [], onClose, onSaved }) {
  const isEdit = !!note;
  const fileRef = useRef(null);

  const [judul, setJudul] = useState(note?.judul || '');
  const [customerId, setCustomerId] = useState(note?.customer ? String(note.customer) : '');
  const [tanggal, setTanggal] = useState(note?.tanggal || new Date().toISOString().slice(0, 10));
  const [jam, setJam] = useState(note?.jam ? note.jam.slice(0, 5) : new Date().toTimeString().slice(0, 5));
  const [tags, setTags] = useState(note?.tags || []);
  const [existingDocuments, setExistingDocuments] = useState(note?.documents || []);
  const [draftDocuments, setDraftDocuments] = useState([]);
  const [existingEntries, setExistingEntries] = useState(note?.entries || []);
  const [draftEntries, setDraftEntries] = useState([]);
  const [entryLabel, setEntryLabel] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const totalDocCount = existingDocuments.length + draftDocuments.length;

  const addFiles = (list) => {
    if (!list?.length) return;
    const room = MAX_DOCS - totalDocCount;
    if (room <= 0) {
      setError(`Maksimal ${MAX_DOCS} dokumen per catatan.`);
      return;
    }
    const accepted = [];
    for (const f of Array.from(list).slice(0, room)) {
      if (!isAllowedFile(f)) { setError('File harus berupa gambar atau PDF.'); continue; }
      if (f.size > MAX_DOC_SIZE) { setError(`"${f.name}" melebihi 5MB.`); continue; }
      accepted.push(f);
    }
    if (accepted.length) setDraftDocuments((prev) => [...prev, ...accepted]);
  };

  const removeDraftDocument = (idx) => setDraftDocuments((prev) => prev.filter((_, i) => i !== idx));

  const deleteExistingDocument = async (doc) => {
    if (!window.confirm('Hapus dokumen ini?')) return;
    try {
      await apiClient.delete(`/customer-note-documents/${doc.id}/`);
      setExistingDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      console.error('[CustomerNoteModal] delete document error:', err);
    }
  };

  const addDraftEntry = () => {
    if (!entryContent.trim()) return;
    setDraftEntries((prev) => [...prev, { label: entryLabel.trim(), content: entryContent.trim() }]);
    setEntryLabel('');
    setEntryContent('');
  };

  const removeDraftEntry = (idx) => setDraftEntries((prev) => prev.filter((_, i) => i !== idx));

  const deleteExistingEntry = async (entry) => {
    if (!window.confirm('Hapus entri catatan ini?')) return;
    try {
      await apiClient.delete(`/customer-note-entries/${entry.id}/`);
      setExistingEntries((prev) => prev.filter((e) => e.id !== entry.id));
    } catch (err) {
      console.error('[CustomerNoteModal] delete entry error:', err);
    }
  };

  const handleSave = async () => {
    if (!judul.trim()) {
      setError('Judul catatan wajib diisi.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        customer: customerId || null,
        judul: judul.trim(),
        tanggal: tanggal || null,
        jam: jam || null,
        tag_names: tags,
      };
      let noteId = note?.id;
      if (isEdit) {
        await apiClient.patch(`/customer-notes/${noteId}/`, payload);
      } else {
        const res = await apiClient.post('/customer-notes/', payload);
        noteId = res.data.id;
      }

      for (const file of draftDocuments) {
        const formData = new FormData();
        formData.append('note', noteId);
        formData.append('file', file);
        await apiClient.post('/customer-note-documents/', formData, { headers: { 'Content-Type': undefined } });
      }

      for (const entry of draftEntries) {
        await apiClient.post('/customer-note-entries/', { note: noteId, label: entry.label, content: entry.content });
      }

      onSaved?.();
    } catch (err) {
      console.error('[CustomerNoteModal] save error:', err);
      const data = err.response?.data;
      const msg = data && typeof data === 'object'
        ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        : 'Gagal menyimpan catatan.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-bold text-slate-800 text-lg">Catatan Pelanggan</h3>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg px-4 py-1.5 hover:bg-slate-50 cursor-pointer">
              Batal
            </button>
            <button type="button" disabled={saving} onClick={handleSave} className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-1.5 cursor-pointer disabled:opacity-60">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kolom kiri */}
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Judul catatan</label>
                <input value={judul} onChange={(e) => setJudul(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Pembeli</label>
                <CustomerCombobox value={customerId} onChange={setCustomerId} customers={customers} placeholder="Pilih" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Tanggal</label>
                  <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Jam</label>
                  <input type="time" value={jam} onChange={(e) => setJam(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Tag</label>
                <TagMultiSelect value={tags} onChange={setTags} options={allTags} />
              </div>
              <div>
                <label className={labelCls}>Dokumen (Maks. {MAX_DOCS} Dokumen)</label>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => totalDocCount < MAX_DOCS && fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                  className={`w-full border-2 border-dashed rounded-xl py-6 px-4 flex flex-col items-center justify-center gap-1.5 text-center transition-colors ${totalDocCount < MAX_DOCS ? 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer' : 'border-slate-100 opacity-50 cursor-not-allowed'}`}
                >
                  <UploadCloud className="text-slate-300" size={28} />
                  <span className="text-xs text-slate-500">Seret file Anda ke sini atau <span className="text-blue-600">Pilih file</span></span>
                </div>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
                <p className="text-[11px] text-slate-400 mt-1">Gambar atau PDF maks. 5 MB</p>

                {(existingDocuments.length > 0 || draftDocuments.length > 0) && (
                  <ul className="mt-2 space-y-1">
                    {existingDocuments.map((doc) => (
                      <li key={`existing-${doc.id}`} className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 rounded px-2 py-1.5">
                        <a href={doc.file} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline truncate">
                          <FileText size={13} /> {doc.original_name || 'Dokumen'}
                        </a>
                        <button type="button" onClick={() => deleteExistingDocument(doc)} className="text-slate-400 hover:text-red-600 cursor-pointer shrink-0 ml-2">
                          <Trash2 size={13} />
                        </button>
                      </li>
                    ))}
                    {draftDocuments.map((file, idx) => (
                      <li key={`draft-${idx}`} className="flex items-center justify-between text-xs text-slate-600 bg-blue-50/50 rounded px-2 py-1.5">
                        <span className="flex items-center gap-1.5 truncate"><FileText size={13} className="text-blue-500 shrink-0" /> {file.name}</span>
                        <button type="button" onClick={() => removeDraftDocument(idx)} className="text-slate-400 hover:text-red-600 cursor-pointer shrink-0 ml-2">
                          <Trash2 size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Kolom kanan: Catatan (entri berulang) */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-2">Catatan</h4>
              <div className="space-y-2">
                <input value={entryLabel} onChange={(e) => setEntryLabel(e.target.value)} placeholder="Label (Opsional)" className={inputCls} />
                <textarea value={entryContent} onChange={(e) => setEntryContent(e.target.value)} placeholder="Catatan" rows={4} className={`${inputCls} h-auto py-2 resize-none`} />
                <button
                  type="button"
                  onClick={addDraftEntry}
                  disabled={!entryContent.trim()}
                  className={`w-full flex items-center justify-center gap-1.5 text-xs font-bold rounded-md py-2 transition-colors ${entryContent.trim() ? 'bg-slate-800 text-white hover:bg-slate-900 cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                  <Plus size={14} /> Tambah Catatan
                </button>
              </div>

              {(existingEntries.length > 0 || draftEntries.length > 0) && (
                <div className="mt-4 space-y-2">
                  {existingEntries.map((entry) => (
                    <div key={`existing-${entry.id}`} className="border border-slate-200 rounded-lg p-3 relative">
                      {entry.label && <p className="text-xs font-bold text-slate-700 mb-1">{entry.label}</p>}
                      <p className="text-xs text-slate-600 whitespace-pre-wrap pr-5">{entry.content}</p>
                      <button type="button" onClick={() => deleteExistingEntry(entry)} className="absolute top-2.5 right-2.5 text-slate-300 hover:text-red-600 cursor-pointer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  {draftEntries.map((entry, idx) => (
                    <div key={`draft-${idx}`} className="border border-blue-100 bg-blue-50/40 rounded-lg p-3 relative">
                      {entry.label && <p className="text-xs font-bold text-slate-700 mb-1">{entry.label}</p>}
                      <p className="text-xs text-slate-600 whitespace-pre-wrap pr-5">{entry.content}</p>
                      <button type="button" onClick={() => removeDraftEntry(idx)} className="absolute top-2.5 right-2.5 text-slate-300 hover:text-red-600 cursor-pointer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
