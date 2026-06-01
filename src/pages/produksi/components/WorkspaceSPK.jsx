import { useState, useEffect } from 'react';
import { Play, CheckCircle, Save, Trash, ChevronLeft } from 'lucide-react';
import apiClient from '../../../api/apiClient';

export default function WorkspaceSPK({ job, onClose, onStart, onComplete, saving }) {
  const [driveLink, setDriveLink] = useState(job?.gdrive_output_link || '');
  const [designFee, setDesignFee] = useState(job?.biaya_desain || 0);
  const [incentive, setIncentive] = useState(job?.insentif || 0);
  const [materialUsage, setMaterialUsage] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [historyNotes, setHistoryNotes] = useState([]);
  const [updating, setUpdating] = useState(false);

  // Excel sheet state and custom calculator parameters
  const [activeSheet, setActiveSheet] = useState('detail'); // 'detail' | 'materials' | 'incentive'
  const [tarifPerm2, setTarifPerm2] = useState(15000);
  const [komisiPersen, setKomisiPersen] = useState(5);

  useEffect(() => {
    setDriveLink(job?.gdrive_output_link || '');
    setDesignFee(job?.biaya_desain || 0);
    setIncentive(job?.insentif || 0);

    // Load inventory items for the dropdown
    apiClient
      .get('/inventory/')
      .then((res) => setInventoryItems(res.data))
      .catch((err) => console.error('Failed to load inventory items:', err));

    // Parse existing material usage from job.catatan_staff
    if (Array.isArray(job?.catatan_staff)) {
      // Find the last index of separator (keterangan starting with "--- Dari Divisi:")
      const lastSeparatorIdx = job.catatan_staff
        .map((row) => String(row.keterangan || '').startsWith('--- Dari Divisi:'))
        .lastIndexOf(true);

      let historyRows = [];
      let currentMaterials;

      if (lastSeparatorIdx === -1) {
        currentMaterials = job.catatan_staff;
      } else {
        historyRows = job.catatan_staff.slice(0, lastSeparatorIdx + 1);
        currentMaterials = job.catatan_staff.slice(lastSeparatorIdx + 1);
      }

      // Filter out non-material rows for current division
      const materialsOnly = currentMaterials.filter((row) => row.item_id);
      setMaterialUsage(
        materialsOnly.map((m) => ({
          item_id: m.item_id || '',
          item_nama: m.item_nama || m.keterangan || '',
          satuan: m.satuan || '',
          qty: m.qty || m.jumlah || '',
          catatan: m.catatan || '',
        }))
      );
      setHistoryNotes(historyRows);
    } else {
      setMaterialUsage([]);
      setHistoryNotes([]);
    }
  }, [job]);

  const addMaterialRow = () => {
    setMaterialUsage((prev) => [
      ...prev,
      { item_id: '', item_nama: '', satuan: '', qty: '', catatan: '' },
    ]);
  };

  const removeMaterialRow = (idx) => {
    setMaterialUsage((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateMaterialField = (idx, field, val) => {
    setMaterialUsage((prev) => prev.map((row, i) => (i === idx ? { ...row, [field]: val } : row)));
  };

  const selectInventoryItem = (idx, itemId) => {
    const found = inventoryItems.find((it) => String(it.id) === String(itemId));
    if (found) {
      setMaterialUsage((prev) =>
        prev.map((row, i) =>
          i === idx
            ? {
                ...row,
                item_id: found.id,
                item_nama: found.nama,
                satuan: found.satuan,
              }
            : row
        )
      );
    } else if (itemId === '') {
      setMaterialUsage((prev) =>
        prev.map((row, i) =>
          i === idx
            ? {
                ...row,
                item_id: '',
                item_nama: '',
                satuan: '',
              }
            : row
        )
      );
    }
  };

  const handleSaveDraft = async () => {
    setUpdating(true);
    try {
      const tableRows = materialUsage.map((row) => ({
        keterangan: row.item_nama,
        jumlah: row.qty,
        satuan: row.satuan,
        catatan: row.catatan,
        item_id: row.item_id,
      }));

      // Combine history notes and current rows
      const combinedNotes = [...historyNotes, ...tableRows];

      await apiClient.patch(`/jobs/${job.id}/`, {
        gdrive_output_link: driveLink,
        catatan_staff: combinedNotes,
        biaya_desain: designFee,
        insentif: incentive,
      });
      alert('Draft lembar kerja berhasil disimpan!');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan draft.');
    } finally {
      setUpdating(false);
    }
  };

  const item = job?.order_item_detail || {};
  const panjang = parseFloat(item.panjang) || 0;
  const lebar = parseFloat(item.lebar) || 0;
  const luas = panjang * lebar;
  const orderQty = parseFloat(item.jumlah) || parseFloat(item.qty) || 1;
  const orderTotal =
    parseFloat(item.total_harga) ||
    parseFloat(item.subtotal) ||
    parseFloat(item.harga) * orderQty ||
    0;

  const baseValue = luas > 0 ? luas * tarifPerm2 * orderQty : orderTotal;
  const computedIncentive = Math.round(baseValue * (komisiPersen / 100) + designFee);

  // Must be ABOVE early return to comply with Rules of Hooks
  useEffect(() => {
    if (activeSheet === 'incentive') {
      setIncentive(computedIncentive);
    }
  }, [computedIncentive, activeSheet]);

  if (!job) return null;

  const formatUkuran = panjang > 0 && lebar > 0 ? `${panjang} x ${lebar} m` : null;

  return (
    <div className="w-full h-full flex flex-col bg-[#f3f3f3] text-[11px] font-sans overflow-hidden border border-[#ccc]">
      {/* EXCEL RIBBON & TABS */}
      <div className="bg-[#107c41] text-white shrink-0">
        {/* File / Home Menu Tabs */}
        <div className="flex items-center px-3 pt-1 gap-1 text-[10px] select-none font-semibold">
          <button
            onClick={() => setActiveSheet('detail')}
            className={`px-3 py-1 rounded-t-sm border-none outline-none cursor-pointer transition-all ${
              activeSheet === 'detail'
                ? 'bg-[#f3f3f3] text-[#107c41]'
                : 'opacity-75 text-white hover:bg-[#185e37]'
            }`}
          >
            File Kerja SPK (Detail)
          </button>
          <button
            onClick={() => setActiveSheet('materials')}
            className={`px-3 py-1 rounded-t-sm border-none outline-none cursor-pointer transition-all ${
              activeSheet === 'materials'
                ? 'bg-[#f3f3f3] text-[#107c41]'
                : 'opacity-75 text-white hover:bg-[#185e37]'
            }`}
          >
            Bahan Baku Terpakai
          </button>
          <button
            onClick={() => setActiveSheet('incentive')}
            className={`px-3 py-1 rounded-t-sm border-none outline-none cursor-pointer transition-all ${
              activeSheet === 'incentive'
                ? 'bg-[#f3f3f3] text-[#107c41]'
                : 'opacity-75 text-white hover:bg-[#185e37]'
            }`}
          >
            Rumus Insentif Cetak
          </button>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[9px] bg-[#185e37] px-2 py-0.5 rounded uppercase font-black tracking-wide">
              {job.tahap_nama}
            </span>
          </div>
        </div>

        {/* Toolbar / Actions (Green Ribbon Style) */}
        <div className="bg-[#f3f3f3] border-b border-[#ccc] p-1.5 flex items-center gap-2 text-slate-700 shadow-sm">
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-[#ccc] hover:bg-slate-100 rounded text-slate-650 font-bold transition-all cursor-pointer shadow-sm"
          >
            <ChevronLeft size={12} className="text-[#107c41]" />
            <span>Kembali</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-300 mx-1"></div>

          <button
            onClick={handleSaveDraft}
            disabled={updating}
            className="flex items-center gap-1 px-3 py-1 bg-white border border-[#ccc] hover:bg-slate-100 disabled:opacity-50 rounded text-slate-700 font-extrabold transition-all cursor-pointer shadow-sm"
          >
            <Save size={12} className="text-[#107c41]" />
            <span>Simpan Draft (Ctrl+S)</span>
          </button>

          {job.status_pekerjaan === 'antrean' && (
            <button
              onClick={() => onStart(job.id)}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1 bg-[#107c41] text-white hover:bg-[#0d6233] disabled:opacity-50 rounded font-extrabold transition-all cursor-pointer shadow-sm"
            >
              <Play size={12} fill="white" />
              <span>Mulai Kerjakan SPK</span>
            </button>
          )}

          {job.status_pekerjaan === 'dikerjakan' && (
            <button
              onClick={async () => {
                await handleSaveDraft();
                onComplete(job);
              }}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1 bg-[#107c41] text-white hover:bg-[#0d6233] disabled:opacity-50 rounded font-extrabold transition-all cursor-pointer shadow-sm"
            >
              <CheckCircle size={12} />
              <span>Selesaikan SPK (Kirim ke Finishing)</span>
            </button>
          )}
        </div>
      </div>

      {/* SPREADSHEET AREA */}
      <div className="flex-1 overflow-auto bg-white">
        {/* SHEET 1: DETAIL SPK */}
        {activeSheet === 'detail' && (
          <table className="w-full border-collapse table-fixed text-[10.5px]">
            <thead>
              <tr className="bg-[#f3f3f3] select-none text-slate-500 font-normal">
                <th className="w-8 border border-[#ccc] bg-[#f3f3f3] text-[8.5px] font-bold py-1"></th>
                <th className="w-36 border border-[#ccc] text-center font-semibold text-slate-500">
                  A
                </th>
                <th className="w-48 border border-[#ccc] text-center font-semibold text-slate-500">
                  B
                </th>
                <th className="w-36 border border-[#ccc] text-center font-semibold text-slate-500">
                  C
                </th>
                <th className="w-48 border border-[#ccc] text-center font-semibold text-slate-500">
                  D
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-7 hover:bg-slate-50/30">
                <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                  1
                </td>
                <td className="bg-[#f9f9f9] px-2 font-extrabold text-slate-500 border border-[#ccc] uppercase">
                  NO SPK
                </td>
                <td className="px-2 font-mono font-bold text-slate-800 border border-[#ccc] bg-slate-50">
                  #{job.id}
                </td>
                <td className="bg-[#f9f9f9] px-2 font-extrabold text-slate-500 border border-[#ccc] uppercase">
                  STATUS SPK
                </td>
                <td className="px-2 font-bold text-[#107c41] border border-[#ccc] uppercase bg-slate-50">
                  {job.status_pekerjaan}
                </td>
              </tr>
              <tr className="h-7 hover:bg-slate-50/30">
                <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                  2
                </td>
                <td className="bg-[#f9f9f9] px-2 font-extrabold text-slate-500 border border-[#ccc] uppercase">
                  NAMA PRODUK
                </td>
                <td className="px-2 font-extrabold text-slate-800 border border-[#ccc]">
                  {item.jenis_produk || 'Produk'}
                </td>
                <td className="bg-[#f9f9f9] px-2 font-extrabold text-slate-500 border border-[#ccc] uppercase">
                  BAHAN UTAMA
                </td>
                <td className="px-2 text-slate-700 border border-[#ccc]">{item.bahan || '-'}</td>
              </tr>
              <tr className="h-7 hover:bg-slate-50/30">
                <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                  3
                </td>
                <td className="bg-[#f9f9f9] px-2 font-extrabold text-slate-500 border border-[#ccc] uppercase">
                  UKURAN
                </td>
                <td className="px-2 text-slate-700 border border-[#ccc] font-bold">
                  {formatUkuran || '-'}
                </td>
                <td className="bg-[#f9f9f9] px-2 font-extrabold text-slate-500 border border-[#ccc] uppercase">
                  NO NOTA
                </td>
                <td className="px-2 font-mono text-slate-700 border border-[#ccc] bg-slate-50">
                  #{item.order || '-'}
                </td>
              </tr>
              <tr className="h-7 hover:bg-slate-50/30">
                <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                  4
                </td>
                <td className="bg-[#f9f9f9] px-2 font-extrabold text-slate-500 border border-[#ccc] uppercase">
                  BIAYA DESAIN (Rp)
                </td>
                <td className="p-0 border border-[#ccc] bg-white">
                  <input
                    type="number"
                    value={designFee}
                    onChange={(e) => setDesignFee(parseFloat(e.target.value) || 0)}
                    className="w-full h-full bg-transparent px-2 outline-none font-bold text-slate-800 border border-transparent focus:border-[#107c41] focus:bg-white"
                  />
                </td>
                <td className="bg-[#f9f9f9] px-2 font-extrabold text-slate-500 border border-[#ccc] uppercase">
                  ESTIMASI INSENTIF (Rp)
                </td>
                <td className="p-0 border border-[#ccc] bg-white">
                  <input
                    type="number"
                    value={incentive}
                    onChange={(e) => setIncentive(parseFloat(e.target.value) || 0)}
                    className="w-full h-full bg-transparent px-2 outline-none font-bold text-slate-800 border border-transparent focus:border-[#107c41] focus:bg-white"
                  />
                </td>
              </tr>
              <tr className="h-14 hover:bg-slate-50/30">
                <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                  5
                </td>
                <td className="bg-[#f9f9f9] px-2 font-extrabold text-slate-500 border border-[#ccc] uppercase">
                  CATATAN CS (FINISHING)
                </td>
                <td
                  colSpan={3}
                  className="px-3 py-2 text-amber-800 bg-amber-50/40 border border-[#ccc] align-top leading-relaxed font-semibold"
                >
                  {item.keterangan_detail || 'Tidak ada catatan pengerjaan spesifik.'}
                </td>
              </tr>
              <tr className="h-8 hover:bg-slate-50/30">
                <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                  6
                </td>
                <td className="bg-[#e1f5fe] px-2 font-extrabold text-indigo-700 border border-[#ccc] uppercase">
                  DRIVE OUTPUT LINK
                </td>
                <td colSpan={3} className="p-0 border border-[#ccc] bg-indigo-50/20">
                  <input
                    type="url"
                    placeholder="Paste link file hasil pengerjaan desain/cetak di sini..."
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                    className="w-full h-full bg-transparent px-3 outline-none text-indigo-700 font-mono text-[10px] border border-transparent focus:border-[#107c41] focus:bg-white"
                  />
                </td>
              </tr>
              {historyNotes.length > 0 ? (
                <tr className="hover:bg-slate-50/30">
                  <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                    7
                  </td>
                  <td className="bg-amber-50 px-2 font-extrabold text-amber-800 border border-[#ccc] uppercase align-top py-2">
                    RIWAYAT & CATATAN DIVISI SEBELUMNYA
                  </td>
                  <td
                    colSpan={3}
                    className="px-3 py-2 text-slate-700 border border-[#ccc] align-top bg-amber-50/20"
                  >
                    <div className="space-y-2">
                      {historyNotes.map((row, rIdx) => {
                        const isSep = String(row.keterangan || '').startsWith('--- Dari Divisi:');
                        if (isSep) {
                          return (
                            <div key={rIdx} className="border-b border-amber-250 pb-1 mb-2">
                              <span className="text-[10px] font-black text-amber-800 uppercase block">
                                {row.keterangan}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[8.5px] font-bold text-slate-500">
                                  {row.catatan}
                                </span>
                                {row.gdrive_link && (
                                  <a
                                    href={row.gdrive_link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[9px] font-black text-indigo-650 hover:underline inline-flex items-center gap-0.5 ml-2"
                                  >
                                    📁 Buka File Output Divisi Ini
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div
                              key={rIdx}
                              className="pl-2 flex items-center gap-2 py-0.5 text-slate-600 font-medium"
                            >
                              <span>•</span>
                              <span className="font-bold text-slate-700">{row.keterangan}</span>
                              {row.jumlah && row.jumlah !== '-' && (
                                <span className="text-slate-400">
                                  Qty: {row.jumlah} {row.satuan}
                                </span>
                              )}
                              {row.catatan && (
                                <span className="text-slate-450 italic">({row.catatan})</span>
                              )}
                            </div>
                          );
                        }
                      })}
                    </div>
                  </td>
                </tr>
              ) : (
                <tr className="h-6">
                  <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                    7
                  </td>
                  <td className="border border-[#ccc]"></td>
                  <td className="border border-[#ccc]"></td>
                  <td className="border border-[#ccc]"></td>
                  <td className="border border-[#ccc]"></td>
                </tr>
              )}
              <tr className="h-6">
                <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                  8
                </td>
                <td className="border border-[#ccc]"></td>
                <td className="border border-[#ccc]"></td>
                <td className="border border-[#ccc]"></td>
                <td className="border border-[#ccc]"></td>
              </tr>
            </tbody>
          </table>
        )}

        {/* SHEET 2: BAHAN BAKU TERPAKAI */}
        {activeSheet === 'materials' && (
          <table className="w-full border-collapse table-fixed text-[10.5px]">
            <thead>
              <tr className="bg-[#f3f3f3] select-none text-slate-500 font-normal">
                <th className="w-8 border border-[#ccc] bg-[#f3f3f3] text-[8.5px] font-bold py-1"></th>
                <th className="w-48 border border-[#ccc] text-center font-semibold text-slate-500">
                  A
                </th>
                <th className="w-24 border border-[#ccc] text-center font-semibold text-slate-500">
                  B
                </th>
                <th className="w-20 border border-[#ccc] text-center font-semibold text-slate-500">
                  C
                </th>
                <th className="w-64 border border-[#ccc] text-center font-semibold text-slate-500">
                  D
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-8">
                <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                  1
                </td>
                <td
                  colSpan={4}
                  className="bg-[#107c41] text-white font-extrabold px-3 uppercase text-[9px] tracking-wide border border-[#ccc]"
                >
                  <div className="flex justify-between items-center w-full">
                    <span>📦 LAPORAN PEMAKAIAN BAHAN BAKU / INVENTORI TERPAKAI</span>
                    <button
                      type="button"
                      onClick={addMaterialRow}
                      className="bg-white hover:bg-slate-100 text-[#107c41] text-[8.5px] font-black px-2.5 py-0.5 rounded shadow-sm cursor-pointer transition-all uppercase border-none"
                    >
                      + Tambah Baris Bahan
                    </button>
                  </div>
                </td>
              </tr>
              <tr className="bg-[#f3f3f3] select-none text-slate-600 font-bold h-6 text-[9.5px]">
                <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                  2
                </td>
                <td className="border border-[#ccc] text-center uppercase tracking-wide">
                  PILIH INVENTORI BAHAN
                </td>
                <td className="border border-[#ccc] text-center uppercase tracking-wide">
                  QTY JUMLAH
                </td>
                <td className="border border-[#ccc] text-center uppercase tracking-wide">SATUAN</td>
                <td className="border border-[#ccc] text-center uppercase tracking-wide">
                  CATATAN DETAIL OPERATOR (HAPUS)
                </td>
              </tr>
              {materialUsage.length === 0 ? (
                <tr className="h-12">
                  <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                    3
                  </td>
                  <td
                    colSpan={4}
                    className="px-4 text-center text-slate-400 italic border border-[#ccc] bg-[#fafafa] py-4"
                  >
                    Belum ada pemakaian bahan dicatat. Klik "+ Tambah Baris Bahan" di pojok kanan
                    atas.
                  </td>
                </tr>
              ) : (
                materialUsage.map((row, idx) => {
                  const rowNum = 3 + idx;
                  return (
                    <tr key={idx} className="h-8 hover:bg-slate-50/50">
                      <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                        {rowNum}
                      </td>
                      <td className="p-0 border border-[#ccc] bg-white">
                        <select
                          value={row.item_id}
                          onChange={(e) => selectInventoryItem(idx, e.target.value)}
                          className="w-full h-full bg-transparent px-2 outline-none text-slate-700 border-none font-bold"
                        >
                          <option value="">-- Pilih Bahan --</option>
                          {inventoryItems.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.nama} (Stok: {inv.stok} {inv.satuan})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-0 border border-[#ccc] bg-white">
                        <input
                          type="number"
                          value={row.qty}
                          onChange={(e) => updateMaterialField(idx, 'qty', e.target.value)}
                          placeholder="0"
                          className="w-full h-full bg-transparent px-2 text-center font-bold text-slate-800 outline-none border border-transparent focus:border-[#107c41]"
                        />
                      </td>
                      <td className="px-2 text-center text-slate-500 font-extrabold border border-[#ccc] bg-[#fafafa]">
                        {row.satuan || '-'}
                      </td>
                      <td className="p-0 border border-[#ccc] bg-white">
                        <div className="flex items-center h-full w-full">
                          <input
                            type="text"
                            value={row.catatan}
                            onChange={(e) => updateMaterialField(idx, 'catatan', e.target.value)}
                            placeholder="Tulis catatan pemakaian..."
                            className="flex-1 h-full bg-transparent px-2 outline-none border border-transparent focus:border-[#107c41]"
                          />
                          <button
                            type="button"
                            onClick={() => removeMaterialRow(idx)}
                            className="px-2 text-red-500 hover:text-red-700 transition-colors shrink-0 cursor-pointer border-none bg-transparent"
                            title="Hapus baris"
                          >
                            <Trash size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              <tr className="h-6">
                <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                  {3 + Math.max(materialUsage.length, 1) + 1}
                </td>
                <td className="border border-[#ccc] bg-white"></td>
                <td className="border border-[#ccc] bg-white"></td>
                <td className="border border-[#ccc] bg-white"></td>
                <td className="border border-[#ccc] bg-white"></td>
              </tr>
            </tbody>
          </table>
        )}

        {/* SHEET 3: RUMUS INSENTIF */}
        {activeSheet === 'incentive' && (
          <table className="w-full border-collapse table-fixed text-[10.5px]">
            <thead>
              <tr className="bg-[#f3f3f3] select-none text-slate-500 font-normal">
                <th className="w-8 border border-[#ccc] bg-[#f3f3f3] text-[8.5px] font-bold py-1"></th>
                <th className="w-48 border border-[#ccc] text-center font-semibold text-slate-500">
                  A
                </th>
                <th className="w-64 border border-[#ccc] text-center font-semibold text-slate-500">
                  B
                </th>
                <th className="w-48 border border-[#ccc] text-center font-semibold text-slate-500">
                  C
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-8">
                <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                  1
                </td>
                <td
                  colSpan={3}
                  className="bg-[#107c41] text-white font-extrabold px-3 uppercase text-[9px] tracking-wide border border-[#ccc]"
                >
                  🧮 RUMUS KALKULASI & ESTIMASI INSENTIF KERJA
                </td>
              </tr>
              <tr className="bg-[#f3f3f3] select-none text-slate-600 font-bold h-6 text-[9.5px]">
                <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                  2
                </td>
                <td className="border border-[#ccc] text-center uppercase tracking-wide">
                  NAMA PARAMETER
                </td>
                <td className="border border-[#ccc] text-center uppercase tracking-wide">
                  NILAI / INPUT SEL
                </td>
                <td className="border border-[#ccc] text-center uppercase tracking-wide">
                  KETERANGAN RUMUS
                </td>
              </tr>
              <tr className="h-7 hover:bg-slate-50/30">
                <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                  3
                </td>
                <td className="bg-[#f9f9f9] px-2 font-bold text-slate-500 border border-[#ccc]">
                  PANJANG ORDER ITEM (m)
                </td>
                <td className="px-2 font-bold text-slate-800 border border-[#ccc] bg-slate-50">
                  {panjang} m
                </td>
                <td className="px-2 text-slate-400 border border-[#ccc] italic">
                  Diambil dari nota penjualan
                </td>
              </tr>
              <tr className="h-7 hover:bg-slate-50/30">
                <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                  4
                </td>
                <td className="bg-[#f9f9f9] px-2 font-bold text-slate-500 border border-[#ccc]">
                  LEBAR ORDER ITEM (m)
                </td>
                <td className="px-2 font-bold text-slate-800 border border-[#ccc] bg-slate-50">
                  {lebar} m
                </td>
                <td className="px-2 text-slate-400 border border-[#ccc] italic">
                  Diambil dari nota penjualan
                </td>
              </tr>
              <tr className="h-7 hover:bg-slate-50/30">
                <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                  5
                </td>
                <td className="bg-[#f9f9f9] px-2 font-bold text-slate-500 border border-[#ccc]">
                  LUAS TOTAL CETAK (m²)
                </td>
                <td className="px-2 font-black text-indigo-700 border border-[#ccc] bg-slate-50">
                  {luas.toFixed(2)} m²
                </td>
                <td className="px-2 text-slate-400 border border-[#ccc] font-mono">=A3 * A4</td>
              </tr>
              <tr className="h-7 hover:bg-slate-50/30">
                <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                  6
                </td>
                <td className="bg-[#e2f0d9] px-2 font-extrabold text-emerald-800 border border-[#ccc]">
                  TARIF JASA CETAK / m² (Rp)
                </td>
                <td className="p-0 border border-[#ccc] bg-white">
                  <input
                    type="number"
                    value={tarifPerm2}
                    onChange={(e) => setTarifPerm2(parseFloat(e.target.value) || 0)}
                    className="w-full h-full bg-transparent px-2 font-bold text-slate-800 outline-none border border-transparent focus:border-[#107c41]"
                  />
                </td>
                <td className="px-2 text-slate-400 border border-[#ccc] italic">
                  Bisa diubah (Tarif dasar: Rp15,000)
                </td>
              </tr>
              <tr className="h-7 hover:bg-slate-50/30">
                <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                  7
                </td>
                <td className="bg-[#f9f9f9] px-2 font-bold text-slate-500 border border-[#ccc]">
                  JUMLAH BARANG (Qty)
                </td>
                <td className="px-2 font-bold text-slate-800 border border-[#ccc] bg-slate-50">
                  {orderQty} Pcs
                </td>
                <td className="px-2 text-slate-400 border border-[#ccc] italic">
                  Jumlah pesanan di nota
                </td>
              </tr>
              <tr className="h-7 hover:bg-slate-50/30">
                <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                  8
                </td>
                <td className="bg-[#e2f0d9] px-2 font-extrabold text-emerald-800 border border-[#ccc]">
                  PERSENTASE KOMISI (%)
                </td>
                <td className="p-0 border border-[#ccc] bg-white">
                  <input
                    type="number"
                    value={komisiPersen}
                    onChange={(e) => setKomisiPersen(parseFloat(e.target.value) || 0)}
                    className="w-full h-full bg-transparent px-2 font-bold text-slate-800 outline-none border border-transparent focus:border-[#107c41]"
                  />
                </td>
                <td className="px-2 text-slate-400 border border-[#ccc] italic">
                  Bisa diubah (Standar: 5%)
                </td>
              </tr>
              <tr className="h-7 hover:bg-slate-50/30">
                <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                  9
                </td>
                <td className="bg-[#f9f9f9] px-2 font-bold text-slate-500 border border-[#ccc]">
                  BIAYA TAMBAHAN DESAIN (Rp)
                </td>
                <td className="px-2 font-bold text-slate-800 border border-[#ccc] bg-slate-50">
                  Rp{designFee.toLocaleString()}
                </td>
                <td className="px-2 text-slate-400 border border-[#ccc] italic">
                  Diambil dari Input Sel A4 Sheet1
                </td>
              </tr>
              <tr className="h-8 hover:bg-slate-50/30">
                <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                  10
                </td>
                <td className="bg-[#f9f9f9] px-2 font-extrabold text-slate-500 border border-[#ccc]">
                  RUMUS EXCEL AKHIR
                </td>
                <td
                  colSpan={2}
                  className="px-2 font-mono text-[#107c41] font-bold border border-[#ccc] bg-[#f9f9f9]"
                >
                  {luas > 0
                    ? `=ROUND(((A5 * A6 * A7) * (A8 / 100)) + A9, 0)`
                    : `=ROUND((TOTAL_NOTA * (A8 / 100)) + A9, 0)`}
                </td>
              </tr>
              <tr className="h-10 hover:bg-slate-50/30 bg-[#e2f0d9]/30">
                <td className="bg-[#f3f3f3] text-center font-bold text-[9px] text-slate-400 border border-[#ccc] select-none w-8">
                  11
                </td>
                <td className="bg-[#e2f0d9] px-2 font-black text-[#107c41] border border-[#ccc] text-[11px]">
                  ESTIMASI INSENTIF BERHASIL (Rp)
                </td>
                <td
                  colSpan={2}
                  className="px-3 font-black text-lg text-[#107c41] border border-[#ccc] font-mono"
                >
                  Rp{computedIncentive.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* EXCEL STATUS BAR / SHEET TABS */}
      <div className="bg-[#f3f3f3] border-t border-[#ccc] px-3 py-1 flex items-center justify-between text-[9px] text-slate-500 shrink-0 font-semibold select-none">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSheet('detail')}
            className={`px-2.5 py-0.5 rounded-t-sm border-t border-x border-[#ccc] transition-all cursor-pointer border-none outline-none ${
              activeSheet === 'detail'
                ? 'bg-white text-[#107c41] font-bold border-t-2 border-t-[#107c41]'
                : 'bg-[#e1dfdd] text-slate-650 hover:bg-slate-200'
            }`}
          >
            Sheet1 (Detail SPK)
          </button>
          <button
            onClick={() => setActiveSheet('materials')}
            className={`px-2.5 py-0.5 rounded-t-sm border-t border-x border-[#ccc] transition-all cursor-pointer border-none outline-none ${
              activeSheet === 'materials'
                ? 'bg-white text-[#107c41] font-bold border-t-2 border-t-[#107c41]'
                : 'bg-[#e1dfdd] text-slate-655 hover:bg-slate-200'
            }`}
          >
            Sheet2 (Bahan Terpakai)
          </button>
          <button
            onClick={() => setActiveSheet('incentive')}
            className={`px-2.5 py-0.5 rounded-t-sm border-t border-x border-[#ccc] transition-all cursor-pointer border-none outline-none ${
              activeSheet === 'incentive'
                ? 'bg-white text-[#107c41] font-bold border-t-2 border-t-[#107c41]'
                : 'bg-[#e1dfdd] text-slate-655 hover:bg-slate-200'
            }`}
          >
            Sheet3 (Kalkulator Insentif)
          </button>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <span>STATUS: READY</span>
          <div className="w-2 h-2 rounded-full bg-[#107c41]"></div>
        </div>
      </div>
    </div>
  );
}
