import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

const TOKEN_KEY   = 'rs_access_token';
const REFRESH_KEY = 'rs_refresh_token';
const USER_KEY    = 'rs_user';

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });
  const [loading, setLoading]   = useState(false);
  const [initDone, setInitDone] = useState(false);

  // Rehydrate session on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && !user) {
      authService.getMe()
        .then(({ data }) => {
          setUser(data.data);
          localStorage.setItem(USER_KEY, JSON.stringify(data.data));
        })
        .catch(() => clearSession())
        .finally(() => setInitDone(true));
    } else {
      setInitDone(true);
    }
  }, []); // eslint-disable-line

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await authService.login(email, password);
      const { user: u, token, refreshToken } = data.data;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(REFRESH_KEY, refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      setUser(u);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    clearSession();
  }, [clearSession]);

  const updateUser = useCallback((updated) => {
    setUser(updated);
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
  }, []);

  const isAuthenticated = Boolean(user && localStorage.getItem(TOKEN_KEY));

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      initDone,
      isAuthenticated,
      login,
      logout,
      updateUser,
      clearSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
