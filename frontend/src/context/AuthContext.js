import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(null);
  // FIX 8: loading starts true — remains true until the localStorage
  // hydration effect has run. This prevents the Protected route from
  // flashing a redirect to /login before the stored token is read.
  const [loading, setLoading] = useState(true);

  // ── Hydrate from localStorage on mount ─────────────────────────────────────
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('sl_token');
      const savedUser  = localStorage.getItem('sl_user');

      if (savedToken && savedUser) {
        const parsedUser = JSON.parse(savedUser);
        // FIX 9: Set BOTH state values before setting loading=false so that
        // isAuthenticated (!!token) is true on the very first render after
        // hydration, preventing the Protected component from redirecting away.
        setToken(savedToken);
        setUser(parsedUser);
      }
    } catch {
      // Corrupt localStorage data — clear it
      localStorage.removeItem('sl_token');
      localStorage.removeItem('sl_user');
    } finally {
      // Always mark loading complete, even if nothing was restored
      setLoading(false);
    }
  }, []);

  // ── login: called after successful API response ─────────────────────────────
  // FIX 10: Persist BOTH token and user before any navigation happens.
  // Previously the race between setState and navigate could leave the
  // Protected route seeing isAuthenticated=false for one render cycle.
  const login = useCallback((userData, authToken) => {
    localStorage.setItem('sl_token', authToken);
    localStorage.setItem('sl_user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  }, []);

  // ── logout: wipe state + storage ────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('sl_token');
    localStorage.removeItem('sl_user');
    setToken(null);
    setUser(null);
  }, []);

  // ── updateUser: merge partial updates (e.g. balance after transfer) ─────────
  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('sl_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    // FIX 11: isAuthenticated is derived from BOTH token and user being set,
    // not just token. This prevents a brief authenticated flash if token
    // exists but user object failed to parse.
    isAuthenticated: !!token && !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};
