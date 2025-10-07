import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, logout } from "../../api/auth.api";
import type { User } from "../../api/users.api";
import { createRoleRequest } from "../../api/users.api";
import "./user.css";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as HeadersInit;
}

// --- contrato sugerido de backend ---
// POST /admin/owner-requests
// body: { user_id: number, role: "OWNER" | "ADMIN" }
// -> 202 Accepted { status: "pending" }
// El backend dispara el email a santisiclari@gmail.com con enlaces de aceptar/rechazar.

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

  // role request
  const [reqRole, setReqRole] = useState<"OWNER" | "ADMIN">("OWNER");
  const [reqLoading, setReqLoading] = useState(false);
  const [reqMsg, setReqMsg] = useState<string | null>(null);

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
        method: "PATCH",
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
    if (newPwd.length < 8) return setPwdMsg("La nueva contraseña debe tener al menos 8 caracteres");
    if (newPwd !== confirmPwd) return setPwdMsg("Las contraseñas no coinciden");
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
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (err: any) {
      setPwdMsg(err?.message || "Error cambiando contraseña");
    } finally {
      setChangingPwd(false);
    }
  }

// handler:
  async function handleRequestRole(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (user.role === "ADMIN" || user.role === "OWNER") {
      setReqMsg("Ya contás con permisos elevados.");
      return;
    }
    setReqLoading(true);
    setReqMsg(null);
    try {
      await createRoleRequest(user.id, reqRole);
      setReqMsg(
        `Solicitud enviada ✔ Se notificó a santisiclari@gmail.com para aprobar el rol ${reqRole}.`
      );
    } catch (err: any) {
      setReqMsg(err?.message || "No se pudo enviar la solicitud");
    } finally {
      setReqLoading(false);
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

      {/* Solicitar rol elevado */}
      <div className="user-card">
        <div className="section-header">
          <h2 className="section-title">⚙️ Permisos</h2>
        </div>
        <form className="form-row" onSubmit={handleRequestRole}>
          <label>
            <span>Rol solicitado</span>
            <select
              value={reqRole}
              onChange={(e) => setReqRole(e.target.value as "OWNER" | "ADMIN")}
              className="select"
            >
              <option value="OWNER">OWNER (gestión de sedes)</option>
              <option value="ADMIN">ADMIN (administrador total)</option>
            </select>
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={reqLoading || user.role === "ADMIN" || user.role === "OWNER"}>
              {reqLoading ? "Enviando…" : "Solicitar rol"}
            </button>
          </div>
          {reqMsg && <p className="hint">{reqMsg}</p>}
          {(user.role === "ADMIN" || user.role === "OWNER") && (
            <p className="hint">Ya tenés permisos elevados ({user.role}).</p>
          )}
        </form>
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
            <button type="submit" className="btn" disabled={savingProfile}>
              {savingProfile ? "Guardando…" : "Guardar cambios"}
            </button>
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
            <button type="submit" className="btn" disabled={changingPwd}>
              {changingPwd ? "Actualizando…" : "Cambiar contraseña"}
            </button>
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
