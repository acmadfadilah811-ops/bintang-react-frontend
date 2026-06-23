import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Kanban, Download, Grid } from 'lucide-react';
import apiClient from '../api/apiClient';

// ─── Hook & Komponen ──────────────────────────────────────
import { useJobsData } from '../components/jobs/useJobsData';
import { STAFF_COLUMNS } from '../components/jobs/jobConstants';
import JobCard from '../components/jobs/JobCard';
import ManagerTable from '../components/jobs/ManagerTable';
import EditJobModal from '../components/jobs/modals/EditJobModal';
import ForwardJobModal from '../components/jobs/modals/ForwardJobModal';
import WorkspaceModal from '../components/jobs/modals/WorkspaceModal';
import QueueStartModal from '../components/jobs/modals/QueueStartModal';
import FailedDetailModal from '../components/jobs/modals/FailedDetailModal';
import FailedReasonModal from '../components/jobs/modals/FailedReasonModal';
import WorkspaceReviewModal from '../components/jobs/modals/WorkspaceReviewModal';

export default function Jobs() {
  const { user } = useAuth();
  const isManager = ['owner', 'manager', 'admin'].includes(user?.role);

  const getDashboardUrl = () => {
    if (['owner', 'manager', 'admin'].includes(user?.role?.toLowerCase())) return '/dashboard';
    return '/staff-dashboard';
  };

  // ─── Data & Handlers dari custom hook ────────────────
  const {
    jobs,
    orderMap,
    loading,
    saving,
    exporting,
    error,
    tahapList,
    staffList,
    groupedByStatus,
    fetchData,
    handleModalSave,
    handleForward,
    handleWorkspaceSave,
    handleExport,
  } = useJobsData(isManager);

  // ─── State Modal ─────────────────────────────────────
  const [editJob, setEditJob] = useState(null);
  const [forwardJob, setForwardJob] = useState(null);
  const [workspaceJob, setWorkspaceJob] = useState(null); // { job, orderItemData, fromStart }
  const [queueStartJob, setQueueStartJob] = useState(null); // { job, orderInfo }
  const [failedDetailJob, setFailedDetailJob] = useState(null); // { job, orderInfo }
  const [failedReasonJob, setFailedReasonJob] = useState(null); // { job, orderInfo, pendingData }
  const [workspaceReviewJob, setWorkspaceReviewJob] = useState(null); // { job, orderItemData }

  // ─── Spreadsheet States & Functions ───────────
  const [viewMode, setViewMode] = useState('standard'); // 'standard' | 'spreadsheet'
  const [spreadsheetGrid, setSpreadsheetGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null); // { r, c }
  const [pivotConfig, setPivotConfig] = useState({
    rowField: 'staff',
    valField: 'insentif',
    aggType: 'sum',
  });

  const evaluateCell = (formulaStr, currentGrid) => {
    if (!formulaStr || !String(formulaStr).startsWith('=')) {
      return formulaStr;
    }
    const cleanFormula = String(formulaStr).substring(1).toUpperCase().trim();
    const match = cleanFormula.match(/^([A-Z]+)\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/);
    if (!match) return '#VALUE!';
    
    const [_, func, colStartLetter, rowStartStr, colEndLetter, rowEndStr] = match;
    const startRow = parseInt(rowStartStr) - 1;
    const endRow = parseInt(rowEndStr) - 1;
    
    const letterToIdx = (l) => l.charCodeAt(0) - 65;
    const startCol = letterToIdx(colStartLetter);
    const endCol = letterToIdx(colEndLetter);
    
    const values = [];
    for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
      for (let c = Math.min(startCol, endCol); c <= Math.max(startCol, endCol); c++) {
        if (currentGrid[r] && currentGrid[r][c]) {
          const val = parseFloat(currentGrid[r][c].computed || currentGrid[r][c].value || 0);
          if (!isNaN(val)) values.push(val);
        }
      }
    }
    
    if (func === 'SUM') return values.reduce((sum, v) => sum + v, 0);
    if (func === 'AVERAGE' || func === 'AVG') return values.length > 0 ? (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1) : 0;
    if (func === 'COUNT') return values.length;
    if (func === 'MIN') return values.length > 0 ? Math.min(...values) : 0;
    if (func === 'MAX') return values.length > 0 ? Math.max(...values) : 0;
    return '#REF!';
  };

  const recalculateGrid = (currentGrid) => {
    const newGrid = currentGrid.map((row) => row.map((cell) => ({ ...cell })));
    for (let pass = 0; pass < 2; pass++) {
      for (let r = 0; r < newGrid.length; r++) {
        for (let c = 0; c < newGrid[r].length; c++) {
          const cell = newGrid[r][c];
          if (cell.value && String(cell.value).startsWith('=')) {
            cell.computed = String(evaluateCell(cell.value, newGrid));
          } else {
            cell.computed = cell.value;
          }
        }
      }
    }
    return newGrid;
  };

  const initSpreadsheetWithJobs = useCallback(() => {
    const ROWS = 35;
    const COLS = 10;
    const grid = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        row.push({ value: '', computed: '' });
      }
      grid.push(row);
    }
    
    const headers = [
      'Job ID',      // A
      'Order ID',    // B
      'Customer',    // C
      'Product',     // D
      'Stage / Div', // E
      'PIC Operator',// F
      'Status',      // G
      'Duration (m)',// H
      'Incentive (Rp)', // I
      'HPP Bahan'    // J
    ];
    headers.forEach((h, idx) => {
      grid[0][idx] = { value: h, computed: h, isHeader: true };
    });
    
    const maxJobs = Math.min(jobs.length, 25);
    for (let i = 0; i < maxJobs; i++) {
      const job = jobs[i];
      const r = i + 1;
      const order = orderMap[job.order_item] || {};
      
      grid[r][0] = { value: job.id || '', computed: String(job.id || '') };
      grid[r][1] = { value: order.orderId || '', computed: String(order.orderId || '') };
      grid[r][2] = { value: order.customerName || '', computed: order.customerName || '' };
      grid[r][3] = { value: order.jenisProduk || '', computed: order.jenisProduk || '' };
      grid[r][4] = { value: job.tahap_nama || '', computed: job.tahap_nama || '' };
      grid[r][5] = { value: job.pic_nama || 'Belum Ada', computed: job.pic_nama || 'Belum Ada' };
      grid[r][6] = { value: job.status_pekerjaan || '', computed: job.status_pekerjaan || '' };
      grid[r][7] = { value: job.durasi_menit || 0, computed: String(job.durasi_menit || 0) };
      grid[r][8] = { value: job.insentif || 0, computed: String(job.insentif || 0) };
      grid[r][9] = { value: job.hpp_bahan || 0, computed: String(job.hpp_bahan || 0) };
    }
    
    const totalRowIdx = maxJobs + 2;
    if (totalRowIdx < ROWS) {
      grid[totalRowIdx][0] = { value: 'Total / Rata-rata', computed: 'Total / Rata-rata', isLabel: true };
      grid[totalRowIdx][7] = { value: `=AVERAGE(H2:H${totalRowIdx})`, computed: '' };
      grid[totalRowIdx][8] = { value: `=SUM(I2:I${totalRowIdx})`, computed: '' };
      grid[totalRowIdx][9] = { value: `=SUM(J2:J${totalRowIdx})`, computed: '' };
      
      grid[totalRowIdx - 1][7] = { value: 'Avg Dur', computed: 'Avg Dur', isLabel: true };
      grid[totalRowIdx - 1][8] = { value: 'Total Ins', computed: 'Total Ins', isLabel: true };
      grid[totalRowIdx - 1][9] = { value: 'Total HPP', computed: 'Total HPP', isLabel: true };
    }
    
    setSpreadsheetGrid(recalculateGrid(grid));
  }, [jobs, orderMap]);

  useEffect(() => {
    if (jobs.length > 0) {
      initSpreadsheetWithJobs();
    }
  }, [jobs, initSpreadsheetWithJobs]);

  const generatePivotTable = () => {
    const groups = {};
    jobs.forEach((job) => {
      let key = 'Lainnya';
      if (pivotConfig.rowField === 'staff') key = job.pic_nama || 'Tanpa PIC';
      else if (pivotConfig.rowField === 'divisi') key = job.tahap_nama || 'Tanpa Tahap';
      else if (pivotConfig.rowField === 'produk') {
        const order = orderMap[job.order_item] || {};
        key = order.jenisProduk || 'Tanpa Produk';
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(job);
    });
    
    const ROWS = 35;
    const COLS = 10;
    const grid = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        row.push({ value: '', computed: '' });
      }
      grid.push(row);
    }
    
    grid[0][0] = { value: pivotConfig.rowField.toUpperCase(), computed: pivotConfig.rowField.toUpperCase(), isHeader: true };
    grid[0][1] = { value: `${pivotConfig.valField.toUpperCase()} (${pivotConfig.aggType.toUpperCase()})`, computed: `${pivotConfig.valField.toUpperCase()} (${pivotConfig.aggType.toUpperCase()})`, isHeader: true };
    
    let currentIdx = 1;
    Object.keys(groups).forEach((key) => {
      const gJobs = groups[key];
      let finalVal = 0;
      
      const getVal = (j) => {
        if (pivotConfig.valField === 'insentif') return j.insentif || 0;
        if (pivotConfig.valField === 'durasi') return j.durasi_menit || 0;
        if (pivotConfig.valField === 'qty') return 1;
        return 0;
      };
      
      if (pivotConfig.aggType === 'sum') {
        finalVal = gJobs.reduce((sum, j) => sum + getVal(j), 0);
      } else if (pivotConfig.aggType === 'avg') {
        const total = gJobs.reduce((sum, j) => sum + getVal(j), 0);
        finalVal = gJobs.length > 0 ? (total / gJobs.length).toFixed(1) : 0;
      } else if (pivotConfig.aggType === 'count') {
        finalVal = gJobs.length;
      }
      
      grid[currentIdx][0] = { value: key, computed: key };
      grid[currentIdx][1] = { value: finalVal, computed: String(finalVal) };
      currentIdx++;
    });
    
    grid[currentIdx][0] = { value: 'GRAND TOTAL', computed: 'GRAND TOTAL', isLabel: true };
    grid[currentIdx][1] = { value: `=SUM(B2:B${currentIdx})`, computed: '' };
    
    setSpreadsheetGrid(recalculateGrid(grid));
  };

  const downloadSpreadsheetCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    spreadsheetGrid.forEach((row) => {
      const rowData = row.map((cell) => {
        const val = cell.computed !== undefined ? cell.computed : cell.value;
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(",");
      csvContent += rowData + "\r\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_pekerjaan.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // ─── Sync Modal States ──────────────────────────────
  useEffect(() => {
    if (workspaceJob) {
      const updatedJob = jobs.find((j) => j.id === workspaceJob.job.id);
      if (updatedJob && JSON.stringify(updatedJob) !== JSON.stringify(workspaceJob.job)) {
        setWorkspaceJob((prev) => ({ ...prev, job: updatedJob }));
      }
    }
    if (workspaceReviewJob) {
      const updatedJob = jobs.find((j) => j.id === workspaceReviewJob.job.id);
      if (updatedJob && JSON.stringify(updatedJob) !== JSON.stringify(workspaceReviewJob.job)) {
        setWorkspaceReviewJob((prev) => ({ ...prev, job: updatedJob }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

  // ─── Buka workspace sesuai kolom status ──────────────
  const openWorkspace = (job) => {
    const orderItemId = typeof job.order_item === 'object' ? job.order_item?.id : job.order_item;
    const orderInfo = orderMap[orderItemId];

    if (job.status_pekerjaan === 'antrean') {
      setQueueStartJob({ job, orderInfo });
    } else if (job.status_pekerjaan === 'gagal') {
      setFailedDetailJob({ job, orderInfo });
    } else if (job.status_pekerjaan === 'selesai') {
      setWorkspaceReviewJob({ job, orderItemData: orderInfo });
    } else {
      setWorkspaceJob({ job, orderItemData: orderInfo, fromStart: false });
    }
  };

  // ─── Memulai Pekerjaan dari Papan Antrean ─────────────
  const handleStartJob = async (job) => {
    try {
      await apiClient.patch(`/jobs/${job.id}/`, { status_pekerjaan: 'dikerjakan' });
      await fetchData(true);
      setQueueStartJob(null);
      // Buka workspace modal dikerjakan secara langsung
      const orderItemId = typeof job.order_item === 'object' ? job.order_item?.id : job.order_item;
      setWorkspaceJob({ job, orderItemData: orderMap[orderItemId], fromStart: false });
    } catch {
      alert('Gagal memulai pekerjaan.');
    }
  };

  // ─── Menyimpan Alasan Gagal & Form Data Workspace ─────
  const handleSaveFailedReason = async (reason) => {
    if (!failedReasonJob) return;
    const data = {
      ...failedReasonJob.pendingData,
      statusPekerjaan: 'gagal',
      alasanGagal: reason,
    };
    const result = await handleWorkspaceSave(data);
    if (result.ok) {
      setFailedReasonJob(null);
    } else {
      alert(result.error);
    }
  };

  // ─── Mengajukan Revisi (Pekerjaan Selesai -> Dikerjakan) ──
  const handleRequestRevision = async (job) => {
    try {
      await apiClient.patch(`/jobs/${job.id}/`, {
        status_pekerjaan: 'dikerjakan',
        otp_code: '',
        otp_sent: false,
        otp_requested: false,
      });
      await fetchData(true);
      setWorkspaceReviewJob(null);
      // Buka workspace modal dikerjakan secara langsung untuk editing
      const orderItemId = typeof job.order_item === 'object' ? job.order_item?.id : job.order_item;
      setWorkspaceJob({ job, orderItemData: orderMap[orderItemId], fromStart: false });
    } catch {
      alert('Gagal memproses revisi pekerjaan.');
    }
  };

  // ─── Loading & Error state ────────────────────────────────────
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50/50">
        <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center px-4 gap-5">
        {/* Icon terkunci */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-4 border-slate-200">
            <Kanban size={40} className="text-slate-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-rose-500 flex items-center justify-center border-2 border-white shadow">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-slate-800 mb-1">Papan Produksi Terkunci</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Akses ke papan kerja membutuhkan status absensi aktif — sudah <strong>Clock-In</strong>{' '}
            dan belum <strong>Clock-Out</strong>, atau izin khusus dari Owner/Manager.
          </p>
        </div>

        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-3 shadow-sm">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            Prosedur Otoritas Papan Produksi
          </p>
          <div className="flex items-start gap-2.5 text-xs text-slate-600">
            <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-black shrink-0">
              ✓
            </span>
            <span>
              Mulai Jam Kerja: <strong>Clock-In</strong> aktif → Akses papan terbuka otomatis.
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-slate-600">
            <span className="mt-0.5 w-4 h-4 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[9px] font-black shrink-0">
              ✕
            </span>
            <span>
              Selesai Jam Kerja: <strong>Clock-Out</strong> dilakukan → Akses papan terkunci
              otomatis.
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-slate-600">
            <span className="mt-0.5 w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-black shrink-0">
              ℹ
            </span>
            <span>
              Kebutuhan Mendesak: Akses di luar jam kerja dapat diajukan kepada Owner/Manager untuk
              pembukaan manual.
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={() => (window.location.href = getDashboardUrl())}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm cursor-pointer"
          >
            Ke Dashboard (Absensi)
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-600 font-semibold rounded-xl text-sm border border-slate-200 transition-all cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-3 pb-4 max-w-[1400px] mx-auto">
      {/* ── Header ── */}
      <div className="bg-white p-2.5 rounded-md shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Kanban size={15} className="text-indigo-600" />
            {isManager ? 'Dashboard Master Admin' : 'Papan Kerja Operator'}
          </h1>
          <p className="text-[10px] text-slate-500 font-medium">
            {isManager
              ? 'Sistem monitoring terpusat dan verifikasi keamanan OTP'
              : 'Selesaikan job dan minta OTP Admin untuk lanjut proses'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggles */}
          <div className="flex border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-[10px] font-bold">
            <button
              onClick={() => setViewMode('standard')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'standard'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isManager ? 'Table View' : 'Kanban View'}
            </button>
            <button
              onClick={() => setViewMode('spreadsheet')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'spreadsheet'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Grid size={10} className="text-emerald-500" />
              Spreadsheet
            </button>
          </div>

          {isManager && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-md px-2.5 py-1.5 text-[11px] font-bold hover:bg-emerald-100 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Download size={12} /> {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
          )}
        </div>
      </div>

      {/* ── View berdasarkan role dan viewMode ── */}
      {viewMode === 'spreadsheet' ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 h-[calc(100vh-140px)] animate-fade-in">
          {/* Formula and Control Panel */}
          <div className="p-4 bg-slate-50/50 border-b border-slate-200 space-y-3 shrink-0">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-2 shadow-3xs">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider pl-1">
                  Config Pivot
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-bold">Baris:</span>
                  <select
                    value={pivotConfig.rowField}
                    onChange={(e) => setPivotConfig({ ...pivotConfig, rowField: e.target.value })}
                    className="border border-slate-250 bg-slate-50 rounded px-2.5 py-1 text-slate-700 font-bold outline-none text-xs"
                  >
                    <option value="staff">Staf PIC</option>
                    <option value="divisi">Tahap Divisi</option>
                    <option value="produk">Produk / Jenis</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-bold">Nilai:</span>
                  <select
                    value={pivotConfig.valField}
                    onChange={(e) => setPivotConfig({ ...pivotConfig, valField: e.target.value })}
                    className="border border-slate-250 bg-slate-50 rounded px-2.5 py-1 text-slate-700 font-bold outline-none text-xs"
                  >
                    <option value="insentif">Insentif (Rp)</option>
                    <option value="durasi">Durasi (Menit)</option>
                    <option value="qty">Banyak Pekerjaan</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-bold">Agregasi:</span>
                  <select
                    value={pivotConfig.aggType}
                    onChange={(e) => setPivotConfig({ ...pivotConfig, aggType: e.target.value })}
                    className="border border-slate-250 bg-slate-50 rounded px-2.5 py-1 text-slate-700 font-bold outline-none text-xs"
                  >
                    <option value="sum">SUM</option>
                    <option value="avg">AVG</option>
                    <option value="count">COUNT</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={generatePivotTable}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-3.5 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Pivot Table
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={initSpreadsheetWithJobs}
                  className="bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl shadow-3xs transition-all cursor-pointer border border-slate-200"
                >
                  Reset Grid
                </button>
                <button
                  type="button"
                  onClick={downloadSpreadsheetCSV}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-3xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Download size={13} />
                  Download CSV
                </button>
              </div>
            </div>

            {/* Formula Bar */}
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-4xs">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono select-none">
                {selectedCell ? `${String.fromCharCode(65 + selectedCell.c)}${selectedCell.r + 1}` : 'CELL'}
              </div>
              <div className="h-5 w-px bg-slate-200"></div>
              <div className="text-xs font-bold text-slate-400 font-serif italic select-none">fx</div>
              <input
                type="text"
                value={
                  selectedCell
                    ? spreadsheetGrid[selectedCell.r]?.[selectedCell.c]?.value || ''
                    : ''
                }
                disabled={!selectedCell}
                onChange={(e) => {
                  if (!selectedCell) return;
                  const newGrid = spreadsheetGrid.map((row, rIdx) =>
                    row.map((cell, cIdx) => {
                      if (rIdx === selectedCell.r && cIdx === selectedCell.c) {
                        return { ...cell, value: e.target.value };
                      }
                      return cell;
                    })
                  );
                  setSpreadsheetGrid(recalculateGrid(newGrid));
                }}
                placeholder="Pilih sel di bawah, lalu masukkan nilai manual atau rumus (Cth: =SUM(J2:J12) atau 50000)"
                className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-slate-800"
              />
            </div>

            {/* Interactive Database Actions */}
            {(() => {
              const selectedRowJobId = selectedCell && spreadsheetGrid[selectedCell.r]?.[0]?.value;
              const selectedJob = selectedRowJobId ? jobs.find(j => String(j.id) === String(selectedRowJobId)) : null;
              if (!selectedJob) return null;
              return (
                <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 animate-fade-in shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-650 bg-indigo-600 animate-pulse"></span>
                    <span className="text-xs font-bold text-indigo-900">
                      JOB SELEKTIF: #{selectedJob.id} &bull; {(orderMap[selectedJob.order_item]?.customerName) || 'Klien'} &bull; {(orderMap[selectedJob.order_item]?.jenisProduk) || 'Produk'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {!isManager ? (
                      <button
                        onClick={() => openWorkspace(selectedJob)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1 rounded-lg shadow-sm cursor-pointer"
                      >
                        Buka Papan Kerja
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditJob(selectedJob)}
                        className="bg-slate-700 hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1 rounded-lg shadow-sm cursor-pointer"
                      >
                        Edit Info Job
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Grid Table */}
          <div className="overflow-x-auto overflow-y-auto flex-1 bg-slate-100/30 custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-100 select-none sticky top-0 z-10">
                  <th className="w-10 border border-slate-200 text-center bg-slate-200/60 font-black text-slate-500 text-[10px] py-1.5"></th>
                  {Array.from({ length: 10 }).map((_, cIdx) => (
                    <th
                      key={cIdx}
                      className="px-3 py-1.5 border border-slate-200 text-center bg-slate-200/60 font-black text-slate-500 font-mono text-[10px]"
                    >
                      {String.fromCharCode(65 + cIdx)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {spreadsheetGrid.map((row, rIdx) => (
                  <tr key={rIdx} className="bg-white">
                    {/* Row Index Column */}
                    <td className="border border-slate-200 text-center bg-slate-100 font-mono font-bold text-slate-400 text-[10px] py-1 select-none">
                      {rIdx + 1}
                    </td>
                    {row.map((cell, cIdx) => {
                      const isSelected = selectedCell && selectedCell.r === rIdx && selectedCell.c === cIdx;
                      const isHeader = cell.isHeader;
                      const isLabel = cell.isLabel;
                      
                      let cellStyle = "border border-slate-200 px-2 py-1 text-[11px] font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] transition-all cursor-pointer ";
                      if (isSelected) {
                        cellStyle += "ring-2 ring-indigo-500 bg-indigo-50/40 z-10 relative ";
                      } else if (isHeader) {
                        cellStyle += "bg-slate-50 font-black text-slate-700 text-center font-sans tracking-wide uppercase ";
                      } else if (isLabel) {
                        cellStyle += "bg-slate-50/50 font-bold text-slate-500 font-sans ";
                      } else if (cell.value && String(cell.value).startsWith('=')) {
                        cellStyle += "font-bold text-indigo-700 bg-indigo-50/20 ";
                      } else {
                        cellStyle += "text-slate-650 hover:bg-slate-50/50 ";
                      }

                      const formatRupiah = (number) => {
                        return new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(number);
                      };

                      return (
                        <td
                          key={cIdx}
                          onClick={() => {
                            setSelectedCell({ r: rIdx, c: cIdx });
                          }}
                          className={cellStyle}
                          title={cell.value ? `Val: ${cell.value}\nComputed: ${cell.computed}` : ''}
                        >
                          {cell.computed !== undefined
                            ? ( (cIdx === 8 || cIdx === 9) && !isNaN(parseFloat(cell.computed)) && !isHeader
                              ? formatRupiah(parseFloat(cell.computed))
                              : cell.computed )
                            : cell.value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : isManager ? (
        <ManagerTable
          jobs={jobs}
          orderMap={orderMap}
          staffList={staffList}
          onEdit={setEditJob}
        />
      ) : (
        /* ── Kanban Staff ── */
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-140px)] animate-fade-in custom-scrollbar">
          {STAFF_COLUMNS.map((col) => {
            const colJobs = groupedByStatus[col.id] || [];
            return (
              <div key={col.id} className="flex-shrink-0 w-[280px] flex flex-col">
                <div
                  className={`flex items-center justify-between px-3 py-2 rounded-t-lg ${col.headerColor}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className="text-sm font-bold uppercase tracking-wide">{col.label}</span>
                  </div>
                  <span className="text-xs font-bold bg-white/60 px-2 py-0.5 rounded-full">
                    {colJobs.length}
                  </span>
                </div>
                <div
                  className={`flex-1 p-2 rounded-b-lg border-2 space-y-2 overflow-y-auto ${col.color}`}
                >
                  {colJobs.length === 0 ? (
                    <p className="text-center text-slate-400 text-xs py-6 italic">Tidak ada job</p>
                  ) : (
                    colJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        orderInfo={
                          orderMap[
                            typeof job.order_item === 'object' ? job.order_item?.id : job.order_item
                          ]
                        }
                        onOpenWorkspace={() => openWorkspace(job)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════
          MODALS
      ════════════════════════════════════════ */}

      {/* OTP Modals Removed */}

      <ForwardJobModal
        job={forwardJob}
        orderMap={orderMap}
        tahapList={tahapList}
        staffList={staffList}
        saving={saving}
        onSubmit={async (jobId, data) => {
          const result = await handleForward(jobId, data);
          if (result.ok) setForwardJob(null);
          else alert(result.error);
        }}
        onClose={() => setForwardJob(null)}
      />

      <EditJobModal
        job={editJob}
        orderMap={orderMap}
        tahapList={tahapList}
        staffList={staffList}
        saving={saving}
        isManager={isManager}
        onSubmit={async (jobId, formData) => {
          const result = await handleModalSave(jobId, formData, isManager);
          if (result.ok) setEditJob(null);
          else alert(result.error);
        }}
        onClose={() => setEditJob(null)}
      />

      {workspaceJob && (
        <WorkspaceModal
          workspaceJob={workspaceJob}
          saving={saving}
          onSubmit={async (data) => {
            if (data.statusPekerjaan === 'gagal') {
              setFailedReasonJob({
                job: workspaceJob.job,
                orderInfo: workspaceJob.orderItemData,
                pendingData: data,
              });
              setWorkspaceJob(null);
            } else {
              const result = await handleWorkspaceSave(data);
              if (result.ok) setWorkspaceJob(null);
              else alert(result.error);
            }
          }}
          onVerifySuccess={(job) => {
            setWorkspaceJob(null);
            setForwardJob(job);
          }}
          onClose={() => setWorkspaceJob(null)}
        />
      )}

      {queueStartJob && (
        <QueueStartModal
          job={queueStartJob.job}
          orderInfo={queueStartJob.orderInfo}
          onSubmit={() => handleStartJob(queueStartJob.job)}
          onClose={() => setQueueStartJob(null)}
        />
      )}

      {failedDetailJob && (
        <FailedDetailModal
          job={failedDetailJob.job}
          orderInfo={failedDetailJob.orderInfo}
          onClose={() => setFailedDetailJob(null)}
        />
      )}

      {failedReasonJob && (
        <FailedReasonModal
          job={failedReasonJob.job}
          orderInfo={failedReasonJob.orderInfo}
          onSubmit={handleSaveFailedReason}
          onClose={() => {
            setWorkspaceJob({
              job: failedReasonJob.job,
              orderItemData: failedReasonJob.orderInfo,
              fromStart: false,
            });
            setFailedReasonJob(null);
          }}
        />
      )}

      {workspaceReviewJob && (
        <WorkspaceReviewModal
          workspaceJob={workspaceReviewJob}
          onRevisi={handleRequestRevision}
          onClose={() => setWorkspaceReviewJob(null)}
        />
      )}
    </div>
  );
}
