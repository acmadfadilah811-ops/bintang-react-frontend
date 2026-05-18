import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import {
  Kanban, Clock, CheckCircle, XCircle, AlertTriangle,
  User, Edit2, X, ChevronRight, Loader2, MessageCircle, 
  FileSpreadsheet, UploadCloud, Save, ExternalLink, ArrowRightCircle, Download,
  FolderOpen, Link2
} from 'lucide-react';

// ─── Helper: pisahkan catatan milik divisi ini vs warisan divisi sebelumnya ─
function parsePreviousNotes(catatanStaff) {
  if (!Array.isArray(catatanStaff)) return { current: [], previous: [] };
  // Separator dari backend berbentuk { keterangan: '--- Dari Divisi: XXX ---', ... }
  const sepIdx = catatanStaff.findIndex(r =>
    typeof r.keterangan === 'string' && r.keterangan.startsWith('--- Dari Divisi:')
  );
  if (sepIdx === -1) return { current: catatanStaff, previous: [] };
  // catatan baris sebelum separator = milik divisi ini (terbaru)
  // separator + setelahnya = warisan dari divisi sebelumnya
  return {
    current:  catatanStaff.slice(0, sepIdx),
    previous: catatanStaff.slice(sepIdx),  // mulai dari separator
  };
}

