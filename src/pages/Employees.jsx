import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import { User, Briefcase, Phone, MapPin, Clock, CalendarDays } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/id";

dayjs.extend(relativeTime);
dayjs.locale('id');

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/users/");
      setEmployees(res.data);
    } catch (err) {
      console.error("Gagal memuat data karyawan:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium">Memuat data karyawan...</p>
        </div>
      </div>
    );
  }

  const getAvatarUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `http://127.0.0.1:8000${url}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Karyawan</h1>
        <p className="text-sm text-slate-500 mt-1">Pantau seluruh staf, profil, dan histori login mereka.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {employees.map((emp) => (
          <div key={emp.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
            {/* Header / Cover Area */}
            <div className="h-16 bg-slate-100 relative border-b border-slate-200"></div>
            
            {/* Avatar & Basic Info */}
            <div className="px-4 pb-4 flex-1 flex flex-col items-center -mt-8 relative z-10">
              <div className="w-16 h-16 bg-white rounded-full p-1 shadow-sm mb-2">
                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-100">
                  {emp.foto_profil ? (
                    <img src={getAvatarUrl(emp.foto_profil)} alt={emp.username} className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} className="text-slate-400" />
                  )}
                </div>
              </div>
              
              <h3 className="text-base font-bold text-slate-900 capitalize">{emp.username}</h3>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-1 capitalize border border-indigo-100">
                <Briefcase size={10} />
                {emp.role} {emp.divisi_nama ? `— ${emp.divisi_nama}` : ''}
              </div>
            </div>

            {/* Detailed Info */}
            <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-2 flex-1">
              {/* Kontak */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Phone size={12} className="text-slate-400 shrink-0" />
                  <span className="truncate">{emp.no_hp || <span className="text-slate-400 italic">Belum diset</span>}</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <MapPin size={12} className="text-slate-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-2 leading-tight">
                    {emp.alamat || emp.kota ? `${emp.alamat || ''} ${emp.kota ? `(${emp.kota})` : ''}` : <span className="text-slate-400 italic">Belum diset</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer / Login History */}
            <div className="border-t border-slate-100 p-3 bg-white grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-400 flex items-center gap-1 font-medium"><CalendarDays size={10} /> Bergabung</span>
                <span className="text-slate-700 font-semibold">{emp.date_joined ? dayjs(emp.date_joined).format('DD MMM YYYY') : '-'}</span>
              </div>
              <div className="flex flex-col gap-0.5 border-l border-slate-100 pl-3">
                <span className="text-slate-400 flex items-center gap-1 font-medium"><Clock size={12} /> Terakhir Aktif</span>
                <span className="text-slate-700 font-semibold">{emp.last_login ? dayjs(emp.last_login).fromNow() : <span className="text-amber-500">Belum pernah</span>}</span>
              </div>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
