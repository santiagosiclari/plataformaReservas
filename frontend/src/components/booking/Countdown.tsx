import React, { useEffect, useState } from "react";

function msLeft(expires_at?: string | null): number {
  if (!expires_at) return 0;
  return new Date(expires_at).getTime() - Date.now();
}

export default function Countdown({ expiresAt }: { expiresAt?: string | null }) {
  const [left, setLeft] = useState(() => msLeft(expiresAt));
  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setLeft(msLeft(expiresAt)), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return <span className="muted">—</span>;
  if (left <= 0) return <span className="badge badge-expired">vencida</span>;
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return <span className="badge badge-pending">vence en {m}:{String(s).padStart(2, "0")}</span>;
}
