import { useState, useEffect } from 'react';
import { useTransaksiCrumb } from '../../transaksi/components/TransaksiContext';
import DiskonPenjualanTab from '../components/DiskonPenjualanTab';
import KuponDiskonTab from '../components/KuponDiskonTab';
import PromosiPosTab from '../components/PromosiPosTab';

const TABS = [
  { id: 'diskon', label: 'Diskon Penjualan' },
  { id: 'kupon', label: 'Kupon Diskon' },
  { id: 'promosi', label: 'Promosi (POS)' },
];

export default function VoucherDiskon() {
  const [tab, setTab] = useState('diskon');
  const { setSubtitle } = useTransaksiCrumb();

  useEffect(() => {
    setSubtitle('Voucher & Diskon');
  }, [setSubtitle]);

  return (
    <div className="flex flex-col flex-1 min-h-full bg-white">
      <div className="flex border-b border-slate-200 bg-white shrink-0">
        {TABS.map((t) => {
          const isActive = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 px-4 py-4 text-sm font-semibold text-center whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'text-blue-600 bg-blue-50/70 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/40'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 p-6">
        {tab === 'diskon' && <DiskonPenjualanTab />}
        {tab === 'kupon' && <KuponDiskonTab />}
        {tab === 'promosi' && <PromosiPosTab />}
      </div>
    </div>
  );
}
