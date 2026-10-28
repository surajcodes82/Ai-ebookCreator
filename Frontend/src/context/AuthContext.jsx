import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getToken, setToken, setUnauthorizedHandler } from '../lib/api';
import * as authService from '../services/auth.service';
import * as usersService from '../services/users.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // A 401 from any protected call drops the session; ProtectedRoute then redirects.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken('');
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!getToken()) {
        if (active) setInitializing(false);
        return;
      }
      try {
        const data = await authService.me();
        if (active) setUser(data.user);
      } catch {
        setToken('');
        if (active) setUser(null);
      } finally {
        if (active) setInitializing(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setToken('');
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const data = await usersService.updateProfile(payload);
    setUser(data.user);
    return data.user;
  }, []);

  const refreshUser = useCallback(async () => {
    const data = await authService.me();
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({ user, initializing, login, register, logout, updateProfile, refreshUser, setUser }),
    [user, initializing, login, register, logout, updateProfile, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
