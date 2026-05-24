import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import {
  Plus,
  X,
  Users,
  AlertTriangle,
  Shield,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Settings2,
  Lock,
} from 'lucide-react';

// ─── Helper ───────────────────────────────────────────────
function formatWaktu(dateStr) {
  if (!dateStr) return '–';
  try {
    return new Date(dateStr).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

const ROLE_STYLE = {
  owner: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  staff: 'bg-slate-100 text-slate-600',
};

// ─── TABS ─────────────────────────────────────────────────
const TABS = [
  { id: 'karyawan', label: 'Karyawan', icon: Users },
  { id: 'keamanan', label: 'Keamanan', icon: Shield },
];

export default function Settings() {
  const { user } = useAuth();
  const isOwner = user?.role?.toLowerCase() === 'owner';
  const canManageUsers = ['owner', 'manager'].includes(user?.role?.toLowerCase());

  const [activeTab, setActiveTab] = useState('karyawan');

  // ── Tab Karyawan ──
  const [employees, setEmployees] = useState([]);
  const [empLoading, setEmpLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'staff',
    no_hp: '',
  });

  // ── Tab Keamanan (Owner only) ──
  const [sessions, setSessions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [secLoading, setSecLoading] = useState(false);
  const [secToast, setSecToast] = useState(null);



  const fetchEmployees = async () => {
    setEmpLoading(true);
    try {
      const res = await apiClient.get('/users/');
      setEmployees(res.data);
    } catch {
      /* silent */
    } finally {
      setEmpLoading(false);
    }
  };

  const fetchSecurity = async () => {
    setSecLoading(true);
    try {
      const [sessRes, auditRes] = await Promise.allSettled([
        apiClient.get('/security/sessions/'),
        apiClient.get('/security/audit-log/'),
      ]);
      if (sessRes.status === 'fulfilled') setSessions(sessRes.value.data || []);
      if (auditRes.status === 'fulfilled') setAuditLogs((auditRes.value.data || []).slice(0, 20));
    } catch {
      /* silent */
    } finally {
      setSecLoading(false);
    }
  };

  // ── Fetch on tab change ─────────────────────────────────
  useEffect(() => {
    if (activeTab === 'karyawan') fetchEmployees();
    if (activeTab === 'keamanan' && isOwner) fetchSecurity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  // ── Create user ─────────────────────────────────────────
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    try {
      await apiClient.post('/auth/create-user/', formData);
      setFormSuccess('Karyawan berhasil ditambahkan!');
      setIsModalOpen(false);
      setFormData({ username: '', password: '', role: 'staff', no_hp: '' });
      fetchEmployees();
    } catch (err) {
      setFormError(
        err.response?.status === 403
          ? 'Anda tidak memiliki izin untuk membuat akun.'
          : 'Gagal membuat akun. Pastikan username belum digunakan.'
      );
    } finally {
      setFormLoading(false);
    }
  };

  // ── Revoke session ──────────────────────────────────────
  const revokeSession = async (sessionId) => {
    try {
      await apiClient.delete(`/security/sessions/${sessionId}/`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      showSecToast('success', 'Sesi berhasil dicabut.');
    } catch {
      showSecToast('error', 'Gagal mencabut sesi.');
    }
  };

  const showSecToast = (type, msg) => {
    setSecToast({ type, msg });
    setTimeout(() => setSecToast(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-2 pb-12 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Settings2 size={22} className="text-indigo-600" />
            Pengaturan
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola karyawan dan keamanan sistem.</p>
        </div>

        {activeTab === 'karyawan' && canManageUsers && (
          <button
            onClick={() => {
              setIsModalOpen(true);
              setFormError('');
              setFormSuccess('');
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold
              bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm
              hover:shadow-md hover:-translate-y-px active:translate-y-0"
          >
            <Plus size={16} /> Tambah Karyawan
          </button>
        )}
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.filter((t) => t.id !== 'keamanan' || isOwner).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${
                  active
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════
          TAB 1: KARYAWAN
      ══════════════════════════════════════════════════ */}
      {activeTab === 'karyawan' && (
        <div style={{ animation: 'revealUp 0.4s ease both' }}>
          {formSuccess && (
            <div
              className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200
              text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl"
            >
              <CheckCircle2 size={15} /> {formSuccess}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header info */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Users size={16} className="text-indigo-600" />
              <h3 className="font-semibold text-slate-800">Daftar Karyawan</h3>
              <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium ml-1">
                {employees.length} orang
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[560px]">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Username</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">No HP</th>
                    <th className="px-6 py-3">Divisi</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {empLoading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm">Memuat data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : employees.length > 0 ? (
                    employees.map((emp) => (
                      <tr
                        key={emp.id}
                        className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-slate-400 font-mono">#{emp.id}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                          {emp.username}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize
                            ${ROLE_STYLE[emp.role] || ROLE_STYLE.staff}`}
                          >
                            {emp.role || 'staff'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{emp.no_hp || '–'}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {emp.divisi_nama || '–'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Aktif
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-400">
                        Belum ada data karyawan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB 2: KEAMANAN (Owner only)
      ══════════════════════════════════════════════════ */}
      {activeTab === 'keamanan' && (
        <div className="space-y-6" style={{ animation: 'revealUp 0.4s ease both' }}>
          {!isOwner ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Lock size={40} className="mb-3 opacity-40" />
              <p className="font-medium">Akses dibatasi untuk Owner.</p>
            </div>
          ) : (
            <>
              {/* Toast */}
              {secToast && (
                <div
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border
                  ${
                    secToast.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {secToast.type === 'success' ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <AlertCircle size={15} />
                  )}
                  {secToast.msg}
                </div>
              )}

              {/* ── Sesi Aktif ── */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <Monitor size={16} className="text-indigo-600" />
                  <h3 className="font-semibold text-slate-800">Sesi Login Aktif</h3>
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium ml-1">
                    {sessions.filter((s) => s.is_active && !s.is_expired).length} aktif
                  </span>
                </div>

                {secLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-center py-10 text-sm text-slate-400">Tidak ada sesi aktif.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {sessions
                      .filter((s) => s.is_active)
                      .map((sess) => (
                        <div
                          key={sess.id}
                          className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                              <Monitor size={16} className="text-indigo-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">
                                {sess.username}
                                {sess.device_name && (
                                  <span className="font-normal text-slate-500">
                                    {' '}
                                    — {sess.device_name}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-400">
                                IP: {sess.ip_address || '–'} · Login: {formatWaktu(sess.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {!sess.is_expired ? (
                              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                                Aktif
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                                Kedaluwarsa
                              </span>
                            )}
                            <button
                              onClick={() => revokeSession(sess.id)}
                              title="Cabut Sesi"
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50
                              rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* ── Audit Log ── */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <Shield size={16} className="text-indigo-600" />
                  <h3 className="font-semibold text-slate-800">Log Keamanan</h3>
                  <span className="text-xs text-slate-400 ml-1">20 terbaru</span>
                </div>

                {secLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : auditLogs.length === 0 ? (
                  <p className="text-center py-10 text-sm text-slate-400">
                    Belum ada log keamanan.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="px-6 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                      >
                        {log.berhasil ? (
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        ) : (
                          <AlertCircle size={14} className="text-red-400 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-slate-700">
                            {log.username}
                          </span>
                          <span className="mx-2 text-slate-300">·</span>
                          <span className="text-xs text-slate-500">
                            {log.event?.replace(/_/g, ' ')}
                          </span>
                          {log.keterangan && (
                            <span className="ml-2 text-xs text-slate-400 truncate hidden md:inline">
                              — {log.keterangan}
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-slate-400">{formatWaktu(log.waktu)}</p>
                          {log.ip_address && (
                            <p className="text-xs text-slate-300">{log.ip_address}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MODAL: Tambah Karyawan
      ══════════════════════════════════════════════════ */}
      {isModalOpen && canManageUsers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden
            animate-[revealUp_0.25s_ease]"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Users size={15} className="text-indigo-600" />
                </div>
                <h2 className="font-bold text-slate-800">Buat Akun Karyawan Baru</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {formError && (
                <div
                  className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center
                  gap-2 border border-red-100"
                >
                  <AlertTriangle size={15} /> {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="contoh: budi_desain"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm
                    bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-400
                    focus:border-indigo-400 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min. 8 karakter"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm
                    bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-400
                    focus:border-indigo-400 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">No HP (Opsional)</label>
                <input
                  type="text"
                  value={formData.no_hp}
                  onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                  placeholder="0812..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm
                    bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-400
                    focus:border-indigo-400 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm
                    bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-400
                    focus:border-indigo-400 outline-none transition-all appearance-none"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  {user?.role?.toLowerCase() === 'owner' && <option value="owner">Owner</option>}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300
                    hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold
                    bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all
                    disabled:opacity-60 min-w-[120px] justify-center"
                >
                  {formLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{' '}
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Akun'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes revealUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
