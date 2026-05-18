import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar tetap di kiri */}
      <Sidebar />
      
      {/* Kontainer utama akan otomatis mengisi sisa ruang saat sidebar menutup */}
      <main className="flex-1 overflow-y-auto p-6 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}