import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext"; // el que hidrata getMe()

export default function RequireOwner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{padding:16}}>Cargando sesión…</div>;
  if (user?.role !== "OWNER") return <Navigate to="/" replace />;
  return <>{children}</>;
}
