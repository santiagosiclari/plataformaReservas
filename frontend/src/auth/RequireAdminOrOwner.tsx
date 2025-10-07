// auth/RequireAdminOrOwner.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAdminOrOwner({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const loc = useLocation();

  // no logueado → a login con next
  if (!user) {
    const next = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  // normalizar rol
  const raw = String((user as any)?.role ?? "");
  const role = raw.toUpperCase(); // "ADMIN" | "OWNER" | ...

  // autorizado → render
  if (role === "ADMIN" || role === "OWNER") {
    return <>{children}</>;
  }

  // logueado pero sin permiso → home (o 403 si tenés página)
  return <Navigate to="/" replace />;
}
