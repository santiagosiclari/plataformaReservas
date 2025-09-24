// src/auth/RequireAuth.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  // Mientras el contexto está verificando el token
  if (loading) {
    return <div style={{ padding: 16 }}>Cargando sesión…</div>;
  }

  // Si terminó de cargar y no hay usuario → redirige a login
  if (!user) {
    const next = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  // Usuario autenticado → renderiza los hijos
  return <>{children}</>;
}
