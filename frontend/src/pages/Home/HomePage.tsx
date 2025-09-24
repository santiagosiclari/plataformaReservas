import React from "react";
import { Link } from "react-router-dom";
import "./home.css";

function HomePage() {
  return (
    <div className="home">
      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">Reservá tu cancha en minutos</h1>
          <p className="hero-subtitle">
            Buscá sedes, elegí el deporte y confirmá tu horario. Simple, rápido y desde cualquier dispositivo.
          </p>
          <div className="hero-actions">
            <Link to="/search" className="btn btn-primary">🔍 Buscar canchas</Link>
            <Link to="/bookings?mine=1" className="btn btn-ghost">📅 Mis reservas</Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features container">
        <div className="feature-card">
          <div className="feature-emoji">⚽</div>
          <h3>Deportes variados</h3>
          <p>Fútbol, tenis, pádel y más. Encontrá la cancha ideal para tu juego.</p>
        </div>

        <div className="feature-card">
          <div className="feature-emoji">⏱️</div>
          <h3>Reserva inmediata</h3>
          <p>Disponibilidad en tiempo real y confirmación al instante.</p>
        </div>

        <div className="feature-card">
          <div className="feature-emoji">💳</div>
          <h3>Precios claros</h3>
          <p>Vas a ver el precio por franja antes de confirmar tu reserva.</p>
        </div>
      </section>

      {/* LINKS RÁPIDOS */}
      <section className="quick container">
        <h2>Atajos</h2>
        <div className="quick-grid">
          <Link to="/venues" className="quick-link">🏟️ Ver sedes</Link>
          <Link to="/courts" className="quick-link">🧭 Explorar canchas</Link>
          <Link to="/user" className="quick-link">👤 Mi perfil</Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
