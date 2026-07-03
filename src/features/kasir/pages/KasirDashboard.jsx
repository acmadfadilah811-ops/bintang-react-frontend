import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  ShoppingCart,
  MessageCircle,
  Package,
  Wallet,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useKasir } from '../context/KasirContext';
import apiClient from '../../../api/apiClient';

export default function KasirDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shiftAktif } = useKasir();

  const [waCount, setWaCount] = useState(0);
  const [todayStats, setTodayStats] = useState({ count: 0, total: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const resWa = await apiClient.get('/orders/', {
          params: { status_global: 'review', sumber: 'wa' },
        });
        setWaCount((resWa.data || []).length);
      } catch (err) {
        console.error('Gagal memuat antrean WA:', err);
      }
      try {
        const today = new Date().toISOString().slice(0, 10);
        const resSales = await apiClient.get('/pos/sales/', { params: { tanggal: today } });
        const list = resSales.data || [];
        const total = list.reduce((s, t) => s + Number(t.total || 0), 0);
        setTodayStats({ count: list.length, total });
      } catch {
        // Endpoint transaksi POS mungkin belum tersedia — tampilkan 0.
        setTodayStats({ count: 0, total: 0 });
      }
    };
    load();
  }, []);

  const formatCurrency = (v) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

  const todayLabel = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const metrics = [
    {
      label: 'Status Shift',
      value: shiftAktif ? 'Aktif' : 'Belum Dibuka',
      sub: shiftAktif ? `Kas awal ${formatCurrency(shiftAktif.kas_awal)}` : 'Buka shift dulu untuk transaksi',
      icon: Wallet,
      tone: shiftAktif ? 'emerald' : 'rose',
    },
    {
      label: 'Pesanan WA Menunggu',
      value: String(waCount),
      sub: 'Perlu diverifikasi kasir',
      icon: MessageCircle,
      tone: 'indigo',
    },
    {
      label: 'Transaksi Hari Ini',
      value: String(todayStats.count),
      sub: todayLabel,
      icon: TrendingUp,
      tone: 'blue',
    },
    {
      label: 'Penjualan Hari Ini',
      value: formatCurrency(todayStats.total),
      sub: 'Total omzet shift berjalan',
      icon: CreditCard,
      tone: 'emerald',
    },
  ];

  const toneMap = {
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  const actions = [
    { label: 'Buka Terminal Kasir', desc: 'Proses penjualan & pembayaran', icon: CreditCard, path: '/kasir/terminal', color: 'indigo' },
    { label: 'Buat Order', desc: 'Input pesanan pelanggan manual', icon: ShoppingCart, path: '/kasir/buat-order', color: 'emerald' },
    { label: 'Antrean WA', desc: 'Verifikasi pesanan dari bot', icon: MessageCircle, path: '/kasir/antrean-wa', color: 'rose', badge: waCount },
    { label: 'Daftar Produk', desc: 'Lihat katalog & stok', icon: Package, path: '/kasir/produk', color: 'blue' },
  ];

  const actionColor = {
    indigo: 'hover:border-indigo-300 group-hover:bg-indigo-600',
    emerald: 'hover:border-emerald-300 group-hover:bg-emerald-600',
    rose: 'hover:border-rose-300 group-hover:bg-rose-600',
    blue: 'hover:border-blue-300 group-hover:bg-blue-600',
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#F4F7FE]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-black text-slate-800">Halo, {user?.username || 'Kasir'} 👋</h1>
        <p className="text-xs font-semibold text-slate-500 mt-0.5">{todayLabel}</p>
      </div>

      {/* Shift warning */}
      {!shiftAktif && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">Shift belum dibuka</h4>
              <p className="text-xs text-slate-500 font-semibold">Buka shift kasir dulu sebelum memproses transaksi.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/kasir/shift')}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Buka Shift
          </button>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{m.label}</span>
                <span className={`p-2 rounded-xl ${toneMap[m.tone]}`}>
                  <Icon size={16} />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-800 leading-none">{m.value}</div>
              <p className="text-[11px] font-semibold text-slate-400 mt-1.5">{m.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <h2 className="text-sm font-extrabold text-slate-700 mb-3 flex items-center gap-2">
        <Clock size={16} className="text-slate-400" /> Aksi Cepat
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.path}
              onClick={() => navigate(a.path)}
              className={`group bg-white rounded-2xl border border-slate-200 p-4 text-left shadow-sm transition-all hover:shadow-lg cursor-pointer relative ${actionColor[a.color]}`}
            >
              {a.badge > 0 && (
                <span className="absolute top-3 right-3 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-black">
                  {a.badge}
                </span>
              )}
              <span className="inline-flex p-2.5 rounded-xl bg-slate-100 text-slate-600 mb-3 transition-all group-hover:text-white">
                <Icon size={20} />
              </span>
              <h3 className="font-extrabold text-slate-800 text-sm">{a.label}</h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{a.desc}</p>
              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 mt-3 group-hover:text-slate-600">
                Buka <ArrowRight size={12} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
