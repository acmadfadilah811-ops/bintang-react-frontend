import { useState, useEffect } from 'react';
import { FileSpreadsheet, X, Save, Loader2, FolderOpen, ChevronRight } from 'lucide-react';
import { parsePreviousNotes } from '../jobConstants';
import apiClient from '../../../api/apiClient';

const defaultRow = () => ({ keterangan: '', jumlah: '', satuan: '', catatan: '' });
const defaultMaterial = () => ({ item_id: '', item_nama: '', satuan: '', qty: '', catatan: '' });

/**
 * WorkspaceModal — Layar kerja produksi lengkap:
 * catatan Excel + pemakaian bahan inventori + link drive
 */
export default function WorkspaceModal({ workspaceJob, saving, onSubmit, onClose }) {
  const [tableRows, setTableRows] = useState(() => {
    const existing = workspaceJob?.job?.catatan_staff;
    return Array.isArray(existing) && existing.length > 0 ? existing : [defaultRow()];
  });
  const [materialUsage, setMaterialUsage] = useState([defaultMaterial()]);
  const [inventoryItems, setInventoryItems] = useState([]);
  useEffect(() => {
    apiClient
      .get('/inventory/')
      .then((res) => setInventoryItems(res.data))
      .catch(() => {});
  }, []);

  // ── Row helpers ──
  const addRow = () => setTableRows((r) => [...r, defaultRow()]);
  const removeRow = (i) => setTableRows((r) => r.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) =>
    setTableRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));

  const addMaterial = () => {
    setMaterialUsage((m) => [...m, defaultMaterial()]);
  };
  const removeMaterial = (i) => setMaterialUsage((m) => m.filter((_, idx) => idx !== i));
  const updateMaterial = (i, field, val) =>
    setMaterialUsage((m) => m.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));
  const selectInventoryItem = (i, itemId) => {
    const found = inventoryItems.find((it) => it.id === itemId);
    if (found)
      setMaterialUsage((m) =>
        m.map((row, idx) =>
          idx === i
            ? { ...row, item_id: found.id, item_nama: found.nama, satuan: found.satuan }
            : row
        )
      );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    onSubmit({
      jobId: workspaceJob.job.id,
      tableRows,
      materialUsage,
      driveLink: form.driveLink?.value?.trim() || '',
      hargaJualBaru: form.hargaJualBaru?.value || '',
      hargaLama: workspaceJob.orderItemData?.hargaJual,
      orderItemId: workspaceJob.orderItemData?.orderItemId,
      fromStart: workspaceJob.fromStart,
    });
  };

  if (!workspaceJob) return null;
  const { previous } = parsePreviousNotes(workspaceJob.job?.catatan_staff);
  const separators = previous.filter(
    (r) => typeof r.keterangan === 'string' && r.keterangan.startsWith('--- Dari Divisi:')
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden w-full h-full">
      {/* Header */}
      <div className="bg-slate-800 text-white px-5 py-4 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-lg">
            <FileSpreadsheet className="text-emerald-400" size={24} />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">Layar Kerja Produksi</h2>
            <p className="text-xs text-slate-300">
              ID:{' '}
              <span className="font-mono bg-slate-700 px-1 rounded">
                #{workspaceJob.orderItemData?.orderId || '-'}
              </span>
              &nbsp;|&nbsp;Tahap: {workspaceJob.job?.tahap_nama || '-'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white bg-slate-700 p-1.5 rounded-lg"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {/* Warisan divisi sebelumnya */}
          {previous.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg shadow-sm overflow-hidden mb-4">
              <div className="bg-amber-500 text-white px-4 py-2 flex items-center gap-2">
                <FolderOpen size={16} />
                <span className="text-sm font-bold">📂 Warisan dari Divisi Sebelumnya</span>
                <span className="ml-auto text-[10px] bg-amber-600 px-2 py-0.5 rounded-full">
                  {separators.length} divisi
                </span>
              </div>
              <div className="p-3 space-y-3">
                {separators.map((sep, si) => {
                  const sepIdxInPrev = previous.indexOf(sep);
                  const nextSepIdx = previous.findIndex(
                    (r, i) =>
                      i > sepIdxInPrev &&
                      typeof r.keterangan === 'string' &&
                      r.keterangan.startsWith('--- Dari Divisi:')
                  );
                  const rows = previous.slice(
                    sepIdxInPrev + 1,
                    nextSepIdx === -1 ? undefined : nextSepIdx
                  );
                  const divisiLabel = sep.keterangan
                    .replace('--- Dari Divisi:', '')
                    .replace('---', '')
                    .trim();
                  const staffLabel = sep.catatan?.replace('Oleh:', '').trim() || '-';
                  return (
                    <div
                      key={si}
                      className="bg-white rounded border border-amber-200 overflow-hidden"
                    >
                      <div className="bg-amber-100 px-3 py-1.5 flex items-center gap-2">
                        <ChevronRight size={12} className="text-amber-600" />
                        <span className="text-xs font-bold text-amber-800">{divisiLabel}</span>
                        <span className="text-[10px] text-amber-600 ml-auto">
                          oleh: {staffLabel}
                        </span>
                      </div>
                      {rows.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-[11px] text-left">
                            <thead className="bg-amber-50 border-b border-amber-100">
                              <tr>
                                <th className="px-3 py-1.5 text-amber-700 font-bold">Keterangan</th>
                                <th className="px-3 py-1.5 text-amber-700 font-bold w-16 text-center">
                                  Jml
                                </th>
                                <th className="px-3 py-1.5 text-amber-700 font-bold w-16">
                                  Satuan
                                </th>
                                <th className="px-3 py-1.5 text-amber-700 font-bold">Catatan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-50">
                              {rows.map((row, ri) => (
                                <tr key={ri} className="hover:bg-amber-50/50">
                                  <td className="px-3 py-1 text-slate-700">
                                    {row.keterangan || '-'}
                                  </td>
                                  <td className="px-3 py-1 text-center text-slate-600">
                                    {row.jumlah || '-'}
                                  </td>
                                  <td className="px-3 py-1 text-slate-600">{row.satuan || '-'}</td>
                                  <td className="px-3 py-1 text-slate-500 italic">
                                    {row.catatan || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Catatan Kerja Staff (Excel) */}
          <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden mb-4">
            <div className="bg-slate-700 text-white px-4 py-2 flex items-center justify-between">
              <span className="text-sm font-bold">📋 Catatan Kerja Staff (Excel)</span>
              <button
                type="button"
                onClick={addRow}
                className="text-xs bg-emerald-500 hover:bg-emerald-400 px-3 py-1 rounded font-bold transition-colors"
              >
                + Tambah Baris
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 border-b border-slate-300">
                  <tr>
                    <th className="px-3 py-2 w-8 text-slate-500">#</th>
                    <th className="px-3 py-2 text-slate-700 font-bold">Keterangan / Item</th>
                    <th className="px-3 py-2 text-slate-700 font-bold w-24">Jumlah</th>
                    <th className="px-3 py-2 text-slate-700 font-bold w-24">Satuan</th>
                    <th className="px-3 py-2 text-slate-700 font-bold">Catatan</th>
                    <th className="px-3 py-2 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tableRows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-1.5 text-slate-400 font-mono">{i + 1}</td>
                      <td className="px-2 py-1">
                        <input
                          value={row.keterangan || ''}
                          onChange={(e) => updateRow(i, 'keterangan', e.target.value)}
                          className="w-full border-0 bg-transparent focus:ring-1 focus:ring-indigo-400 rounded px-1 py-0.5 outline-none"
                          placeholder="Deskripsi item..."
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          value={row.jumlah || ''}
                          onChange={(e) => updateRow(i, 'jumlah', e.target.value)}
                          className="w-full border-0 bg-transparent focus:ring-1 focus:ring-indigo-400 rounded px-1 py-0.5 outline-none text-center"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          value={row.satuan || ''}
                          onChange={(e) => updateRow(i, 'satuan', e.target.value)}
                          className="w-full border-0 bg-transparent focus:ring-1 focus:ring-indigo-400 rounded px-1 py-0.5 outline-none"
                          placeholder="pcs, m..."
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          value={row.catatan || ''}
                          onChange={(e) => updateRow(i, 'catatan', e.target.value)}
                          className="w-full border-0 bg-transparent focus:ring-1 focus:ring-indigo-400 rounded px-1 py-0.5 outline-none"
                          placeholder="Catatan..."
                        />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(i)}
                          className="text-red-400 hover:text-red-600 font-bold text-base leading-none"
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pemakaian Bahan Inventori */}
          <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden mb-4">
            <div className="bg-amber-600 text-white px-4 py-2 flex items-center justify-between">
              <span className="text-sm font-bold">
                📦 Pemakaian Bahan Inventori (Otomatis Potong Stok)
              </span>
              <button
                type="button"
                onClick={addMaterial}
                className="text-xs bg-amber-500 hover:bg-amber-400 px-3 py-1 rounded font-bold transition-colors shadow-sm"
              >
                + Bahan
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-amber-50 border-b border-amber-200">
                  <tr>
                    <th className="px-3 py-2 w-8 text-amber-700">#</th>
                    <th className="px-3 py-2 text-amber-900 font-bold w-64">
                      Pilih Bahan Inventori
                    </th>
                    <th className="px-3 py-2 text-amber-900 font-bold w-24">Qty Terpakai</th>
                    <th className="px-3 py-2 text-amber-900 font-bold w-20">Satuan</th>
                    <th className="px-3 py-2 text-amber-900 font-bold">Keterangan / Tujuan</th>
                    <th className="px-3 py-2 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {materialUsage.map((row, i) => (
                    <tr key={i} className="hover:bg-amber-50/50">
                      <td className="px-3 py-1.5 text-amber-600 font-mono">{i + 1}</td>
                      <td className="px-2 py-1">
                        <select
                          value={row.item_id}
                          onChange={(e) => selectInventoryItem(i, e.target.value)}
                          className="w-full border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500 rounded px-2 py-1 outline-none text-xs"
                        >
                          <option value="">-- Pilih Bahan --</option>
                          {inventoryItems.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.nama} (Stok: {inv.stok} {inv.satuan})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <input
                          value={row.qty}
                          onChange={(e) => updateMaterial(i, 'qty', e.target.value)}
                          className="w-full border border-amber-200 focus:ring-2 focus:ring-amber-500 rounded px-2 py-1 outline-none text-center"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          value={row.satuan}
                          readOnly
                          className="w-full border-0 bg-transparent text-slate-500 font-medium px-1 outline-none"
                          placeholder="-"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          value={row.catatan}
                          onChange={(e) => updateMaterial(i, 'catatan', e.target.value)}
                          className="w-full border border-amber-200 focus:ring-2 focus:ring-amber-500 rounded px-2 py-1 outline-none"
                          placeholder="Catatan pemakaian..."
                        />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeMaterial(i)}
                          className="text-red-400 hover:text-red-600 font-bold text-base leading-none"
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Drive Link & Harga */}
          <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Drive Output Link</label>
                <input
                  type="url"
                  name="driveLink"
                  defaultValue={workspaceJob.job?.gdrive_output_link || ''}
                  placeholder="https://drive..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ubah Harga Akhir (Opsional)
                </label>
                <input
                  type="number"
                  name="hargaJualBaru"
                  defaultValue={workspaceJob.orderItemData?.hargaJual || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 p-4 flex justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            Tutup
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Simpan Data
          </button>
        </div>
      </form>
    </div>
  );
}
