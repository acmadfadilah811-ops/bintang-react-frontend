import { useState, useEffect } from 'react';
import apiClient from '../../../api/apiClient';
import OrderHeader from './OrderHeader';
import CustomerCard from './CustomerCard';
import ShippingCard from './ShippingCard';
import PaymentCard from './PaymentCard';
import OrderLogSection from './OrderLogSection';
import { parseOrderMetadata, serializeOrderMetadata } from './metadataHelper';
import CancelledOrderDetail from './CancelledOrderDetail';

export default function OrderDetail({ orderId, onBack, onSaved }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState({});

  const fetchOrderDetail = async () => {
    try {
      const res = await apiClient.get(`/orders/${orderId}/`);
      const data = res.data;
      setOrder(data);
      // Parse the metadata JSON block stored in catatan_pelanggan
      const parsedMeta = parseOrderMetadata(data.catatan_pelanggan);
      setMetadata(parsedMeta);
    } catch (err) {
      console.error(err);
      alert('Gagal memuat detail pesanan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const handleUpdate = async ({ nama, nomor_wa, status_global, dp_dibayar, waktu, metadata: newMetadata }) => {
    if (!order) return;
    try {
      const payload = {};
      if (nama !== undefined) payload.nama = nama;
      if (nomor_wa !== undefined) payload.nomor_wa = nomor_wa;
      if (status_global !== undefined) payload.status_global = status_global;
      if (dp_dibayar !== undefined) payload.dp_dibayar = dp_dibayar;
      if (waktu !== undefined) payload.waktu = waktu;

      // If metadata is updated, serialize it into catatan_pelanggan
      if (newMetadata !== undefined) {
        // Keep the actual text notes separate from serialized metadata
        const serialized = serializeOrderMetadata(newMetadata, newMetadata.catatan);
        payload.catatan_pelanggan = serialized;
      }

      const res = await apiClient.patch(`/orders/${orderId}/`, payload);
      const data = res.data;
      setOrder(data);
      
      const parsedMeta = parseOrderMetadata(data.catatan_pelanggan);
      setMetadata(parsedMeta);
      onSaved?.();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memperbarui data pesanan.');
    }
  };

  const handleTogglePayment = async (toBePaid) => {
    if (!order) return;
    const dp = toBePaid ? (order.total_harga || 10000) : 0;
    await handleUpdate({ dp_dibayar: dp });
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) return;
    await handleUpdate({ status_global: 'batal' });
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs font-bold text-slate-400">
        Memuat detail pesanan...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center text-xs font-bold text-rose-500">
        Pesanan tidak ditemukan.
      </div>
    );
  }

  const items = order.items || [];

  if (order.status_global === 'batal') {
    return (
      <CancelledOrderDetail
        order={order}
        metadata={metadata}
        onBack={onBack}
        onUpdateStatus={(status) => handleUpdate({ status_global: status })}
        onTogglePayment={handleTogglePayment}
        onUpdateDate={(dateStr) => handleUpdate({ waktu: dateStr })}
        items={items}
      />
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5 animate-fade-in text-slate-700">
      {/* 1. Header Section */}
      <OrderHeader
        order={order}
        metadata={metadata}
        onBack={onBack}
        onUpdateStatus={(status) => handleUpdate({ status_global: status })}
        onTogglePayment={handleTogglePayment}
        onUpdateDate={(dateStr) => handleUpdate({ waktu: dateStr })}
      />

      {/* 2. Customer and shipping destination cards */}
      <CustomerCard
        order={order}
        metadata={metadata}
        onSave={handleUpdate}
        readOnly={order.status_global === 'batal'}
      />

      {/* 3. Shipping Status and Dropship cards */}
      <ShippingCard
        metadata={metadata}
        onSave={handleUpdate}
        readOnly={order.status_global === 'batal'}
      />

      {/* 4. Products list section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="border-b border-slate-100 pb-2.5 mb-3">
          <span className="text-xs font-bold text-slate-800">Produk Pesanan</span>
        </div>
        
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="py-2.5">Produk</th>
                  <th className="py-2.5 text-center">Jumlah</th>
                  <th className="py-2.5 text-right">Harga Satuan</th>
                  <th className="py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3">
                      <span className="font-bold text-slate-800 block">{item.nama_produk || 'Produk Custom'}</span>
                      {item.catatan && <span className="text-[10px] text-slate-400 block mt-0.5">{item.catatan}</span>}
                    </td>
                    <td className="py-3 text-center font-semibold">{item.jumlah || 1} pcs</td>
                    <td className="py-3 text-right font-mono">Rp {(item.harga_satuan || 0).toLocaleString('id-ID')}</td>
                    <td className="py-3 text-right font-mono font-bold text-slate-800">
                      Rp {((item.jumlah || 1) * (item.harga_satuan || 0)).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-center py-4">
            <div className="mb-3 text-slate-300">
              <span className="text-6xl select-none">🐻‍❄️</span>
            </div>
            <span className="text-xs font-bold text-slate-700 block">Tidak ada pesanan</span>
          </div>
        )}
      </div>

      {/* 5. Payments and notes cards */}
      <PaymentCard
        metadata={metadata}
        onSave={handleUpdate}
        readOnly={order.status_global === 'batal'}
      />

      {/* 6. Logs & Attachments */}
      <OrderLogSection
        order={order}
        metadata={metadata}
        onSave={handleUpdate}
        onCancelOrder={handleCancelOrder}
        readOnly={order.status_global === 'batal'}
      />
    </div>
  );
}
