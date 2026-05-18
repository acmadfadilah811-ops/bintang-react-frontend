import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StaffDashboard from './pages/StaffDashboard';
import Orders from './pages/Orders';
import Jobs from './pages/Jobs';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Employees from './pages/Employees';
import { useAuth } from './context/AuthContext';

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role?.toLowerCase() === 'staff') return <Navigate to="/staff-dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Halaman publik */}
          <Route path="/login" element={<Login />} />

          {/* Halaman yang butuh login */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/staff-dashboard" element={<StaffDashboard />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
