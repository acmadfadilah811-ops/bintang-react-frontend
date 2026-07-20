import { Routes, Route, Navigate } from 'react-router-dom';
import KasirTopbar from '../components/KasirTopbar';
import { KasirProvider } from '../context/KasirContext';
import PosTerminal from './PosTerminal';
import PosHistory from './PosHistory';
import PosShift from './PosShift';
import PosShiftSummary from './PosShiftSummary';
import WaSettings from './WaSettings';
import WaOrderQueue from '../components/WaOrderQueue';
import KasirDashboard from './KasirDashboard';
import ProductListPage from './ProductListPage';
import CreateOrderPage from './CreateOrderPage';
import PesananPage from './PesananPage';

export default function KasirApp() {
  return (
    <KasirProvider>
      <div className="flex flex-col h-full min-h-0 bg-[#F4F7FE] w-full overflow-hidden">
        <KasirTopbar />
        <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
          <Routes>
            <Route path="dashboard" element={<KasirDashboard />} />
            <Route path="terminal" element={<PosTerminal />} />
            <Route path="buat-order" element={<Navigate to="/kasir/terminal" replace />} />
            <Route path="produk" element={<ProductListPage />} />
            <Route path="pesanan" element={<PesananPage />} />
            <Route path="antrean-wa" element={<WaOrderQueue />} />
            <Route path="riwayat" element={<PosHistory />} />
            <Route path="shift" element={<PosShift />} />
            <Route path="ringkasan-shift-v2" element={<PosShiftSummary />} />
            <Route path="pengaturan-wa" element={<WaSettings />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </KasirProvider>
  );
}
