import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[AuthContext] init');
    try {
      const existingToken = authService.getToken();
      const existingUser = authService.getCurrentUser();
      if (existingToken && existingUser) {
        setToken(existingToken);
        setUser(existingUser);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[AuthContext] error parsing user', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      const { token: tk, user: usr } = await authService.login(username, password);
      // eslint-disable-next-line no-console
      console.log('[AuthContext] login success', usr);
      setToken(tk);
      setUser(usr);
      return { success: true };
    } catch (e) {
      const message = e.message || 'Đăng nhập thất bại';
      // eslint-disable-next-line no-console
      console.error('[AuthContext] login fail', message);
      setError(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    logout,
    authError: error,
    loading,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading && (
        <div style={{ padding: 24 }}>Đang khởi tạo phiên...</div>
      )}
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
