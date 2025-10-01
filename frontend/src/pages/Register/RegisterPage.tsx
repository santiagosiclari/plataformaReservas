// src/pages/auth/RegisterPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser } from "../../api/users.api";
import { loginAndFetchMe } from "../../api/auth.api";
import { useAuth } from "../../auth/AuthContext";
import "./register.css";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg(null);
    setLoading(true);
    try {
      await createUser({ email, password, name, phone });
      const { me } = await loginAndFetchMe({ email, password }); // 🔑 login automático
      setUser(me);
      navigate("/", { replace: true });
    } catch (err: any) {
        const status = err?.response?.status;
        const detail = err?.response?.data?.detail;

        if (status === 409) {
          setErrMsg("Ese correo ya está registrado.");
        } else if (status === 422) {
          // Pydantic puede devolver un array de errores o un detail string
          const msg = Array.isArray(detail)
            ? (detail[0]?.msg || "Datos inválidos.")
            : (detail || "Datos inválidos.");
          setErrMsg(msg);
        } else {
          setErrMsg("No se pudo crear la cuenta. Verificá tus datos e intentá nuevamente.");
        }
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">🆕 Crear cuenta</h1>

        {errMsg && <div className="alert error">{errMsg}</div>}

        <form className="login-form" onSubmit={handleRegister} noValidate>
          <div className="form-group">
            <label htmlFor="name">Nombre completo</label>
            <input id="name" type="text" value={name}
              onChange={(e) => setName(e.target.value)} required disabled={loading}/>
          </div>
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required disabled={loading}/>
          </div>
          <div className="form-group">
            <label htmlFor="phone">Teléfono (opcional)</label>
            <input id="phone" type="tel" value={phone}
              onChange={(e) => setPhone(e.target.value)} disabled={loading}/>
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-with-action">
              <input id="password" type={showPwd ? "text" : "password"}
                value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={6} disabled={loading}/>
              <button type="button" className="btn btn-ghost small"
                onClick={() => setShowPwd((s) => !s)}>
                {showPwd ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Creando..." : "Crear cuenta"}
          </button>
        </form>

        <div className="login-extra">
          <a href="/login">¿Ya tenés cuenta? Iniciar sesión</a>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
