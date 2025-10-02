// src/components/layout/Header.tsx
import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "./Header.css";
import { isAuthenticated } from "../../api/auth.api";
import { useAuth } from "../../auth/AuthContext";
import { isOwnerOrAdmin } from "../../auth/role.util";

type HeaderProps = {
  brand: string;
  onLogin: () => void;
  onLogout: () => void;
  myBookingsPath?: string;
};

const Header: React.FC<HeaderProps> = ({ brand, onLogin, onLogout, myBookingsPath = "/bookings?mine=1" }) => {
  const navigate = useNavigate();
  const authed = isAuthenticated();
  const { user } = useAuth();

  const handleBookingsClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (!authed) {
      e.preventDefault();
      const next = encodeURIComponent(myBookingsPath);
      navigate(`/login?next=${next}`);
    }
  };

  const isAdmin = user?.role === "OWNER" || user?.role === "ADMIN";

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
              {authed ? (
        <div className="user-menu">
          <button className="user-chip" aria-haspopup="menu">
            {user?.name ?? "Usuario"}{isAdmin && <span className="badge-admin">Admin</span>}
            <span className="chev">▾</span>
          </button>
          <div className="menu" role="menu">
            <Link className="menu-item" to="/user">Mi perfil</Link>
            <Link className="menu-item" to={myBookingsPath} onClick={handleBookingsClick}>Mis reservas</Link>
            {isAdmin && <Link className="menu-item" to="/admin">Panel Admin</Link>}
            {isAdmin && <Link className="menu-item" to="/admin/manage">Panel Manage</Link>}
            <div className="menu-sep" />
            <button className="menu-item danger" onClick={onLogout}>Salir</button>
          </div>
        </div>
      ) : (
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`)}
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
