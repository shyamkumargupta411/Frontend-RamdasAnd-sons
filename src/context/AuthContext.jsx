import { createContext, useCallback, useEffect, useMemo, useState } from "react";

import { authApi } from "../api/authApi";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "../utils/constants";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem(ACCESS_TOKEN_KEY) || null
  );
  const [user, setUser] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const setSession = useCallback(({ access, refresh, user: nextUser = null }) => {
    if (access) {
      localStorage.setItem(ACCESS_TOKEN_KEY, access);
      setAccessToken(access);
    }
    if (refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    }
    if (nextUser) {
      setUser(nextUser);
    }
  }, []);

  const logout = useCallback(() => {
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAccessToken(null);
    setUser(null);
    if (refresh) {
      authApi.logout(refresh).catch(() => {});
    }
  }, []);

  // Bootstrap: if a token exists, resolve the profile (refresh interceptor
  // handles expired access tokens).
  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        setBootstrapped(true);
        return;
      }
      try {
        const profile = await authApi.me();
        if (!cancelled) setUser(profile);
      } catch {
        if (!cancelled) {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.addEventListener("metalinv:unauthorized", logout);
    return () => window.removeEventListener("metalinv:unauthorized", logout);
  }, [logout]);

  const value = useMemo(
    () => ({
      accessToken,
      user,
      bootstrapped,
      isAuthenticated: Boolean(accessToken) && Boolean(user),
      setSession,
      setUser,
      logout,
    }),
    [accessToken, user, bootstrapped, setSession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
