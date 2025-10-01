// src/auth/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { getMe, logout as apiLogout } from "../api/auth.api";
import { getAccessToken } from "../api/http";

type User = { id: number; email: string; name?: string; role?: string };
type AuthState = { user: User | null; loading: boolean };
type Ctx = AuthState & {
  setUser: (u: User | null) => void;
  logout: () => void;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const me = await getMe();            // 200 -> usuario
        if (!cancelled) setState({ user: me, loading: false });
      } catch {
        if (!cancelled) setState({ user: null, loading: false }); // ← importante
      }
    })();

    // si usás token en localStorage, escuchá cambios (logout en otra pestaña, etc.)
    const onStorage = () => {
      setState((s) => ({ ...s, loading: true }));
      const hasToken = !!getAccessToken();
      if (!hasToken) {
        setState({ user: null, loading: false });
        return;
      }
      getMe().then(
        (me) => setState({ user: me, loading: false }),
        () => setState({ user: null, loading: false })
      );
    };
    window.addEventListener("storage", onStorage);

    return () => { cancelled = true; window.removeEventListener("storage", onStorage); };
  }, []);

  const setUser = (u: User | null) => setState({ user: u, loading: false });
  const logout = () => {
    apiLogout();
    setState({ user: null, loading: false });
  };
  return <AuthCtx.Provider value={{ ...state, setUser, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
