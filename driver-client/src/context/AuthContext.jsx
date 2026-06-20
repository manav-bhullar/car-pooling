import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login, register, logout } from '../api/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      getMe()
        .then((userData) => {
          if (userData.role !== 'DRIVER') {
            throw new Error('Unauthorized role');
          }
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (credentials) => {
    const data = await login(credentials);
    if (data.user.role !== 'DRIVER') {
      throw new Error('Only drivers can login here');
    }
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    return data;
  };

  const handleRegister = async (userData) => {
    // Force role to DRIVER for driver app
    const driverData = { ...userData, role: 'DRIVER' };
    const data = await register(driverData);
    return data;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login: handleLogin, register: handleRegister, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
