import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import "./AppLayout.css";

const AppLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="app-root">
      <Header
        user={undefined}
        onLogin={() => navigate("/login")}
        onLogout={() => navigate("/logout")}
        brand="Plataforma Reservas"
      />

      <main className="app-main">
        {/* Usá .container para ancho “lg”; podés quitarlo en páginas full-bleed */}
        <div className="container">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AppLayout;
