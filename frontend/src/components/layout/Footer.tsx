import React from "react";
import "./Footer.css";

const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="col">
          <h4>Soporte</h4>
          <ul>
            <li><a href="#">Centro de ayuda</a></li>
            <li><a href="#">Información segura</a></li>
            <li><a href="#">Cancelaciones</a></li>
            <li><a href="#">COVID-19</a></li>
            <li><a href="#">Accesibilidad</a></li>
            <li><a href="#">Reportes</a></li>
          </ul>
        </div>
        <div className="col">
          <h4>Comunidad</h4>
          <ul>
            <li><a href="#">Voluntariado</a></li>
            <li><a href="#">Refugios</a></li>
            <li><a href="#">Diversidad</a></li>
            <li><a href="#">Programa juvenil</a></li>
          </ul>
        </div>
        <div className="col">
          <h4>Empresa</h4>
          <ul>
            <li><a href="#">Acerca de</a></li>
            <li><a href="#">Prensa</a></li>
            <li><a href="#">Trabajá con nosotros</a></li>
            <li><a href="#">Términos y privacidad</a></li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Plataforma Reservas</span>
        <nav className="footer-links" aria-label="Legal">
          <a href="#">Privacidad</a>
          <a href="#">Términos</a>
          <a href="#">Cookies</a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
