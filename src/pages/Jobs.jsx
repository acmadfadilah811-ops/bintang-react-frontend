import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Kanban, Download } from 'lucide-react';

// ─── Hook & Komponen ──────────────────────────────────────
import { useJobsData } from '../components/jobs/useJobsData';
import { STAFF_COLUMNS } from '../components/jobs/jobConstants';
import JobCard from '../components/jobs/JobCard';
import ManagerTable from '../components/jobs/ManagerTable';
import EditJobModal from '../components/jobs/modals/EditJobModal';
import ForwardJobModal from '../components/jobs/modals/ForwardJobModal';
import WorkspaceModal from '../components/jobs/modals/WorkspaceModal';
import AdminOtpModal from '../components/jobs/modals/AdminOtpModal';
import StaffOtpModal from '../components/jobs/modals/StaffOtpModal';

export default function Jobs() {
  const { user } = useAuth();
  const isManager = ['owner', 'manager'].includes(user?.role);

  // ─── Data & Handlers dari custom hook ────────────────
  const {
    jobs,
    orderMap,
    loading,
    saving,
    error,
    tahapList,
    staffList,
    groupedByStatus,
    handleModalSave,
    handleForward,
    handleWorkspaceSave,
    handleExport,
  } = useJobsData(isManager);

  // ─── State Modal ─────────────────────────────────────
  const [editJob, setEditJob] = useState(null);
  const [forwardJob, setForwardJob] = useState(null);
  const [workspaceJob, setWorkspaceJob] = useState(null); // { job, orderItemData, fromStart }
  const [adminOtpModal, setAdminOtpModal] = useState(null); // { job, otpCode }
  const [staffOtpModal, setStaffOtpModal] = useState(null); // { job }

  // ─── OTP Generator ───────────────────────────────────
  const generateAdminOtp = (job) => {
    const otpCode = Math.floor(100000 + Math.random() * 900000);
    setAdminOtpModal({ job, otpCode });
  };

  // ─── Staff OTP verify → buka ForwardModal ────────────
  const handleStaffVerifyOtp = (job) => {
    setStaffOtpModal(null);
    setForwardJob(job);
  };

  // ─── Buka workspace ──────────────────────────────────
  const openWorkspace = (job, fromStart = false) => {
    const orderItemId = typeof job.order_item === 'object' ? job.order_item?.id : job.order_item;
    setWorkspaceJob({ job, orderItemData: orderMap[orderItemId], fromStart });
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
      <div className="h-full flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto text-center px-4">
        <div className="bg-red-100 p-6 rounded-full">
          <Kanban size={48} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">Akses Terkunci</h2>
        <p className="text-slate-600 font-medium">{error}</p>
        <button
          onClick={() => (window.location.href = isManager ? '/dashboard' : '/staff-dashboard')}
          className="mt-4 px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Ke Dashboard
        </button>
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
        {isManager && (
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-md px-2.5 py-1.5 text-[11px] font-bold hover:bg-emerald-100 shadow-sm"
          >
            <Download size={12} /> Export Excel
          </button>
        )}
      </div>

      {/* ── View berdasarkan role ── */}
      {isManager ? (
        <ManagerTable
          jobs={jobs}
          orderMap={orderMap}
          staffList={staffList}
          onGenerateOtp={generateAdminOtp}
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
                        onOpenWorkspace={(fromStart) => openWorkspace(job, fromStart)}
                        onEdit={() => setEditJob(job)}
                        onVerifyOtp={() => setStaffOtpModal({ job })}
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

      <AdminOtpModal
        modal={adminOtpModal}
        orderMap={orderMap}
        onClose={() => setAdminOtpModal(null)}
      />

      <StaffOtpModal
        modal={staffOtpModal}
        orderMap={orderMap}
        onSubmit={handleStaffVerifyOtp}
        onClose={() => setStaffOtpModal(null)}
      />

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
            const result = await handleWorkspaceSave(data);
            if (result.ok) setWorkspaceJob(null);
            else alert(result.error);
          }}
          onClose={() => setWorkspaceJob(null)}
        />
      )}
    </div>
  );
}
