import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DynamicIslandProvider } from './context/DynamicIslandContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import Orders from './pages/Orders';
import Jobs from './pages/Jobs';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import BukuBesar from './pages/BukuBesar';
import Announcements from './pages/Announcements';
import Pricelist from './pages/Pricelist';
import Reports from './pages/Reports';
import { useAuth } from './context/AuthContext';

// Halaman placeholder untuk route yang belum ada halamannya
const PageNotReady = ({ name }) => (
  <div className="flex items-center justify-center h-64 text-gray-500 flex-col gap-2">
    <p className="text-lg font-bold">🚧 {name}</p>
    <p className="text-xs">Halaman ini sedang dalam pengembangan.</p>
  </div>
);

function HomeRedirect() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();
  if (role === 'staff') return <Navigate to="/staff-dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

// Komponen routing dashboard berdasarkan role
function DashboardRouter() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();
  if (role === 'admin') return <AdminDashboard />;
  return <Dashboard />;
}

function App() {
  // Global Click Sound Effect
  useEffect(() => {
    const clickSoundUrl = import.meta.env.VITE_CLICK_SOUND_URL;

    // Helper untuk memutar suara klik sintetis (Web Audio API)
    const playSyntheticClick = () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // Hz
        oscillator.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.05); // 50ms

        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // Volume lembut
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05); // Fade out cepat

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.05);
      } catch (err) {
        console.warn('Gagal memutar audio sintetis:', err);
      }
    };

    let audioFile = null;
    if (clickSoundUrl) {
      audioFile = new Audio(clickSoundUrl);
      audioFile.volume = 0.15;
    }

    const handleGlobalClick = (e) => {
      const target = e.target.closest('button, a, [role="button"]');
      if (target) {
        if (audioFile) {
          audioFile.currentTime = 0;
          audioFile.play().catch(() => {
            playSyntheticClick();
          });
        } else {
          playSyntheticClick();
        }
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <AuthProvider>
      <DynamicIslandProvider>
        <BrowserRouter>
          <Routes>
            {/* Halaman publik */}
            <Route path="/login" element={<Login />} />

            {/* Halaman yang butuh login */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                {/* Redirect root ke dashboard sesuai role */}
                <Route path="/" element={<HomeRedirect />} />

                {/* Dashboard */}
                <Route path="/dashboard" element={<DashboardRouter />} />
                <Route path="/staff-dashboard" element={<StaffDashboard />} />

                {/* Operasional */}
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/create" element={<Orders />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/attendance" element={<Attendance />} />

                {/* Tim */}
                <Route path="/customers" element={<Customers />} />
                <Route path="/users" element={<Employees />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/divisi" element={<PageNotReady name="Divisi & Jadwal" />} />

                {/* Laporan & Lainnya */}
                <Route path="/buku-besar" element={<BukuBesar />} />
                <Route path="/pricelist" element={<Pricelist />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </DynamicIslandProvider>
    </AuthProvider>
  );
}

export default App;