// ─── Kolom untuk tampilan STAFF (4 kolom, tanpa kendala) ──────────────
const STAFF_COLUMNS = [
  { id: 'antrean',   label: 'Antrean',   icon: Clock,        color: 'bg-slate-100 border-slate-300',  headerColor: 'bg-slate-200 text-slate-700',  dot: 'bg-slate-400' },
  { id: 'dikerjakan',label: 'Dikerjakan',icon: Loader2,      color: 'bg-blue-50 border-blue-200',     headerColor: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500'  },
  { id: 'selesai',   label: 'Selesai',   icon: CheckCircle,  color: 'bg-green-50 border-green-200',   headerColor: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  { id: 'gagal',     label: 'Gagal',     icon: XCircle,      color: 'bg-red-50 border-red-200',       headerColor: 'bg-red-100 text-red-700',      dot: 'bg-red-500'   },
];

// ─── Badge status untuk kartu di tampilan manager ─────────────────────
const STATUS_BADGE = {
  antrean:    { label: 'Antrean',    cls: 'bg-slate-100 text-slate-600' },
  dikerjakan: { label: 'Dikerjakan', cls: 'bg-blue-100 text-blue-700'   },
  selesai:    { label: 'Selesai',    cls: 'bg-green-100 text-green-700'  },
  gagal:      { label: 'Gagal',      cls: 'bg-red-100 text-red-700'      },
};


// ─── Komponen Utama ──────────────────────────────────────────────────
export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs]         = useState([]);
  const [orderMap, setOrderMap] = useState({}); 
  const [loading, setLoading]   = useState(true);
  
  // States untuk Modals
  const [editJob, setEditJob]           = useState(null);
  const [workspaceJob, setWorkspaceJob] = useState(null);
  const [workspaceFromStart, setWorkspaceFromStart] = useState(false);
  const [tableRows, setTableRows] = useState([]);
  const [forwardJob, setForwardJob] = useState(null);   // Modal teruskan ke divisi
  const [tahapList, setTahapList]   = useState([]);     // Daftar semua tahap
  const [staffList, setStaffList]   = useState([]);     // Daftar staff untuk assign
  
  const [saving, setSaving] = useState(false);
  const isManager = ['owner', 'manager'].includes(user?.role);

  // ── State untuk Pemakaian Bahan Inventori ────────────────────────
  const [inventoryItems, setInventoryItems] = useState([]);
  const [materialUsage, setMaterialUsage]   = useState([]); // [{item_id, item_nama, satuan, qty, catatan}]

  const defaultMaterial = () => ({ item_id: '', item_nama: '', satuan: '', qty: '', catatan: '' });
  const addMaterial    = () => setMaterialUsage(m => [...m, defaultMaterial()]);
  const removeMaterial = (i) => setMaterialUsage(m => m.filter((_, idx) => idx !== i));
  const updateMaterial = (i, field, val) =>
    setMaterialUsage(m => m.map((row, idx) => idx === i ? { ...row, [field]: val } : row));
  const selectInventoryItem = (i, itemId) => {
    const found = inventoryItems.find(it => it.id === itemId);
    if (found) {
      setMaterialUsage(m => m.map((row, idx) => idx === i
        ? { ...row, item_id: found.id, item_nama: found.nama, satuan: found.satuan }
        : row
      ));
    }
  };

  // ── Helper tabel Excel ────────────────────────────────────────────
  const defaultRow = () => ({ keterangan: '', jumlah: '', satuan: '', catatan: '' });
  const addRow = () => setTableRows(r => [...r, defaultRow()]);
  const removeRow = (i) => setTableRows(r => r.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) => setTableRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

  // ── Buka Workspace ────────────────────────────────────────────────
  const openWorkspace = (job, orderItemData, fromStart = false) => {
    setWorkspaceJob({ job, orderItemData });
    setWorkspaceFromStart(fromStart);
    // Inisialisasi tabel dari data yang sudah ada di backend
    const existing = Array.isArray(job.catatan_staff) && job.catatan_staff.length > 0
      ? job.catatan_staff
      : [defaultRow()];
    setTableRows(existing);
    setMaterialUsage([defaultMaterial()]); // reset material usage
    // Fetch inventory untuk pilihan bahan
    apiClient.get('/inventory/').then(res => setInventoryItems(res.data)).catch(() => {});
  };

  // ── Fetch Data ─────────────────────────────────────────────────────
  // silent=true → tidak tampilkan loading spinner (dipakai setelah save)
  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [jobsRes, ordersRes] = await Promise.all([
        apiClient.get('/jobs/'),
        apiClient.get('/orders/'),
      ]);

      const map = {};
      ordersRes.data.forEach(order => {
        order.items?.forEach(item => {
          map[item.id] = {
            orderItemId: item.id,
            orderId: order.id,
            jenisProduk: item.jenis_produk,
            customerName: order.nama,
            nomorWa: order.nomor_wa,
            keterangan: item.detail || order.catatan_pelanggan || '',
            fileLink: item.gdrive_customer_link || '',
            qty: item.qty || 1,
            hargaJual: item.harga_jual || 0
          };
        });
      });

      setJobs(jobsRes.data);
      setOrderMap(map);
    } catch (err) {
      console.error('Gagal memuat data:', err);
    } finally {
      if (!silent) setLoading(false);  // hanya reset loading jika kita yang set
    }
  };

  useEffect(() => {
    fetchData();
    // Fetch tahap & staff untuk modal forward
    apiClient.get('/tahap-proses/').then(res => setTahapList(res.data)).catch(() => {});
    apiClient.get('/users/').then(res => setStaffList(res.data.filter(u => u.role === 'staff'))).catch(() => {});
  }, []);

  // ── Kelompokkan job per STATUS (untuk tampilan Staff) ────────────
  const groupedByStatus = useMemo(() => {
    const groups = {};
    STAFF_COLUMNS.forEach(col => { groups[col.id] = []; });
    jobs.forEach(job => {
      if (groups[job.status_pekerjaan] !== undefined) {
        groups[job.status_pekerjaan].push(job);
      }
    });
    return groups;
  }, [jobs]);

  // Pisah: job aktif (antri/dikerjakan) vs riwayat (selesai/gagal)
  // Staff hanya melihat job aktif miliknya di kanban utama
  const activeStaffJobs = useMemo(() =>
    jobs.filter(j => j.status_pekerjaan === 'antrean' || j.status_pekerjaan === 'dikerjakan'),
    [jobs]
  );
  const doneStaffJobs = useMemo(() =>
    jobs.filter(j => j.status_pekerjaan === 'selesai' || j.status_pekerjaan === 'gagal'),
    [jobs]
  );

  // ── Kelompokkan job per DIVISI (untuk tampilan Manager) ──────────
  // Hanya tampilkan job AKTIF (antrean/dikerjakan) per kolom divisi
  // Job selesai/gagal disimpan terpisah untuk history accordion
  const groupedByDivisi = useMemo(() => {
    const active = {};
    const done   = {};
    jobs.forEach(job => {
      const divisi = job.tahap_divisi_nama || job.pic_divisi_nama || 'Tanpa Divisi';
      const isDone = job.status_pekerjaan === 'selesai' || job.status_pekerjaan === 'gagal';
      if (isDone) {
        if (!done[divisi]) done[divisi] = [];
        done[divisi].push(job);
      } else {
        if (!active[divisi]) active[divisi] = [];
        active[divisi].push(job);
      }
    });
    // Gabungkan semua divisi yang pernah ada (baik aktif maupun selesai)
    const allDivisi = [...new Set([...Object.keys(active), ...Object.keys(done)])];
    return { active, done, allDivisi };
  }, [jobs]);



  // ── Update Status Cepat (tanpa modal) ────────────────────────────
  const handleQuickUpdate = async (jobId, newStatus) => {
    try {
      await apiClient.patch(`/jobs/${jobId}/`, { status_pekerjaan: newStatus });
      fetchData(true); // silent
    } catch (err) {
      console.error('Gagal update status:', err);
      alert('Gagal mengubah status. Coba lagi.');
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/export/jobs/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'jobs.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed', error);
      alert('Gagal mengekspor data.');
    }
  };

  // ── Update via Modal (status + insentif + PIC) ───────────────────
  const handleModalSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const form = e.target;
    const payload = {
      status_pekerjaan: form.status_pekerjaan.value,
      insentif: parseInt(form.insentif?.value || 0),
    };
    if (isManager && form.pic_staff) {
      payload.pic_staff = form.pic_staff.value || null;
    }
    try {
      await apiClient.patch(`/jobs/${editJob.id}/`, payload);
      setEditJob(null);
      fetchData(true); // silent
    } catch (err) {
      console.error('Gagal menyimpan:', err);
      alert('Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  // ── Forward Job ke tahap selanjutnya ─────────────────────────────────
  const handleForward = async (e) => {
    e.preventDefault();
    setSaving(true);
    const form = e.target;
    const aksi = form.aksi.value;
    const payload = { aksi };
    if (aksi === 'forward') {
      payload.tahap_id     = parseInt(form.tahap_id.value);
      if (form.pic_staff_id?.value) payload.pic_staff_id = parseInt(form.pic_staff_id.value);
    }
    try {
      await apiClient.post(`/jobs/${forwardJob.id}/forward/`, payload);
      setForwardJob(null);
      fetchData(true); // silent
    } catch (err) {
      console.error('Gagal meneruskan job:', err);
      alert('Gagal meneruskan job.');
    } finally {
      setSaving(false);
    }
  };

  const handleWorkspaceSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const form = e.target;

    const driveVal = form.driveLink?.value?.trim() || '';
    const payload = {
      catatan_staff: tableRows,
      gdrive_output_link: driveVal,
    };
    if (workspaceFromStart) payload.status_pekerjaan = 'dikerjakan';

    try {
      // 1. Submit pemakaian bahan (jika ada yang diisi)
      const validMaterials = materialUsage.filter(m => m.item_id && parseFloat(String(m.qty).replace(',','.')) > 0);
      if (validMaterials.length > 0) {
        const matPayload = validMaterials.map(m => ({
          item_id:  m.item_id,
          qty:      parseFloat(String(m.qty).replace(',', '.')),
          catatan:  m.catatan || '',
        }));
        const matRes = await apiClient.post(
          `/jobs/${workspaceJob.job.id}/use-materials/`,
          { materials: matPayload }
        );
        // Tampilkan ringkasan jika ada error per item
        if (matRes.data.errors?.length > 0) {
          alert('Beberapa bahan gagal diproses:\n' + matRes.data.errors.join('\n'));
        }
      }

      // 2. Simpan workspace (catatan + drive link)
      await apiClient.patch(`/jobs/${workspaceJob.job.id}/`, payload);

      // 3. Update Harga Pesanan jika berubah
      const hargaBaruStr = form.hargaJualBaru?.value;
      const hargaLama = workspaceJob.orderItemData?.hargaJual;
      if (hargaBaruStr && parseInt(hargaBaruStr) !== hargaLama) {
        const hargaBaru = parseInt(hargaBaruStr);
        const alasan = form.alasanHarga?.value || 'Penyesuaian oleh staff produksi';
        const newKet = workspaceJob.orderItemData?.keterangan 
          ? workspaceJob.orderItemData.keterangan + ` | Perubahan Harga: Rp ${new Intl.NumberFormat('id-ID').format(hargaLama)} -> Rp ${new Intl.NumberFormat('id-ID').format(hargaBaru)} (${alasan})`
          : `Perubahan Harga: Rp ${new Intl.NumberFormat('id-ID').format(hargaLama)} -> Rp ${new Intl.NumberFormat('id-ID').format(hargaBaru)} (${alasan})`;
          
        await apiClient.patch(`/order-items/${workspaceJob.orderItemData.orderItemId}/`, {
          harga_jual: hargaBaru,
          detail: newKet
        });
      }

      setWorkspaceJob(null);
      setMaterialUsage([]);
      await fetchData(true);
    } catch (err) {
      const errMsg = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err?.message || 'Cek koneksi';
      console.error('Gagal simpan workspace:', errMsg);
      alert('Gagal menyimpan: ' + errMsg);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Kanban size={22} className="text-indigo-500" />
            Papan Produksi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isManager ? 'Semua job produksi' : 'Job yang di-assign ke kamu'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {isManager && (
            <button onClick={handleExport} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md font-bold transition-all shadow-sm">
              <Download size={14} /> Export Excel
            </button>
          )}
          <span className="bg-slate-100 px-2 py-1.5 rounded-md font-medium text-sm">
            Total: {jobs.length} job
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          TAMPILAN MANAGER — Kolom per Divisi
          ═══════════════════════════════════════════════════════════ */}
      {isManager ? (
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-140px)]">
          {groupedByDivisi.allDivisi.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic">
              Belum ada job. Buat order dan assign staff terlebih dahulu.
            </div>
          ) : (
            groupedByDivisi.allDivisi.map(divisi => {
              const activeJobs = groupedByDivisi.active[divisi] || [];
              const doneJobs   = groupedByDivisi.done[divisi]   || [];
              return (
                <div key={divisi} className="flex-shrink-0 w-[300px] flex flex-col">
                  {/* Header Kolom Divisi */}
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-t-lg bg-indigo-700 text-white">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏭</span>
                      <span className="text-sm font-bold">{divisi}</span>
                    </div>
                    <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                      {activeJobs.length} aktif
                    </span>
                  </div>

                  {/* Kartu-kartu Aktif */}
                  <div className="flex-1 p-2 rounded-b-lg border-2 border-indigo-200 bg-indigo-50 space-y-2 overflow-y-auto">
                    {activeJobs.length === 0 && doneJobs.length === 0 && (
                      <p className="text-center text-slate-400 text-xs py-4 italic">Tidak ada job aktif</p>
                    )}
                    {activeJobs.map(job => (
                      <ManagerJobCard
                        key={job.id}
                        job={job}
                        orderInfo={orderMap[job.order_item]}
                        onEdit={() => setEditJob(job)}
                        onForward={() => setForwardJob(job)}
                      />
                    ))}

                    {/* Riwayat Selesai/Gagal — collapsible */}
                    {doneJobs.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-[10px] text-slate-500 cursor-pointer hover:text-slate-700 font-semibold py-1 px-2 bg-white rounded border border-slate-200">
                          📋 Riwayat ({doneJobs.length} job selesai/gagal)
                        </summary>
                        <div className="mt-1 space-y-1 opacity-60">
                          {doneJobs.map(job => (
                            <ManagerJobCard
                              key={job.id}
                              job={job}
                              orderInfo={orderMap[job.order_item]}
                              onEdit={() => setEditJob(job)}
                              onForward={() => setForwardJob(job)}
                            />
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      ) : (
        /* ══════════════════════════════════════════════════════════
           TAMPILAN STAFF — Alur kerja: Antrean → Dikerjakan → Selesai → Gagal
           ══════════════════════════════════════════════════════════ */
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-140px)]">
          {STAFF_COLUMNS.map(col => {
            const colJobs = groupedByStatus[col.id] || [];
            return (
              <div key={col.id} className="flex-shrink-0 w-[280px] flex flex-col">
                <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg ${col.headerColor}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`}></span>
                    <span className="text-sm font-bold">{col.label}</span>
                  </div>
                  <span className="text-xs font-bold bg-white/60 px-2 py-0.5 rounded-full">{colJobs.length}</span>
                </div>
                <div className={`flex-1 p-2 rounded-b-lg border-2 space-y-2 overflow-y-auto ${col.color}`}>
                  {colJobs.length === 0 ? (
                    <p className="text-center text-slate-400 text-xs py-6 italic">Tidak ada job</p>
                  ) : (
                    colJobs.map(job => (
                      <JobCard
                        key={job.id}
                        job={job}
                        orderInfo={orderMap[job.order_item]}
                        isManager={false}
                        onQuickUpdate={handleQuickUpdate}
                        onEdit={() => setEditJob(job)}
                        onOpenWorkspace={(fromStart) => openWorkspace(job, orderMap[job.order_item], fromStart)}
                        onForward={() => setForwardJob(job)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 1: LAYAR KERJA (WORKSPACE EXCEL) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {workspaceJob && (
        <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden w-full h-full">
            
            {/* Header Modal */}
            <div className="bg-slate-800 text-white px-5 py-4 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/20 p-2 rounded-lg">
                  <FileSpreadsheet className="text-emerald-400" size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-lg leading-tight">Layar Kerja Produksi</h2>
                  <p className="text-xs text-slate-300">
                    ID Pesanan: <span className="font-mono bg-slate-700 px-1 rounded">#{workspaceJob.orderItemData?.orderId || '-'}</span> 
                    &nbsp;|&nbsp; Tahap: {workspaceJob.job?.tahap_nama || '-'}
                  </p>
                </div>
              </div>
              <button onClick={() => setWorkspaceJob(null)} className="text-slate-400 hover:text-white transition-colors bg-slate-700 p-1.5 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Form Worksheet */}
            <form onSubmit={handleWorkspaceSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
                
                {/* ── Panel Warisan Divisi Sebelumnya (hanya tampil jika ada) ── */}
                {(() => {
                  const { previous } = parsePreviousNotes(workspaceJob.job?.catatan_staff);
                  // Cek apakah ada link GDrive dari job sebelumnya
                  // Backend menyimpan gdrive_output_link di job itu sendiri, tetapi
                  // kita juga cari di catatan yang di-forward
                  const separators = previous.filter(r =>
                    typeof r.keterangan === 'string' && r.keterangan.startsWith('--- Dari Divisi:')
                  );
                  if (previous.length === 0) return null;
                  return (
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
                          const nextSepIdx = previous.findIndex((r, i) =>
                            i > sepIdxInPrev &&
                            typeof r.keterangan === 'string' &&
                            r.keterangan.startsWith('--- Dari Divisi:')
                          );
                          const rows = previous.slice(
                            sepIdxInPrev + 1,
                            nextSepIdx === -1 ? undefined : nextSepIdx
                          );
                          // Nama divisi dari separator
                          const divisiLabel = sep.keterangan
                            .replace('--- Dari Divisi:', '').replace('---', '').trim();
                          const staffLabel = sep.catatan?.replace('Oleh:', '').trim() || '-';
                          return (
                            <div key={si} className="bg-white rounded border border-amber-200 overflow-hidden">
                              <div className="bg-amber-100 px-3 py-1.5 flex items-center gap-2">
                                <ChevronRight size={12} className="text-amber-600" />
                                <span className="text-xs font-bold text-amber-800">{divisiLabel}</span>
                                <span className="text-[10px] text-amber-600 ml-auto">oleh: {staffLabel}</span>
                              </div>
                              {rows.length > 0 && (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-[11px] text-left">
                                    <thead className="bg-amber-50 border-b border-amber-100">
                                      <tr>
                                        <th className="px-3 py-1.5 text-amber-700 font-bold">Keterangan</th>
                                        <th className="px-3 py-1.5 text-amber-700 font-bold w-16 text-center">Jml</th>
                                        <th className="px-3 py-1.5 text-amber-700 font-bold w-16">Satuan</th>
                                        <th className="px-3 py-1.5 text-amber-700 font-bold">Catatan</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-amber-50">
                                      {rows.map((row, ri) => (
                                        <tr key={ri} className="hover:bg-amber-50/50">
                                          <td className="px-3 py-1 text-slate-700">{row.keterangan || '-'}</td>
                                          <td className="px-3 py-1 text-center text-slate-600">{row.jumlah || '-'}</td>
                                          <td className="px-3 py-1 text-slate-600">{row.satuan || '-'}</td>
                                          <td className="px-3 py-1 text-slate-500 italic">{row.catatan || '-'}</td>
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
                  );
                })()}

                {/* Tabel ala Excel - catatan_staff */}
                <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden mb-4">
                  <div className="bg-slate-700 text-white px-4 py-2 flex items-center justify-between">
                    <span className="text-sm font-bold">📋 Catatan Kerja Staff (Excel)</span>
                    <button type="button" onClick={addRow} className="text-xs bg-emerald-500 hover:bg-emerald-400 px-3 py-1 rounded font-bold transition-colors">+ Tambah Baris</button>
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
                          <th className="px-3 py-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {tableRows.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-1.5 text-slate-400 font-mono">{i + 1}</td>
                            <td className="px-2 py-1">
                              <input value={row.keterangan} onChange={e => updateRow(i, 'keterangan', e.target.value)} className="w-full border-0 bg-transparent focus:ring-1 focus:ring-indigo-400 rounded px-1 py-0.5 outline-none" placeholder="Deskripsi item..." />
                            </td>
                            <td className="px-2 py-1">
                              <input value={row.jumlah} onChange={e => updateRow(i, 'jumlah', e.target.value)} className="w-full border-0 bg-transparent focus:ring-1 focus:ring-indigo-400 rounded px-1 py-0.5 outline-none text-center" placeholder="0" />
                            </td>
                            <td className="px-2 py-1">
                              <input value={row.satuan} onChange={e => updateRow(i, 'satuan', e.target.value)} className="w-full border-0 bg-transparent focus:ring-1 focus:ring-indigo-400 rounded px-1 py-0.5 outline-none" placeholder="pcs, m, kg..." />
                            </td>
                            <td className="px-2 py-1">
                              <input value={row.catatan} onChange={e => updateRow(i, 'catatan', e.target.value)} className="w-full border-0 bg-transparent focus:ring-1 focus:ring-indigo-400 rounded px-1 py-0.5 outline-none" placeholder="Catatan tambahan..." />
                            </td>
                            <td className="px-2 py-1 text-center">
                              <button type="button" onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 font-bold text-base leading-none">&times;</button>
                            </td>
                          </tr>
                        ))}
                        {tableRows.length === 0 && (
                          <tr><td colSpan={6} className="text-center py-4 text-slate-400 italic">Klik "+ Tambah Baris" untuk mulai mengisi data</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tabel Pemakaian Bahan Inventori */}
                <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden mb-4">
                  <div className="bg-amber-600 text-white px-4 py-2 flex items-center justify-between">
                    <span className="text-sm font-bold">📦 Pemakaian Bahan Inventori (Otomatis Potong Stok)</span>
                    <button type="button" onClick={addMaterial} className="text-xs bg-amber-500 hover:bg-amber-400 px-3 py-1 rounded font-bold transition-colors shadow-sm">+ Bahan</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-amber-50 border-b border-amber-200">
                        <tr>
                          <th className="px-3 py-2 w-8 text-amber-700">#</th>
                          <th className="px-3 py-2 text-amber-900 font-bold w-64">Pilih Bahan Inventori</th>
                          <th className="px-3 py-2 text-amber-900 font-bold w-24">Qty Terpakai</th>
                          <th className="px-3 py-2 text-amber-900 font-bold w-20">Satuan</th>
                          <th className="px-3 py-2 text-amber-900 font-bold">Keterangan / Tujuan</th>
                          <th className="px-3 py-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100">
                        {materialUsage.map((row, i) => (
                          <tr key={i} className="hover:bg-amber-50/50">
                            <td className="px-3 py-1.5 text-amber-600 font-mono">{i + 1}</td>
                            <td className="px-2 py-1">
                              <select 
                                value={row.item_id} 
                                onChange={e => selectInventoryItem(i, e.target.value)}
                                className="w-full border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500 rounded px-2 py-1 outline-none text-xs"
                              >
                                <option value="">-- Pilih Bahan --</option>
                                {inventoryItems.map(inv => (
                                  <option key={inv.id} value={inv.id}>
                                    {inv.nama} (Stok: {inv.stok} {inv.satuan})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-2 py-1">
                              <input 
                                value={row.qty} 
                                onChange={e => updateMaterial(i, 'qty', e.target.value)} 
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
                                onChange={e => updateMaterial(i, 'catatan', e.target.value)} 
                                className="w-full border border-amber-200 focus:ring-2 focus:ring-amber-500 rounded px-2 py-1 outline-none" 
                                placeholder="Catatan pemakaian..." 
                              />
                            </td>
                            <td className="px-2 py-1 text-center">
                              <button type="button" onClick={() => removeMaterial(i)} className="text-red-400 hover:text-red-600 font-bold text-base leading-none">&times;</button>
                            </td>
                          </tr>
                        ))}
                        {materialUsage.length === 0 && (
                          <tr><td colSpan={6} className="text-center py-4 text-amber-600/60 italic font-medium">Klik "+ Bahan" untuk memotong stok inventori</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Info Order (read-only) */}
                <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">

                  <table className="w-full text-sm text-left">
                    <tbody className="divide-y divide-slate-200">
                      <tr className="hover:bg-slate-50">
                        <th className="w-1/4 px-4 py-3 bg-slate-100 font-semibold text-slate-700 border-r border-slate-200">Pelanggan</th>
                        <td className="px-4 py-3 text-slate-900 flex items-center gap-3">
                          <span className="font-bold">{workspaceJob.orderItemData?.customerName}</span>
                          {workspaceJob.orderItemData?.nomorWa && (
                            <a href={`https://wa.me/${workspaceJob.orderItemData.nomorWa.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-full text-xs font-bold transition-colors">
                              <MessageCircle size={14} /> Hubungi via WA
                            </a>
                          )}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <th className="px-4 py-3 bg-slate-100 font-semibold text-slate-700 border-r border-slate-200">Produk &amp; Qty</th>
                        <td className="px-4 py-3">
                          <span className="font-bold text-indigo-700">{workspaceJob.orderItemData?.jenisProduk}</span>
                          <span className="ml-2 text-slate-500">({workspaceJob.orderItemData?.qty || 1} Pcs/Paket)</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <th className="px-4 py-3 bg-slate-100 font-semibold text-slate-700 border-r border-slate-200 align-top">
                          Harga Pesanan
                        </th>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
                                Rp {new Intl.NumberFormat('id-ID').format(workspaceJob.orderItemData?.hargaJual || 0)}
                              </span>
                              <span className="text-xs text-slate-400 italic">(Harga Awal)</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Ubah Harga Akhir (Opsional)</label>
                                <input 
                                  type="number" 
                                  name="hargaJualBaru" 
                                  defaultValue={workspaceJob.orderItemData?.hargaJual || ''}
                                  placeholder="Harga baru..." 
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Alasan Perubahan (Wajib jika diubah)</label>
                                <input 
                                  type="text" 
                                  name="alasanHarga" 
                                  placeholder="Cth: Nambah bahan extra, dll" 
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <th className="px-4 py-3 bg-slate-100 font-semibold text-slate-700 border-r border-slate-200 align-top">
                          <div className="flex items-center gap-2"><UploadCloud size={16} className="text-slate-500" /> Link Google Drive</div>
                        </th>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <input type="url" name="driveLink" defaultValue={workspaceJob.job?.gdrive_output_link || ''} placeholder="https://drive.google.com/..." className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                            {workspaceJob.job?.gdrive_output_link && (
                              <a href={workspaceJob.job.gdrive_output_link} target="_blank" rel="noreferrer" className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 flex items-center gap-2 text-sm font-medium transition-colors">
                                Buka File <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 italic">Tempel link hasil kerja dari Google Drive, Canva, atau Dropbox.</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>
              
              {/* Footer Modal Action */}
              <div className="bg-white border-t border-slate-200 p-4 flex justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setWorkspaceJob(null)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
      )}

      {/* ──────────────────────────────────────────────────── */}
      {/* MODAL 3: TERUSKAN KE DIVISI SELANJUTNYA                           */}
      {/* ──────────────────────────────────────────────────── */}
      {forwardJob && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="bg-indigo-700 text-white px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <ArrowRightCircle size={22} />
                <div>
                  <h2 className="font-bold text-base">Teruskan ke Divisi Selanjutnya</h2>
                  <p className="text-indigo-200 text-xs mt-0.5">
                    Job: {orderMap[forwardJob.order_item]?.jenisProduk} — Tahap: {forwardJob.tahap_nama}
                  </p>
                </div>
              </div>
              <button onClick={() => setForwardJob(null)} className="text-indigo-200 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleForward} className="p-5 space-y-4">
              {/* Pilih Aksi */}
              <ForwardAksiSelector tahapList={tahapList} staffList={staffList} currentTahapId={forwardJob.tahap} />

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setForwardJob(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRightCircle size={14} />}
                  Konfirmasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT JOB */}
      {/* ───────────────────────────────────────────────────────────── */}
      {editJob && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-800 text-sm">Edit Status Job</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  #{orderMap[editJob.order_item]?.orderId} — {orderMap[editJob.order_item]?.jenisProduk || '...'}
                </p>
              </div>
              <button onClick={() => setEditJob(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleModalSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Pekerjaan</label>
                <select
                  name="status_pekerjaan"
                  defaultValue={editJob.status_pekerjaan}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {STAFF_COLUMNS.map(col => (
                    <option key={col.id} value={col.id}>{col.label}</option>
                  ))}
                </select>
              </div>

              {isManager && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Insentif (Rp)
                  </label>
                  <input
                    type="number"
                    name="insentif"
                    defaultValue={editJob.insentif || 0}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                    min="0"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditJob(null)}
                  className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Komponen: Kartu Job (Tampilan Staff) ────────────────────────
function JobCard({ job, orderInfo, onQuickUpdate, onEdit, onOpenWorkspace, onForward }) {
  // Cek apakah ada catatan/link dari divisi sebelumnya
  const { previous } = parsePreviousNotes(job.catatan_staff);
  const hasPrevNotes = previous.length > 0;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 space-y-3 hover:border-indigo-300 hover:shadow-md transition-all group">
      
      {/* Header Kartu */}
      <div className="flex justify-between items-start gap-2">
        <div 
          onClick={() => onOpenWorkspace(false)}
          className="cursor-pointer min-w-0 flex-1 hover:opacity-80 transition-opacity"
          title="Klik untuk membuka lembar kerja"
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] bg-slate-800 text-white px-1.5 py-0.5 rounded font-mono">
              #{orderInfo?.orderId || '...'}
            </span>
            <span className="text-xs font-extrabold text-slate-900 truncate block">
              {orderInfo?.customerName || 'Memuat...'}
            </span>
          </div>
          <p className="text-[11px] text-indigo-700 font-semibold truncate leading-tight">
            {orderInfo?.jenisProduk || '...'}
          </p>
        </div>

        <div className="flex gap-1">
          {orderInfo?.nomorWa && (
            <a 
              href={`https://wa.me/${orderInfo.nomorWa.replace(/\D/g, '')}`} 
              target="_blank" 
              rel="noreferrer"
              className="p-1 text-green-500 hover:text-green-600 bg-green-50 rounded transition-colors"
              title="Hubungi via WA"
            >
              <MessageCircle size={14} />
            </a>
          )}
          <button
            onClick={onEdit}
            className="p-1 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded transition-colors"
            title="Edit Status"
          >
            <Edit2 size={14} />
          </button>
        </div>
      </div>

      {/* Tahap & PIC */}
      <div className="bg-slate-50 rounded p-1.5 space-y-1 border border-slate-100">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
          <ChevronRight size={11} className="text-slate-400 shrink-0" />
          <span className="font-semibold truncate">{job.tahap_nama || 'Belum ada tahap'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
          <User size={11} className="text-slate-400 shrink-0" />
          <span className="truncate">{job.pic_nama || <span className="italic text-slate-400">Belum ada PIC</span>}</span>
        </div>
      </div>

      {/* ── Link & Catatan dari Divisi Sebelumnya ── */}
      {hasPrevNotes && (
        <div className="bg-amber-50 border border-amber-200 rounded p-2 space-y-1.5">
          <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
            <FolderOpen size={11} /> File dari Divisi Sebelumnya
          </p>
          {/* Tampilkan semua separator dengan link GDrive masing-masing */}
          {previous
            .filter(r => typeof r.keterangan === 'string' && r.keterangan.startsWith('--- Dari Divisi:'))
            .map((sep, i) => {
              const divisiLabel = sep.keterangan?.replace('--- Dari Divisi:', '').replace('---', '').trim();
              const staffLabel = sep.catatan?.replace('Oleh:', '').trim();
              return (
                <div key={i} className="space-y-1">
                  <div className="text-[10px] text-amber-800">
                    <span className="font-semibold">{divisiLabel}</span>
                    <span className="text-amber-600 ml-1">({staffLabel})</span>
                  </div>
                  {/* Link GDrive dari divisi ini (dari separator) */}
                  {sep.gdrive_link ? (
                    <a
                      href={sep.gdrive_link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-[10px] text-blue-700 font-bold bg-blue-50 border border-blue-300 rounded px-2 py-1 hover:bg-blue-100 transition-colors w-full truncate"
                      title={sep.gdrive_link}
                    >
                      <Link2 size={10} className="shrink-0" /> 🔗 Buka File: {divisiLabel}
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Tidak ada file diunggah</span>
                  )}
                </div>
              );
            })
          }
          <button
            onClick={() => onOpenWorkspace(false)}
            className="text-[10px] text-amber-600 underline hover:text-amber-800"
          >
            Lihat catatan lengkap →
          </button>
        </div>
      )}

      {/* Insentif */}
      {job.insentif > 0 && (
        <div className="text-[10px] text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded-md w-fit">
          Rp {new Intl.NumberFormat('id-ID').format(job.insentif)}
        </div>
      )}

      {/* Tombol Aksi */}
      <div className="flex gap-1.5 pt-1 border-t border-slate-100 flex-col">
        {job.status_pekerjaan === 'antrean' && (
          <button
            onClick={() => onOpenWorkspace(true)}
            className="flex-1 text-[10px] font-bold py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
          >
            ▶ Mulai Kerjakan
          </button>
        )}
        {job.status_pekerjaan === 'dikerjakan' && (
          <button
            onClick={onForward}
            className="flex-1 text-[10px] font-bold py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors flex items-center justify-center gap-1"
          >
            <ArrowRightCircle size={12} /> Teruskan / Selesai
          </button>
        )}
      </div>
    </div>
  );
}


// ─── Sub-Komponen: Selector Aksi Forward ───────────────────────────────
function ForwardAksiSelector({ tahapList, staffList, currentTahapId }) {
  const [aksi, setAksi] = useState('forward');

  // Kelompokkan tahap berdasarkan divisi, exclude tahap yang sedang berjalan
  const tahapByDivisi = tahapList
    .filter(t => t.id !== currentTahapId)
    .reduce((acc, t) => {
      const divisi = t.divisi_nama || 'Lainnya';
      if (!acc[divisi]) acc[divisi] = [];
      acc[divisi].push(t);
      return acc;
    }, {});

  return (
    <div className="space-y-4">
      {/* Pilihan Aksi */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">Apa yang ingin dilakukan?</label>
        <div className="grid grid-cols-2 gap-2">
          <label className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
            aksi === 'forward' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
          }`}>
            <input type="radio" name="aksi" value="forward" checked={aksi === 'forward'} onChange={() => setAksi('forward')} className="hidden" />
            <ArrowRightCircle size={18} className={aksi === 'forward' ? 'text-indigo-600' : 'text-slate-400'} />
            <div>
              <p className={`text-xs font-bold ${aksi === 'forward' ? 'text-indigo-700' : 'text-slate-700'}`}>Teruskan</p>
              <p className="text-[10px] text-slate-500">Ke divisi/tahap lain</p>
            </div>
          </label>
          <label className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
            aksi === 'selesai' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300'
          }`}>
            <input type="radio" name="aksi" value="selesai" checked={aksi === 'selesai'} onChange={() => setAksi('selesai')} className="hidden" />
            <CheckCircle size={18} className={aksi === 'selesai' ? 'text-green-600' : 'text-slate-400'} />
            <div>
              <p className={`text-xs font-bold ${aksi === 'selesai' ? 'text-green-700' : 'text-slate-700'}`}>Selesai</p>
              <p className="text-[10px] text-slate-500">Tidak ada tahap lanjutan</p>
            </div>
          </label>
        </div>
      </div>

      {/* Pilih Tahap Tujuan (hanya jika aksi = forward) */}
      {aksi === 'forward' && (
        <>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tahap Tujuan *</label>
            <select name="tahap_id" required className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">-- Pilih Tahap --</option>
              {Object.entries(tahapByDivisi).map(([divisi, tahaps]) => (
                <optgroup key={divisi} label={`📦 Divisi: ${divisi}`}>
                  {tahaps.map(t => (
                    <option key={t.id} value={t.id}>{t.nama}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {staffList.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assign Staff (Opsional)</label>
              <select name="pic_staff_id" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">-- Pilih Staff --</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.username}{s.divisi_nama ? ` (${s.divisi_nama})` : ''}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Kosongkan jika manager yang akan assign nanti</p>
            </div>
          )}
        </>
      )}

      {aksi === 'selesai' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
          ✅ Job ini akan ditandai <strong>Selesai</strong>. Tidak ada job baru yang dibuat.
        </div>
      )}
    </div>
  );
}

// ─── Sub-Komponen: Kartu Job untuk Manager (per Divisi) ──────────────
function ManagerJobCard({ job, orderInfo, onEdit, onForward }) {
  const badge = STATUS_BADGE[job.status_pekerjaan] || { label: job.status_pekerjaan, cls: 'bg-slate-100 text-slate-600' };
  const { previous } = parsePreviousNotes(job.catatan_staff);
  const hasPrevNotes = previous.length > 0;

  return (
    <div className="bg-white rounded-lg border border-indigo-100 shadow-sm p-3 space-y-2 hover:shadow-md hover:border-indigo-300 transition-all">
      {/* Baris atas: Order ID + Badge Status */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] bg-slate-800 text-white px-1.5 py-0.5 rounded font-mono">
          #{orderInfo?.orderId || '...'}
        </span>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Nama Customer & Produk */}
      <div>
        <p className="text-xs font-extrabold text-slate-900 truncate">{orderInfo?.customerName || 'Memuat...'}</p>
        <p className="text-[11px] text-indigo-700 font-semibold truncate">{orderInfo?.jenisProduk || '...'}</p>
      </div>

      {/* Tahap & PIC */}
      <div className="bg-slate-50 rounded p-1.5 space-y-1 border border-slate-100">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
          <ChevronRight size={10} className="text-slate-400 shrink-0" />
          <span className="font-semibold truncate">{job.tahap_nama || 'Belum ada tahap'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
          <User size={10} className="text-slate-400 shrink-0" />
          <span className="truncate">{job.pic_nama || <span className="italic text-slate-400">Belum ada PIC</span>}</span>
        </div>
      </div>

      {/* ── Link GDrive dari divisi sebelumnya (jika ada) ── */}
      {/* Tampilkan link dari setiap separator (per divisi yang pernah meneruskan) */}
      {previous
        .filter(r => typeof r.keterangan === 'string' && r.keterangan.startsWith('--- Dari Divisi:') && r.gdrive_link)
        .map((sep, i) => {
          const divisiLabel = sep.keterangan?.replace('--- Dari Divisi:', '').replace('---', '').trim();
          return (
            <a
              key={i}
              href={sep.gdrive_link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[10px] text-blue-700 font-bold bg-blue-50 border border-blue-200 rounded px-2 py-1 hover:bg-blue-100 transition-colors w-full truncate"
              title={sep.gdrive_link}
            >
              <Link2 size={10} className="shrink-0" /> 🔗 File: {divisiLabel}
            </a>
          );
        })
      }

      {/* Badge: ada catatan dari divisi sebelumnya */}
      {hasPrevNotes && (
        <div className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
          <FolderOpen size={10} />
          <span>Ada catatan dari divisi sebelumnya</span>
        </div>
      )}

      {/* Insentif */}
      {job.insentif > 0 && (
        <div className="text-[10px] text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded-md w-fit">
          Rp {new Intl.NumberFormat('id-ID').format(job.insentif)}
        </div>
      )}

      {/* Aksi Manager */}
      <div className="flex gap-1.5 pt-1 border-t border-slate-100">
        <button
          onClick={onEdit}
          className="flex-1 text-[10px] font-bold py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors flex items-center justify-center gap-1"
        >
          <Edit2 size={11} /> Edit
        </button>
        {(job.status_pekerjaan === 'dikerjakan' || job.status_pekerjaan === 'antrean') && (
          <button
            onClick={onForward}
            className="flex-1 text-[10px] font-bold py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors flex items-center justify-center gap-1"
          >
            <ArrowRightCircle size={11} /> Teruskan
          </button>
        )}
      </div>
    </div>
  );
}