// src/auth/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getMe } from "../api/auth.api";
import { getAccessToken, clearAuthTokens } from "../api/http";

type Ctx = { user: any | null; loading: boolean; setUser: (u:any|null)=>void; logout: ()=>void; };
const AuthCtx = createContext<Ctx>({ user: null, loading: true, setUser: () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any|null>(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const loc = useLocation();

  // hidratar sesión al montar
  useEffect(() => {
    const t = getAccessToken();
    if (!t) { setLoading(false); return; }
    (async () => {
      try { setUser(await getMe()); }
      catch { setUser(null); }
      finally { setLoading(false); }
    })();
  }, []);

  // escuchar 401 del interceptor y redirigir SPA
  useEffect(() => {
    function onUnauthorized() {
      clearAuthTokens();
      setUser(null);
      const next = encodeURIComponent(loc.pathname + loc.search);
      nav(`/login?next=${next}`, { replace: true });
    }
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, [loc.pathname, loc.search, nav]);

  function logout() {
    clearAuthTokens();
    setUser(null);
    nav("/login", { replace: true });
  }

  return <AuthCtx.Provider value={{ user, loading, setUser, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
