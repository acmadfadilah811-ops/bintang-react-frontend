import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { Plus, X, Users, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'staff',
    no_hp: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get('/users/'); 
      setEmployees(res.data);
    } catch (err) {
      console.error("Gagal memuat data karyawan", err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/create-user/', formData);
      alert('Karyawan berhasil ditambahkan!');
      setIsModalOpen(false);
      setFormData({ username: '', password: '', role: 'staff', no_hp: '' });
      fetchEmployees(); 
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Anda tidak memiliki izin untuk membuat akun.');
      } else {
        setError('Gagal membuat akun. Pastikan username belum digunakan.');
      }
    } finally {
      setLoading(false);
    }
  };

  const canManageUsers = ['owner', 'manager'].includes(user?.role?.toLowerCase());

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users size={24} /> Pengaturan Karyawan
          </h1>
          <p className="text-sm text-gray-500">Kelola data dan akses akun karyawan.</p>
        </div>

        {canManageUsers && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#1f2937] hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors"
          >
            <Plus size={18} /> Tambah Karyawan
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
              <th className="p-4 font-semibold">ID</th>
              <th className="p-4 font-semibold">Username</th>
              <th className="p-4 font-semibold">Role</th>
              <th className="p-4 font-semibold">No HP</th>
              <th className="p-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.length > 0 ? (
              employees.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 text-sm text-gray-700">#{emp.id}</td>
                  <td className="p-4 text-sm font-medium text-gray-900">{emp.username}</td>
                  <td className="p-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize
                      ${emp.role === 'owner' ? 'bg-purple-100 text-purple-700' : 
                        emp.role === 'manager' ? 'bg-blue-100 text-blue-700' : 
                        'bg-gray-100 text-gray-700'}`}
                    >
                      {emp.role || 'Staff'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{emp.no_hp || '-'}</td>
                  <td className="p-4 text-sm text-green-600 font-medium flex items-center gap-1">
                     <span className="w-2 h-2 rounded-full bg-green-500"></span> Aktif
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-8 text-center text-sm text-gray-500">
                  Memuat data karyawan...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && canManageUsers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-gray-800">Buat Akun Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 border border-red-100">
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input 
                  type="text" 
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-colors"
                  placeholder="Masukkan username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-colors"
                  placeholder="Masukkan password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No HP (Opsional)</label>
                <input 
                  type="text" 
                  value={formData.no_hp}
                  onChange={(e) => setFormData({...formData, no_hp: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-colors"
                  placeholder="Contoh: 0812..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-colors"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  {user?.role?.toLowerCase() === 'owner' && <option value="owner">Owner</option>}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#1f2937] hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}