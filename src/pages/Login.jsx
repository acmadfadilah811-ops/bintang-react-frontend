import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { User, Lock, AlertTriangle } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // 1. Ambil token JWT & data user
      const res = await apiClient.post('/auth/login/', { username, password });
      const { access, refresh, user: userData } = res.data;

      // 2. Simpan token sementara
      localStorage.setItem('access_token', access);

      // 3. Simpan ke context
      login(userData, access, refresh);
      
      // 4. Redirect sesuai role
      if (userData?.role?.toLowerCase() === 'staff') {
        navigate('/staff-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Username atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gray-100">
      
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1629904853716-f0bc54eea481?q=80&w=2070&auto=format&fit=crop")',
          filter: 'brightness(0.6)'
        }}
      ></div>

      {/* Login Card Wrapper */}
      <div className="relative z-10 w-full max-w-[500px] p-4">
        
        {/* Card */}
        <div className="bg-white border-0 shadow-2xl rounded-xl p-6 lg:p-10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-[1.75rem] font-bold text-gray-900 mb-1">Bintang Advertising</h1>
            <p className="text-sm text-gray-500">Sign in to Management System</p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Pesan Error */}
            {error && (
              <div className="bg-red-600 text-white text-sm p-2 mb-4 rounded flex items-center justify-center gap-2">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Input Username */}
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-bold text-gray-500 mb-2">
                Username
              </label>
              <div className="flex rounded bg-gray-100 border border-gray-200 overflow-hidden focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400">
                <div className="flex items-center justify-center pl-3 pr-2 text-gray-500">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1 bg-transparent py-2.5 px-2 outline-none text-gray-700 placeholder-gray-400 text-sm"
                  placeholder="Masukkan username"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-bold text-gray-500 mb-2">
                Password
              </label>
              <div className="flex rounded bg-gray-100 border border-gray-200 overflow-hidden focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400">
                <div className="flex items-center justify-center pl-3 pr-2 text-gray-500">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent py-2.5 px-2 outline-none text-gray-700 placeholder-gray-400 text-sm"
                  placeholder="Masukkan password"
                  required
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center mb-6">
              <input 
                type="checkbox" 
                id="remember" 
                className="h-4 w-4 rounded border-gray-300 text-gray-800 focus:ring-gray-800" 
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-500">
                Remember me
              </label>
            </div>

            {/* Tombol Submit */}
            <div className="grid">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1f2937] hover:bg-gray-800 text-white font-bold py-2.5 rounded transition-colors disabled:opacity-50"
              >
                {loading ? 'Memuat...' : 'Sign In'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}