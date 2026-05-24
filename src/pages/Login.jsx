import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { User, Lock, AlertTriangle } from 'lucide-react';
import loginBg from '../assets/login_bg.jpg';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/login/', { username, password });
      const { access, refresh, user: userData } = res.data;

      localStorage.setItem('access_token', access);
      login(userData, access, refresh);

      if (userData?.role?.toLowerCase() === 'staff') {
        navigate('/staff-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch {
      setError('Username atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-black font-sans">
      {/* Background Image (Gambar Gedung Perusahaan - Lokal) */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${loginBg})`,
          filter: 'brightness(0.35) contrast(1.1)', // Dibuat agak gelap agar form login tetap menonjol
        }}
      ></div>

      {/* Efek Cahaya Biru Menyala di belakang form */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[300px] h-[150px] bg-cyan-400/50 blur-[80px] z-0 rounded-full pointer-events-none"></div>

      {/* Form Container (Tanpa Background Card) */}
      <div className="relative z-10 w-full max-w-[450px] p-6 flex flex-col gap-6 mt-10">
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          {/* Pesan Error */}
          {error && (
            <div className="bg-red-600/90 text-white text-sm p-3 rounded flex items-center justify-center gap-2 shadow-lg">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Username Input (Gaya Terbelah) */}
          <div className="flex h-[55px] shadow-lg">
            <div className="w-[60px] h-full bg-[#4a5568]/90 flex items-center justify-center text-white">
              <User size={28} strokeWidth={2} />
            </div>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 h-full bg-white/30 backdrop-blur-md px-4 outline-none text-white placeholder-white/90 text-lg font-medium"
              placeholder="Username"
              required
              autoFocus
            />
          </div>

          {/* Password Input (Gaya Terbelah) */}
          <div className="flex h-[55px] shadow-lg">
            <div className="w-[60px] h-full bg-[#4a5568]/90 flex items-center justify-center text-white">
              <Lock size={28} strokeWidth={2} />
            </div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 h-full bg-white/30 backdrop-blur-md px-4 outline-none text-white placeholder-white/90 text-xl font-medium tracking-widest"
              placeholder="********"
              required
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-white mt-1">
            {/* Custom Checkbox Remember Me */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                className={`w-[22px] h-[22px] border-2 border-white rounded-[4px] flex items-center justify-center transition-colors ${remember ? 'bg-white/30' : 'bg-transparent'}`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                {remember && <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>}
              </div>
              <span className="text-[15px] font-normal tracking-wide text-white group-hover:text-gray-200 shadow-black drop-shadow-md">
                Remember me
              </span>
            </label>

            {/* Forgot Password */}
            <a href="#" className="flex items-center gap-3 group">
              <div className="w-[22px] h-[22px] border-2 border-white rounded-[4px] bg-transparent flex items-center justify-center"></div>
              <span className="text-[15px] font-normal tracking-wide text-white group-hover:text-gray-200 shadow-black drop-shadow-md">
                Forgot Password?
              </span>
            </a>
          </div>

          {/* Tombol LOG IN Merah Terang */}
          <div className="grid mt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ea3143] hover:bg-red-700 text-white font-normal h-[55px] transition-colors disabled:opacity-50 text-[22px] shadow-lg shadow-red-900/30"
            >
              {loading ? 'Memuat...' : 'LOG IN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
