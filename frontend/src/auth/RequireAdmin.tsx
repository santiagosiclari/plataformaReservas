import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext"; // el que hidrata getMe()

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{padding:16}}>Cargando sesión…</div>;
  if (user?.role !== "ADMIN") return <Navigate to="/" replace />;
  return <>{children}</>;
}

