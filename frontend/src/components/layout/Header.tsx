// Header.tsx
import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "./Header.css";
import { isAuthenticated } from "../../api/auth.api"; // 👈

type HeaderProps = {
  brand: string;
  user?: { name?: string } | undefined; // seguí mostrándolo si querés
  onLogin: () => void;
  onLogout: () => void;
  myBookingsPath?: string;
};

const Header: React.FC<HeaderProps> = ({ brand, user, onLogin, onLogout, myBookingsPath = "/bookings?mine=1" }) => {
  const navigate = useNavigate();
  const authed = isAuthenticated(); // 👈 mira el token persistido

  const handleBookingsClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (!authed) { // 👈 NO dependas de user
      e.preventDefault();
      const next = encodeURIComponent(myBookingsPath);
      navigate(`/login?next=${next}`); // SPA, sin recargar
    }
    // si authed, dejá seguir
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
          <NavLink className="nav-link" to={myBookingsPath} onClick={handleBookingsClick}>
            Reservas
          </NavLink>
        </nav>

        <div className="actions">
          {authed ? ( // 👈 también podés usar authed acá
            <>
              <span className="user-chip">{user?.name ?? "Usuario"}</span>
              <button className="btn btn-ghost" onClick={onLogout}>Salir</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`)}>
              Ingresar
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
