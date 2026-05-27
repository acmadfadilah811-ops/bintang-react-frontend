import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasMenuAccess, getFeatureIdByPath } from '../utils/permissions';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <p className="text-slate-400">Memuat...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role?.toLowerCase() || 'staff';
  const fid = getFeatureIdByPath(location.pathname);

  // Cek otorisasi menu
  if (fid && !hasMenuAccess(userRole, fid)) {
    // Selalu izinkan akses ke halaman profile
    if (location.pathname !== '/profile') {
      const redirectPath = userRole === 'staff' ? '/staff-dashboard' : '/dashboard';
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <Outlet />;
}
