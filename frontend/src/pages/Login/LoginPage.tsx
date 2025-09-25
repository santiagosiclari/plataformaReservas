// src/pages/auth/LoginPage.tsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./login.css";
import { loginAndFetchMe } from "../../api/auth.api";
import { useAuth } from "../../auth/AuthContext";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const loc = useLocation(); // 👈 NO uses "location" como nombre de variable
  const params = new URLSearchParams(loc.search);
  const next = params.get("next") || "/";

  const { setUser } = useAuth(); // si tenés contexto

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg(null);
    setLoading(true);
    try {
      const { me } = await loginAndFetchMe({ email, password });

      // si tenés contexto:
      setUser(me);

      // 👉 Volver a donde quería ir (usa ?next=)
      navigate(next, { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) setErrMsg("Credenciales inválidas. Verificá tu correo y contraseña.");
      else if (status === 422) setErrMsg("Datos inválidos. Revisá el formato del email.");
      else setErrMsg("No se pudo iniciar sesión. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">🔐 Iniciar Sesión</h1>

        {errMsg && <div className="alert error" role="alert">{errMsg}</div>}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required placeholder="ejemplo@correo.com" disabled={loading} />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-with-action">
              <input id="password" type={showPwd ? "text" : "password"}
                autoComplete="current-password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                required placeholder="********" disabled={loading} />
              <button type="button" className="btn btn-ghost small"
                onClick={() => setShowPwd((s) => !s)} aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                disabled={loading}>
                {showPwd ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="login-extra">
          <a href="#">¿Olvidaste tu contraseña?</a>
          <a href="/register">Crear cuenta</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
