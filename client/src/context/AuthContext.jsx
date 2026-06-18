import { createContext, useContext, useEffect, useState } from 'react';
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  getMe, 
  verifyEmail, 
  resendOtp 
} from '../api/auth';
import { apiClient } from '../api/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  const setAuthData = (userData, accessToken) => {
    setUser(userData);
    setIsAuthenticated(true);
    setIsVerified(userData.isVerified);
    apiClient.setAccessToken(accessToken);
  };

  const clearAuthData = () => {
    setUser(null);
    setIsAuthenticated(false);
    setIsVerified(false);
    apiClient.setAccessToken(null);
  };

  // Set up API client error handler to log out user automatically if refresh fails
  useEffect(() => {
    apiClient.setAuthErrorHandler(() => {
      clearAuthData();
    });
  }, []);

  // Check auth state on mount using the refresh token cookie
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const accessToken = await apiClient.refreshToken();
        if (accessToken) {
          const userData = await getMe();
          if (mounted) {
            setAuthData(userData, accessToken);
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
    setAuthData(data.user, data.accessToken);
    return data;
  };

  const register = async (userData) => {
    return await registerUser(userData);
  };

  const verify = async (email, otp) => {
    const data = await verifyEmail(email, otp);
    setAuthData(data.user, data.accessToken);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isVerified,
        loading,
        login,
        register,
        verify,
        resendVerification,
        logout,
      }}
    >
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
