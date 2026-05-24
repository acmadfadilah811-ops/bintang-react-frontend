import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar'; // IMPORT TOPBAR
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import LockedScreen from './LockedScreen';

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const [statusTerkunci, setStatusTerkunci] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkStaffStatus = async () => {
    if (user?.role === 'staff') {
      try {
        setLoading(true);
        const res = await apiClient.get('/hr/dashboard/staff/');
        setStatusTerkunci(res.data.status_terkunci);
      } catch (err) {
        console.error('Gagal cek status staff', err);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStaffStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]); // Re-check on navigation

  // Jika staff dan terkunci atau sesi belum aktif
  const isLockedOut =
    user?.role === 'staff' &&
    statusTerkunci &&
    (!statusTerkunci.sesi_aktif || statusTerkunci.is_locked);

  if (loading) {
    return (
      <div className="flex h-screen bg-[#F4F7FE] items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isLockedOut) {
    return <LockedScreen statusTerkunci={statusTerkunci} onRefresh={checkStaffStatus} />;
  }

  return (
    <div className="flex h-screen bg-[#F4F7FE] overflow-hidden font-sans">
      {/* Sidebar tetap di kiri */}
      <Sidebar />

      {/* Kontainer utama akan otomatis mengisi sisa ruang */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Topbar Global (Baru) */}
        <Topbar />

        {/* Area Konten Utama */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth transition-all duration-300">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
