/**
 * Helper tanggal berbasis waktu LOKAL.
 *
 * Jangan pakai `new Date().toISOString().split('T')[0]` untuk mendapatkan
 * "hari ini". toISOString() mengonversi ke UTC, sedangkan Indonesia ada di
 * UTC+7..+9. Akibatnya antara tengah malam sampai pagi, tanggalnya MUNDUR
 * SEHARI — dokumen bisa tercatat di tanggal yang salah, dan filter tanggal
 * bisa menyembunyikan data yang baru dibuat.
 *
 * Contoh: 16 Juli 2026 pukul 02:00 WIB -> toISOString() memberi "2026-07-15".
 */

/** Ubah objek Date jadi "YYYY-MM-DD" memakai tanggal lokal, bukan UTC. */
export const toISODate = (date) => {
  const bulan = String(date.getMonth() + 1).padStart(2, '0');
  const tanggal = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${bulan}-${tanggal}`;
};

/** "YYYY-MM-DD" untuk hari ini menurut waktu lokal pengguna. */
export const todayISO = () => toISODate(new Date());

/** "YYYY-01-01" untuk tahun berjalan — dipakai sebagai awal rentang filter. */
export const startOfYearISO = () => `${new Date().getFullYear()}-01-01`;

/**
 * "HH:MM:SS" untuk jam sekarang menurut waktu lokal — format yang diterima
 * <input type="time" step="1">.
 *
 * Alasan yang sama seperti di atas: getUTCHours()/toISOString() memberi jam UTC,
 * meleset 7 jam di WIB. Jam hitung fisik yang salah 7 jam lebih menyesatkan
 * daripada dikosongkan.
 */
export const nowTimeLocal = () => {
  const d = new Date();
  const jam = String(d.getHours()).padStart(2, '0');
  const menit = String(d.getMinutes()).padStart(2, '0');
  const detik = String(d.getSeconds()).padStart(2, '0');
  return `${jam}:${menit}:${detik}`;
};
