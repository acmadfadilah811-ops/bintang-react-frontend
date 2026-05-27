/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [businessSettings, setBusinessSettings] = useState({
    nama_bisnis: 'Brandy',
    no_telepon: '',
    alamat: '',
    logo_url: '',
    deskripsi: '',
  });
  const [loading, setLoading] = useState(true);

  const fetchBusinessSettings = async (token) => {
    const apiBase = import.meta.env.VITE_API_URL || 'https://bintang-adv.duckdns.org/api';
    try {
      const res = await fetch(`${apiBase}/business-settings/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data && data.nama_bisnis) {
        setBusinessSettings(data);
        localStorage.setItem('business_settings', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Gagal sinkronisasi data bisnis:', err);
    }
  };

  useEffect(() => {
    // Cek apakah ada token tersimpan saat pertama buka
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user_data');
    const savedSettings = localStorage.getItem('business_settings');

    if (savedSettings) {
      try {
        setBusinessSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Gagal parsing saved business settings:', e);
      }
    }

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      const apiBase = import.meta.env.VITE_API_URL || 'https://bintang-adv.duckdns.org/api';
      
      // Ambil data terbaru dari server di background agar foto dll selalu sinkron
      fetch(`${apiBase}/users/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.id) {
            setUser(data);
            localStorage.setItem('user_data', JSON.stringify(data));
          }
        })
        .catch((err) => console.error('Gagal sinkronisasi data user:', err));

      // Ambil juga data bisnis terbaru
      fetchBusinessSettings(token);
    }
    setLoading(false);
  }, []);

  const login = (userData, accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user_data', JSON.stringify(userData));
    setUser(userData);
    fetchBusinessSettings(accessToken);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('business_settings');
    setUser(null);
    setBusinessSettings({
      nama_bisnis: 'Brandy',
      no_telepon: '',
      alamat: '',
      logo_url: '',
      deskripsi: '',
    });
  };

  const updateUser = (newData) => {
    const updatedUser = { ...user, ...newData };
    localStorage.setItem('user_data', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const updateBusinessSettings = (newSettings) => {
    const updated = { ...businessSettings, ...newSettings };
    localStorage.setItem('business_settings', JSON.stringify(updated));
    setBusinessSettings(updated);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, businessSettings, updateBusinessSettings, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook agar mudah dipanggil di komponen manapun
export function useAuth() {
  return useContext(AuthContext);
}

