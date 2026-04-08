import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService } from "../lib/services.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "token";
const USER_KEY = "user";

function getStoredAuth() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (token && userStr) {
      const user = JSON.parse(userStr);
      return { token, user };
    }
  } catch (e) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  return { token: null, user: null };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const setAuth = useCallback((newToken, newUser) => {
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }
    if (newUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      setUser(newUser);
    } else {
      localStorage.removeItem(USER_KEY);
      setUser(null);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login({ email, password });
    const u = res.user;
    setAuth(res.token, { id: u.id, email: u.email, name: u.name, role: u.role });
    return res;
  }, [setAuth]);

  const register = useCallback(async (data) => {
    const res = await authService.register(data);
    const u = res.user;
    setAuth(res.token, { id: u.id, email: u.email, name: u.name, role: u.role });
    return res;
  }, [setAuth]);

  const logout = useCallback(() => {
    setAuth(null, null);
  }, [setAuth]);

  useEffect(() => {
    const { token: t, user: u } = getStoredAuth();
    if (!t || !u) {
      setLoading(false);
      return;
    }
    setToken(t);
    setUser(u);
    authService
      .getMe()
      .then((res) => {
        if (res.user) setUser(res.user);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
