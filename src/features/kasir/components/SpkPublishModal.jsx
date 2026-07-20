import { useEffect, useMemo, useState } from 'react';
import { Factory, Loader2, X } from 'lucide-react';
import apiClient from '../../../api/apiClient';

/**
 * Modal penerbitan SPK produksi — dipakai bersama oleh alur order (Kasir >
 * Buat Order) dan terminal POS.
 *
 * Komponen ini hanya mengurus PEMILIHAN target (divisi/staff/tahap). Pemanggil
 * yang menentukan endpoint mana yang dipakai, karena keduanya berbeda:
 *   - order    : POST /orders/{id}/assign/
 *   - transaksi: POST /pos/sales/{id}/terbitkan-spk/
 * Bentuk payload-nya sengaja sama supaya keduanya tidak menyimpang.
 */
export default function SpkPublishModal({ judul, keterangan, onTerbitkan, onClose }) {
  const [divisiList, setDivisiList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [tahapList, setTahapList] = useState([]);

  const [tipe, setTipe] = useState('divisi'); // 'divisi' | 'staff'
  const [divisiId, setDivisiId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [tahapId, setTahapId] = useState('');

  const [memuat, setMemuat] = useState(true);
  const [mengirim, setMengirim] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let batal = false;
    (async () => {
      try {
        const [resDivisi, resStaff, resTahap] = await Promise.all([
          apiClient.get('/divisi/'),
          apiClient.get('/users/', { params: { role: 'staff' } }),
          apiClient.get('/tahap-proses/'),
        ]);
        if (batal) return;
        const divisi = resDivisi.data || [];
        setDivisiList(divisi);
        setStaffList(resStaff.data || []);
        setTahapList(resTahap.data || []);
        if (divisi.length) setDivisiId(String(divisi[0].id));
      } catch {
        if (!batal) setError('Gagal memuat daftar divisi dan staff.');
      } finally {
        if (!batal) setMemuat(false);
      }
    })();
    return () => { batal = true; };
  }, []);

  // Tahap dibatasi pada divisi terpilih; kalau kosong, backend memakai tahap
  // pertama divisi tersebut.
  const tahapTersedia = useMemo(() => {
    if (tipe !== 'divisi' || !divisiId) return [];
    return tahapList.filter((t) => String(t.divisi) === String(divisiId));
  }, [tahapList, tipe, divisiId]);

  useEffect(() => { setTahapId(''); }, [divisiId, tipe]);

  const bisaKirim = tipe === 'divisi' ? !!divisiId : !!staffId;

  const kirim = async () => {
    if (!bisaKirim || mengirim) return;
    setMengirim(true); setError('');
    const payload = tipe === 'staff' ? { staff_id: staffId } : { divisi_id: divisiId };
    if (tahapId) payload.tahap_id = tahapId;
    try {
      await onTerbitkan(payload);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menerbitkan SPK.');
      setMengirim(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 460, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Factory size={18} style={{ color: '#2783de' }} />
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{judul || 'Terbitkan SPK Produksi'}</h3>
          </div>
          <button type="button" onClick={onClose} style={{ border: 0, background: 'transparent', color: '#64748b', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '18px 22px' }}>
          {keterangan && <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#64748b', lineHeight: 1.55 }}>{keterangan}</p>}

          {memuat ? (
            <div style={{ padding: 28, textAlign: 'center', color: '#64748b', fontSize: 13 }}>Memuat divisi dan staff…</div>
          ) : (
            <div style={{ display: 'grid', gap: 13 }}>
              <label style={{ display: 'block' }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 5 }}>Tujukan SPK ke</span>
                <select value={tipe} onChange={(e) => setTipe(e.target.value)}
                  style={{ width: '100%', padding: 9, border: '1px solid #cbd5e1', borderRadius: 8 }}>
                  <option value="divisi">Divisi (antrean bersama)</option>
                  <option value="staff">Staff tertentu</option>
                </select>
              </label>

              {tipe === 'divisi' ? (
                <>
                  <label style={{ display: 'block' }}>
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 5 }}>Divisi</span>
                    <select value={divisiId} onChange={(e) => setDivisiId(e.target.value)}
                      style={{ width: '100%', padding: 9, border: '1px solid #cbd5e1', borderRadius: 8 }}>
                      {divisiList.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                      {!divisiList.length && <option value="">Belum ada divisi</option>}
                    </select>
                  </label>
                  <label style={{ display: 'block' }}>
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 5 }}>
                      Tahap <span style={{ fontWeight: 500, color: '#94a3b8' }}>(opsional)</span>
                    </span>
                    <select value={tahapId} onChange={(e) => setTahapId(e.target.value)}
                      style={{ width: '100%', padding: 9, border: '1px solid #cbd5e1', borderRadius: 8 }}>
                      <option value="">Tahap pertama divisi ini</option>
                      {tahapTersedia.map((t) => <option key={t.id} value={t.id}>{t.nama}</option>)}
                    </select>
                  </label>
                </>
              ) : (
                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 5 }}>Staff</span>
                  <select value={staffId} onChange={(e) => setStaffId(e.target.value)}
                    style={{ width: '100%', padding: 9, border: '1px solid #cbd5e1', borderRadius: 8 }}>
                    <option value="">Pilih staff…</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>{s.username} ({s.divisi_nama || 'tanpa divisi'})</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}

          {error && <div style={{ marginTop: 13, padding: 10, borderRadius: 8, background: '#fef2f2', color: '#b91c1c', fontSize: 12.5 }}>{error}</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, padding: '14px 22px', borderTop: '1px solid #f1f5f9' }}>
          <button type="button" onClick={onClose}
            style={{ padding: '9px 15px', border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Nanti saja
          </button>
          <button type="button" onClick={kirim} disabled={!bisaKirim || mengirim || memuat}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', border: 0, borderRadius: 8, background: bisaKirim && !mengirim ? '#2783de' : '#cbd5e1', color: '#fff', fontSize: 13, fontWeight: 700, cursor: bisaKirim && !mengirim ? 'pointer' : 'default' }}>
            {mengirim && <Loader2 size={14} className="animate-spin" />}
            {mengirim ? 'Menerbitkan…' : 'Terbitkan SPK'}
          </button>
        </div>
      </div>
    </div>
  );
}
