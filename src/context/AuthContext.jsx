import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cek apakah ada token tersimpan saat pertama buka
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user_data');
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Ambil data terbaru dari server di background agar foto dll selalu sinkron
      fetch(`${apiBase}/users/me/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setUser(data);
          localStorage.setItem('user_data', JSON.stringify(data));
        }
      })
      .catch(err => console.error("Gagal sinkronisasi data user:", err));
    }
    setLoading(false);
  }, []);

  const login = (userData, accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user_data', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    setUser(null);
  };

  const updateUser = (newData) => {
    const updatedUser = { ...user, ...newData };
    localStorage.setItem('user_data', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook agar mudah dipanggil di komponen manapun
export function useAuth() {
  return useContext(AuthContext);
}
