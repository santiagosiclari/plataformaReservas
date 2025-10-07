// src/components/layout/Header.tsx
import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "./Header.css";
import { useAuth } from "../../auth/AuthContext";

type HeaderProps = {
  brand: string;
  onLogin?: () => void;
  onLogout?: () => void;
  myBookingsPath?: string;
  mode: "light" | "dark";
  onToggleTheme: () => void;
};

const ADMIN_DEFAULT = "/admin";            // ← coincide con tu App
const MANAGE_DEFAULT = "/admin/manage";    // ← coincide con tu App

const Header: React.FC<HeaderProps> = ({
  brand,
  onLogin,
  onLogout,
  myBookingsPath = "/bookings?mine=1",
  mode,
  onToggleTheme,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const authed = !!user;

  const isAdmin = user?.role === "OWNER" || user?.role === "ADMIN"; // badge + Admin link
  const isOwner = user?.role === "OWNER";                            // Manage link

  const handleBookingsClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (!authed) {
      e.preventDefault();
      const next = encodeURIComponent(myBookingsPath);
      navigate(`/login?next=${next}`);
    }
  };

  // 🔹 Permite click si es OWNER o ADMIN (solo bloquea si no es ninguno)
  const handleAdminClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (!isAdmin) {
      e.preventDefault();
      navigate(`/login?next=${encodeURIComponent(ADMIN_DEFAULT)}`);
    }
  };

  const handleManageClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (!isOwner) {
      e.preventDefault();
      navigate(`/login?next=${encodeURIComponent(MANAGE_DEFAULT)}`);
    }
  };

  const handleLogout = () => {
    logout();
    if (onLogout) onLogout();
    else navigate("/login");
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="brand" role="banner">
          <Link to="/" className="brand-link">{brand}</Link>
        </div>

        <nav className="nav" aria-label="Main">
          <NavLink className="nav-link" to="/venues">Sedes</NavLink>
          <NavLink className="nav-link" to="/courts">Canchas</NavLink>
          <NavLink className="nav-link" to={myBookingsPath} onClick={handleBookingsClick}>Reservas</NavLink>
        </nav>

        <div className="actions">
          <button
            className="btn btn-ghost"
            onClick={onToggleTheme}
            title={mode === "dark" ? "Cambiar a claro" : "Cambiar a oscuro"}
            aria-label="Cambiar tema"
          >
            {mode === "dark" ? "🌙" : "☀️"}
          </button>

          {authed ? (
            <div className="user-menu">
              <button className="user-chip" aria-haspopup="menu">
                {user?.name ?? "Usuario"}{isAdmin && <span className="badge-admin">Admin</span>}
                <span className="chev">▾</span>
              </button>
              <div className="menu" role="menu">
                <Link className="menu-item" to="/user">Mi perfil</Link>
                <Link className="menu-item" to={myBookingsPath} onClick={handleBookingsClick}>Mis reservas</Link>

                {/* Panel Admin: OWNER o ADMIN */}
                {isAdmin && (
                  <Link className="menu-item" to={ADMIN_DEFAULT} onClick={handleAdminClick}>
                    Panel Admin
                  </Link>
                )}

                {/* Panel Manage: solo OWNER */}
                {isOwner && (
                  <Link className="menu-item" to={MANAGE_DEFAULT} onClick={handleManageClick}>
                    Panel Manage
                  </Link>
                )}

                <div className="menu-sep" />
                <button className="menu-item danger" onClick={handleLogout}>Salir</button>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => {
                if (onLogin) onLogin();
                else navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
              }}
            >
              Ingresar
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
