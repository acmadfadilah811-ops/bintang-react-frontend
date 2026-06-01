import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import LockedScreen from './LockedScreen';
import { LayoutDashboard, CalendarClock, ShoppingCart, Kanban, User } from 'lucide-react';

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [statusTerkunci, setStatusTerkunci] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileScreen, setIsMobileScreen] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/hr/status-karyawan/');
        const data = await response.json();
        setStatusTerkunci(data.status_terkunci);
      } catch (error) {
        console.error('Error checking lock status:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user && user.role?.toLowerCase() === 'staff') {
      checkStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (location.pathname.startsWith('/produksi')) {
    return <Outlet />;
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (statusTerkunci) {
    return <LockedScreen />;
  }

  const mobileMenuStaff = [
    { path: '/staff-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/jobs', label: 'Produksi', icon: Kanban },
    { path: '/profile', label: 'Profil', icon: User },
  ];

  const mobileMenuOwner = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/attendance', label: 'Absensi', icon: CalendarClock },
    { path: '/orders', label: 'Pesanan', icon: ShoppingCart },
    { path: '/jobs', label: 'Produksi', icon: Kanban },
    { path: '/profile', label: 'Profil', icon: User },
  ];

  const mobileMenu = user?.role?.toLowerCase() === 'staff' ? mobileMenuStaff : mobileMenuOwner;

  if (isMobileScreen) {
    return (
      <div className="h-screen w-full flex flex-col overflow-hidden bg-[#F4F7FE] relative">
        {/* Header / Topbar */}
        <div className="shrink-0 h-[72px] relative z-40 bg-white border-b border-slate-200">
          <Topbar />
        </div>

        {/* Konten Utama Layar HP */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-20 scroll-smooth bg-[#F4F7FE]">
          <Outlet />
        </div>

        {/* Bottom Navigation Bar */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-white/90 backdrop-blur-md border-t border-slate-200 flex items-center justify-around px-4 z-40">
          {mobileMenu.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 ${
                  isActive
                    ? 'text-blue-600 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'} />
                <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F4F7FE] flex h-screen overflow-hidden font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth transition-all duration-300">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
