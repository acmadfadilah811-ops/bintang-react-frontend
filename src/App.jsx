import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';

import { DynamicIslandProvider } from './context/DynamicIslandContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Employees from './pages/Employees';
import Payroll from './pages/Payroll';
import Attendance from './pages/Attendance';
import BukuBesar from './pages/BukuBesar';
import Announcements from './pages/Announcements';
import Pricelist from './pages/Pricelist';
import Divisi from './pages/Divisi';
import Reports from './pages/Reports';
import Komplain from './pages/Komplain';
import { useAuth } from './context/AuthContext';
import ProductionApp from './pages/produksi/ProductionApp';
import WhatsAppChat from './pages/WhatsAppChat';
import UploadDesain from './pages/UploadDesain';
import ProductInventoryApp from './pages/productInventory/ProductInventoryApp';

let globalAlertTrigger = null;

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
  const [customAlert, setCustomAlert] = useState({
    open: false,
    message: '',
    type: 'info',
  });

  // Safe window.alert override with unmount cleanup
  useEffect(() => {
    const originalAlert = window.alert;

    globalAlertTrigger = (message) => {
      let type = 'info';
      const msgLower = String(message || '').toLowerCase();
      if (
        msgLower.includes('gagal') ||
        msgLower.includes('error') ||
        msgLower.includes('salah') ||
        msgLower.includes('tidak valid') ||
        msgLower.includes('kosong')
      ) {
        type = 'error';
      } else if (
        msgLower.includes('berhasil') ||
        msgLower.includes('sukses') ||
        msgLower.includes('selesai') ||
        msgLower.includes('terkirim') ||
        msgLower.includes('cocok')
      ) {
        type = 'success';
      }
      setCustomAlert({
        open: true,
        message: String(message || ''),
        type,
      });
    };

    window.alert = (message) => {
      if (globalAlertTrigger) {
        globalAlertTrigger(message);
      } else {
        originalAlert(message);
      }
    };

    return () => {
      window.alert = originalAlert; // Restore original alert on unmount
      globalAlertTrigger = null;
    };
  }, []);

  return (
    <AuthProvider>
      <DynamicIslandProvider>
        <BrowserRouter>
          <Routes>
            {/* Halaman publik */}
            <Route path="/login" element={<Login />} />
            <Route path="/public/upload-desain" element={<UploadDesain />} />
            <Route path="/public/upload-desain/:orderId" element={<UploadDesain />} />

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
                <Route path="/jobs" element={<Navigate to="/produksi" replace />} />
                <Route path="/produksi/*" element={<ProductionApp />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/product-inventory/*" element={<ProductInventoryApp />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/whatsapp-chat" element={<WhatsAppChat />} />
                <Route path="/komplain" element={<Komplain />} />

                {/* Tim */}
                <Route path="/customers" element={<Customers />} />
                <Route path="/users" element={<Employees />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/payroll" element={<Payroll />} />
                <Route path="/divisi" element={<Divisi />} />

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

      {/* Premium Enterprise Custom Alert Modal */}
      {customAlert.open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 relative flex flex-col items-center text-center transform scale-100 transition-all duration-300 shadow-indigo-500/10">
            {/* Close Button */}
            <button
              onClick={() => setCustomAlert((prev) => ({ ...prev, open: false }))}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Icon */}
            <div
              className={`p-4 rounded-full mb-4 ${
                customAlert.type === 'success'
                  ? 'bg-emerald-50 text-emerald-500'
                  : customAlert.type === 'error'
                    ? 'bg-rose-50 text-rose-500'
                    : 'bg-indigo-50 text-indigo-500'
              }`}
            >
              {customAlert.type === 'success' && <CheckCircle size={32} />}
              {customAlert.type === 'error' && <AlertCircle size={32} />}
              {customAlert.type === 'info' && <Info size={32} />}
            </div>

            {/* Title */}
            <h3 className="text-base font-extrabold text-slate-900 mb-2">
              {customAlert.type === 'success'
                ? 'Berhasil'
                : customAlert.type === 'error'
                  ? 'Pemberitahuan Sistem'
                  : 'Informasi'}
            </h3>

            {/* Message */}
            <p className="text-slate-600 text-xs font-semibold leading-relaxed mb-5 max-h-40 overflow-y-auto px-1 w-full whitespace-pre-wrap">
              {customAlert.message}
            </p>

            {/* Action Button */}
            <button
              onClick={() => setCustomAlert((prev) => ({ ...prev, open: false }))}
              className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all transform active:scale-95 cursor-pointer ${
                customAlert.type === 'success'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/20'
                  : customAlert.type === 'error'
                    ? 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 shadow-rose-500/20'
                    : 'bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 shadow-indigo-500/20'
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </AuthProvider>
  );
}

export default App;
