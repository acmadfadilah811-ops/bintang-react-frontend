import { useState, useEffect, useMemo } from 'react';
import apiClient from '../../api/apiClient';
import { STAFF_COLUMNS } from './jobConstants';
import { playSuccess } from '../../utils/notificationSounds';

/**
 * useJobsData — Custom hook untuk semua state & handler di halaman Jobs.
 * Memisahkan logika dari tampilan agar Jobs.jsx tetap bersih.
 */
export function useJobsData() {
  const [jobs, setJobs] = useState([]);
  const [orderMap, setOrderMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const [tahapList, setTahapList] = useState([]);
  const [staffList, setStaffList] = useState([]);

  const playNotificationSound = (filename) => {
    // Legacy fallback wrapper — routes to Web Audio API utility
    if (filename === 'selesai.mp3') playSuccess();
  };

  // ─── Fetch utama ──────────────────────────────────────
  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [jobsRes, ordersRes] = await Promise.allSettled([
        apiClient.get('/jobs/'),
        apiClient.get('/orders/'),
      ]);

      if (jobsRes.status === 'fulfilled') {
        // Handle both paginated and non-paginated responses
        const rawJobs = Array.isArray(jobsRes.value.data)
          ? jobsRes.value.data
          : (jobsRes.value.data?.results ?? []);
        setJobs(rawJobs);
        setError(null);
      } else {
        console.error('Gagal memuat data jobs:', jobsRes.reason);
        if (jobsRes.reason?.response?.status === 403) {
          setError(
            'Akses ditolak. Anda harus absen (Clock-In) terlebih dahulu untuk membuka Pekerjaan.'
          );
        }
      }

      if (ordersRes.status === 'fulfilled') {
        const raw = Array.isArray(ordersRes.value.data)
          ? ordersRes.value.data
          : (ordersRes.value.data?.results ?? []);
        const map = {};
        raw.forEach((order) => {
          order.items?.forEach((item) => {
            map[item.id] = {
              orderItemId: item.id,
              orderId: order.id,
              jenisProduk: item.jenis_produk,
              customerName: order.nama,
              nomorWa: order.nomor_wa,
              keterangan: item.detail || '',
              keteranganDetail: item.keterangan_detail || '',
              catatanPelanggan: order.catatan_pelanggan || '',
              fileLink: item.gdrive_customer_link || '',
              panjang: item.panjang || 0,
              lebar: item.lebar || 0,
              qty: item.qty || 1,
              hargaJual: item.harga_jual || 0,
            };
          });
        });
        setOrderMap(map);
      }
    } catch (err) {
      console.error('Gagal memuat data jobs:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // ✅ FIX: Add isMounted cleanup to prevent setState on unmounted component
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (!isMounted) return;
      await fetchData();

      if (!isMounted) return;
      try {
        const [tahapRes, staffRes] = await Promise.allSettled([
          apiClient.get('/tahap-proses/'),
          apiClient.get('/users/'),
        ]);
        if (!isMounted) return;
        if (tahapRes.status === 'fulfilled') {
          const rawTahap = Array.isArray(tahapRes.value.data)
            ? tahapRes.value.data
            : (tahapRes.value.data?.results ?? []);
          setTahapList(rawTahap);
        }
        if (staffRes.status === 'fulfilled') {
          const rawStaff = Array.isArray(staffRes.value.data)
            ? staffRes.value.data
            : (staffRes.value.data?.results ?? []);
          setStaffList(rawStaff.filter((u) => u.role === 'staff'));
        }
      } catch { /* silently ignore */ }
    };

    init();
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Grouping untuk kanban staff ──────────────────────
  const groupedByStatus = useMemo(() => {
    const groups = {};
    STAFF_COLUMNS.forEach((col) => {
      groups[col.id] = [];
    });
    jobs.forEach((job) => {
      if (groups[job.status_pekerjaan] !== undefined) {
        groups[job.status_pekerjaan].push(job);
      }
    });
    return groups;
  }, [jobs]);

  // ─── Handler Edit Job (Fix: sekarang kirim tahap juga) ─
  const handleModalSave = async (jobId, formData, isManager) => {
    setSaving(true);
    const payload = {
      status_pekerjaan: formData.status_pekerjaan,
      insentif: parseInt(formData.insentif || 0),
    };
    // FIX: Sertakan tahap jika diubah (hanya manager)
    if (isManager && formData.tahap) {
      payload.tahap = parseInt(formData.tahap) || null;
    }
    if (isManager && formData.pic_staff !== undefined) {
      payload.pic_staff = formData.pic_staff || null;
    }
    try {
      await apiClient.patch(`/jobs/${jobId}/`, payload);
      if (payload.status_pekerjaan === 'selesai') playNotificationSound('selesai.mp3');
      await fetchData(true);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Gagal menyimpan perubahan.' };
    } finally {
      setSaving(false);
    }
  };

  // ─── Handler Forward Job ──────────────────────────────
  const handleForward = async (jobId, formData) => {
    setSaving(true);
    const payload = { aksi: formData.aksi };
    if (formData.aksi === 'forward') {
      payload.tahap_id = parseInt(formData.tahap_id);
      if (formData.pic_staff_id) payload.pic_staff_id = parseInt(formData.pic_staff_id);
    }
    try {
      await apiClient.post(`/jobs/${jobId}/forward/`, payload);
      await fetchData(true);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Gagal meneruskan job.' };
    } finally {
      setSaving(false);
    }
  };

  // ─── Handler Workspace Save ───────────────────────────
  const handleWorkspaceSave = async ({
    jobId,
    tableRows,
    materialUsage,
    driveLink,
    hargaJualBaru,
    hargaLama,
    orderItemId,
    statusPekerjaan,
    alasanGagal,
    fromStart,
  }) => {
    setSaving(true);
    try {
      // 1. Kurangi stok bahan jika ada
      const validMats = materialUsage.filter(
        (m) => m.item_id && parseFloat(String(m.qty).replace(',', '.')) > 0
      );
      if (validMats.length > 0) {
        const matPayload = validMats.map((m) => ({
          item_id: m.item_id,
          qty: parseFloat(String(m.qty).replace(',', '.')),
          catatan: m.catatan || '',
        }));
        await apiClient.post(`/jobs/${jobId}/use-materials/`, { materials: matPayload });
      }

      // 2. Simpan catatan & link drive
      const jobPayload = {
        catatan_staff: tableRows,
        gdrive_output_link: driveLink || '',
        status_pekerjaan: statusPekerjaan,
      };
      if (alasanGagal) jobPayload.alasan_gagal = alasanGagal;
      if (fromStart) jobPayload.status_pekerjaan = 'dikerjakan';
      await apiClient.patch(`/jobs/${jobId}/`, jobPayload);

      // 3. Update harga jika berubah
      if (hargaJualBaru && parseInt(hargaJualBaru) !== hargaLama) {
        await apiClient.patch(`/order-items/${orderItemId}/`, {
          harga_jual: parseInt(hargaJualBaru),
        });
      }

      if (jobPayload.status_pekerjaan === 'selesai') playNotificationSound('selesai.mp3');

      await fetchData(true);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Gagal menyimpan workspace.' };
    } finally {
      setSaving(false);
    }
  };

  // ─── Export Excel ─────────────────────────────────────
  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const response = await apiClient.get('/export/jobs/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'jobs.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Gagal mengekspor data.');
    } finally {
      setExporting(false);
    }
  };

  return {
    jobs,
    orderMap,
    loading,
    saving,
    exporting,
    error,
    tahapList,
    staffList,
    groupedByStatus,
    fetchData,
    handleModalSave,
    handleForward,
    handleWorkspaceSave,
    handleExport,
  };
}
