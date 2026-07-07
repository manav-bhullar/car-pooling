import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  getMe, 
  verifyEmail, 
  resendOtp 
} from '../api/auth';
import { apiClient } from '../api/apiClient';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  const setAuthData = (userData, accessToken, refreshToken) => {
    setUser(userData);
    setIsAuthenticated(true);
    setIsVerified(userData.isVerified);
    apiClient.setAccessToken(accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  };

  const clearAuthData = () => {
    setUser(null);
    setIsAuthenticated(false);
    setIsVerified(false);
    apiClient.setAccessToken(null);
    localStorage.removeItem('refreshToken');
  };

  // Set up API client error handler to log out user automatically if refresh fails
  useEffect(() => {
    apiClient.setAuthErrorHandler(() => {
      clearAuthData();
    });
  }, []);

  // Check auth state on mount using the refresh token
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { accessToken, refreshToken } = await apiClient.refreshToken();
        if (accessToken) {
          const userData = await getMe();
          if (mounted) {
            setAuthData(userData, accessToken, refreshToken);
          }
        }
      } catch (err) {
        // Silent fail, user just needs to login
        if (mounted) clearAuthData();
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setAuthData(data.user, data.accessToken, data.refreshToken);
    return data;
  };

  const register = async (userData) => {
    return await registerUser(userData);
  };

  const verify = async (email, otp) => {
    const data = await verifyEmail(email, otp);
    setAuthData(data.user, data.accessToken, data.refreshToken);
    return data;
  };

  const resendVerification = async (email) => {
    return await resendOtp(email);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout failed on backend:', err);
    } finally {
      clearAuthData();
    }
  };

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    isVerified,
    loading,
    login,
    register,
    verify,
    resendVerification,
    logout,
  }), [user, isAuthenticated, isVerified, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
