// 5 Kategori Akun Utama & Rincian Fitur Akses
export const MENU_FEATURES = [
  { id: 'dashboard', label: 'Dashboard Utama', path: '/' },
  { id: 'staff-dashboard', label: 'Dashboard Staff', path: '/staff-dashboard' },
  { id: 'orders', label: 'Pesanan (Orders)', path: '/orders' },
  { id: 'jobs', label: 'Papan Produksi (Jobs)', path: '/jobs' },
  { id: 'customers', label: 'Pelanggan (Customers)', path: '/customers' },
  { id: 'attendance', label: 'Absensi (Attendance)', path: '/attendance' },
  { id: 'employees', label: 'Karyawan (Employees)', path: '/employees' },
  { id: 'announcements', label: 'Pengumuman (Announcements)', path: '/announcements' },
  { id: 'reports', label: 'Laporan Kerja (Reports)', path: '/reports' },
  { id: 'inventory', label: 'Inventori (Inventory)', path: '/inventory' },
  { id: 'buku-besar', label: 'Buku Besar (Ledger)', path: '/buku-besar' },
  { id: 'pricelist', label: 'Daftar Harga (Pricelist)', path: '/pricelist' },
  { id: 'settings', label: 'Pengaturan (Settings)', path: '/settings' },
];

export const DEFAULT_PERMISSIONS = {
  owner: [
    'dashboard',
    'orders',
    'jobs',
    'customers',
    'attendance',
    'employees',
    'announcements',
    'reports',
    'inventory',
    'buku-besar',
    'pricelist',
    'settings',
  ],
  manager: [
    'dashboard',
    'orders',
    'jobs',
    'customers',
    'attendance',
    'employees',
    'announcements',
    'reports',
    'inventory',
    'buku-besar',
    'pricelist',
    'settings',
  ],
  admin: [
    'dashboard',
    'orders',
    'jobs',
    'customers',
    'inventory',
    'buku-besar',
    'pricelist',
    'settings',
  ],
  staff: ['staff-dashboard', 'jobs'],
};

// Perizinan yang WAJIB dimiliki dan tidak bisa dihapus per-role
const LOCKED_PERMISSIONS = {
  admin: ['dashboard', 'settings'],
  manager: ['dashboard'],
  staff: ['staff-dashboard'],
};

// Mendapatkan hak akses saat ini, dengan jaminan LOCKED_PERMISSIONS selalu ada
export function getPermissions() {
  const saved = localStorage.getItem('brandy_menu_permissions');
  let base = { ...DEFAULT_PERMISSIONS };

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Override base dengan data kustom yang tersimpan per-role
      Object.keys(parsed).forEach((role) => {
        if (Array.isArray(parsed[role])) {
          base[role] = parsed[role];
        }
      });
    } catch (e) {
      console.error('Gagal mem-parse perizinan menu:', e);
    }
  }

  // Jamin perizinan yang terkunci (LOCKED) selalu ada, tidak peduli isi localStorage
  Object.entries(LOCKED_PERMISSIONS).forEach(([role, lockedIds]) => {
    if (base[role]) {
      const existing = base[role];
      lockedIds.forEach((id) => {
        if (!existing.includes(id)) {
          base[role] = [id, ...existing];
        }
      });
    }
  });

  return base;
}

// Menyimpan perizinan ke localStorage, dengan jaminan locked permissions tidak hilang
export function savePermissions(permissions) {
  // Mulai dari DEFAULT sebagai fondasi agar tidak ada role yang hilang sama sekali
  const toSave = { ...DEFAULT_PERMISSIONS, ...permissions };

  // Paksa locked permissions tetap ada
  Object.entries(LOCKED_PERMISSIONS).forEach(([role, lockedIds]) => {
    if (toSave[role]) {
      lockedIds.forEach((id) => {
        if (!toSave[role].includes(id)) {
          toSave[role] = [id, ...toSave[role]];
        }
      });
    }
  });

  localStorage.setItem('brandy_menu_permissions', JSON.stringify(toSave));
  return toSave;
}

// Memeriksa apakah role tertentu memiliki akses ke menu terpilih
export function hasMenuAccess(role, featureId) {
  if (!role) return false;
  const currentRole = role.toLowerCase();

  // Owner memiliki akses penuh tanpa kecuali
  if (currentRole === 'owner') return true;

  // Cek locked permissions terlebih dahulu
  if (LOCKED_PERMISSIONS[currentRole]?.includes(featureId)) return true;

  const permissions = getPermissions();
  const rolePermissions = permissions[currentRole] || DEFAULT_PERMISSIONS[currentRole] || [];
  return rolePermissions.includes(featureId);
}

// Memetakan URL path ke ID fitur untuk proteksi rute
export function getFeatureIdByPath(path) {
  if (path === '/') return 'dashboard';
  const match = MENU_FEATURES.find((f) => f.path !== '/' && path.startsWith(f.path));
  return match ? match.id : null;
}
