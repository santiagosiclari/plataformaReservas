import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, logout } from "../../api/auth.api";
import type { User } from "../../api/users.api";
import "./user.css";

/**
 * /user — Página de perfil del usuario (NO admin)
 * - Ver datos básicos (email y rol solo lectura)
 * - Editar nombre y teléfono
 * - Cambiar contraseña
 * - Cerrar sesión
 *
 * Endpoints asumidos (ajustá a tu API real):
 * - GET   /auth/me                       -> { id, name, email, phone, role, created_at }
 * - PATCH /users/{id}                    -> { name?, phone? }
 * - POST  /auth/change-password          -> { current_password, new_password }
 */

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as HeadersInit;
}

const UserPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // profile form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // password form
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setUser(me);
        setName(me.name || "");
        setPhone(me.phone || "");
      } catch (e) {
        console.error("Error fetching user:", e);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch(`/users/${user.id}`, {
        method: "PATCH", // si tu backend usa PUT, cambialo
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, phone }),
      });
      if (!res.ok) throw new Error("No se pudo actualizar el perfil");
      const updated = await res.json();
      setUser(updated);
      setProfileMsg("Perfil actualizado ✔");
    } catch (err: any) {
      setProfileMsg(err?.message || "Error guardando cambios");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);
    if (newPwd.length < 8) {
      setPwdMsg("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg("Las contraseñas no coinciden");
      return;
    }
    setChangingPwd(true);
    try {
      const res = await fetch("/auth/change-password", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ current_password: currentPwd, new_password: newPwd }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "No se pudo cambiar la contraseña");
      }
      setPwdMsg("Contraseña actualizada ✔");
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err: any) {
      setPwdMsg(err?.message || "Error cambiando contraseña");
    } finally {
      setChangingPwd(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (loading) return <div className="user-page">Cargando…</div>;
  if (!user) return null;

  return (
    <div className="user-page">
      {/* Tarjeta de perfil */}
      <div className="user-card">
        <h1 className="user-title">👤 Mi Perfil</h1>
        <div className="user-info">
          <p><strong>Nombre:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Teléfono:</strong> {user.phone || "—"}</p>
          <p><strong>Rol:</strong> {user.role}</p>
          <p><strong>Alta:</strong> {new Date(user.created_at as unknown as string).toLocaleString()}</p>
        </div>
      </div>

      {/* Editar perfil */}
      <div className="user-card">
        <div className="section-header">
          <h2 className="section-title">✏️ Editar perfil</h2>
        </div>
        <form className="form-grid" onSubmit={handleSaveProfile}>
          <label>
            <span>Nombre</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            <span>Teléfono</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54911…" />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn" disabled={savingProfile}>{savingProfile ? "Guardando…" : "Guardar cambios"}</button>
          </div>
          {profileMsg && <p className="hint">{profileMsg}</p>}
        </form>
      </div>

      {/* Seguridad: cambiar contraseña */}
      <div className="user-card">
        <div className="section-header">
          <h2 className="section-title">🔒 Seguridad</h2>
        </div>
        <form className="form-grid" onSubmit={handleChangePassword}>
          <label>
            <span>Contraseña actual</span>
            <input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} required />
          </label>
          <label>
            <span>Nueva contraseña</span>
            <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required />
          </label>
          <label>
            <span>Repetir nueva contraseña</span>
            <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn" disabled={changingPwd}>{changingPwd ? "Actualizando…" : "Cambiar contraseña"}</button>
          </div>
          {pwdMsg && <p className="hint">{pwdMsg}</p>}
        </form>
      </div>

      {/* Sesión */}
      <div className="user-card">
        <button className="btn btn-ghost w-full" onClick={handleLogout}>Cerrar sesión</button>
      </div>
    </div>
  );
};

export default UserPage;
