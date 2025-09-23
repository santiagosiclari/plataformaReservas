import React from "react";
import "./Header.css";

type HeaderProps = {
  brand: string;
  user?: { name?: string } | undefined;
  onLogin: () => void;
  onLogout: () => void;
};

const Header: React.FC<HeaderProps> = ({ brand, user, onLogin, onLogout }) => {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="brand" role="banner">
          <a href="/" className="brand-link">{brand}</a>
        </div>

        <nav className="nav" aria-label="Main">
          <a className="nav-link" href="/venues">Sedes</a>
          <a className="nav-link" href="/courts">Canchas</a>
          <a className="nav-link" href="/bookings">Reservas</a>
          <a className="nav-link" href="/prices">Precios</a>
        </nav>

        <div className="actions">
          {user ? (
            <>
              <span className="user-chip">{user.name ?? "Usuario"}</span>
              <button className="btn btn-ghost" onClick={onLogout}>Salir</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={onLogin}>Ingresar</button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
