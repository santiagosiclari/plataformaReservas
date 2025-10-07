// src/components/layout/AppLayout.tsx
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import "./AppLayout.css";

type AppLayoutProps = {
  mode: "light" | "dark";
  toggleTheme: () => void;
};

const AppLayout: React.FC<AppLayoutProps> = ({ mode, toggleTheme }) => {
  const navigate = useNavigate();

  return (
    <div className="app-root">
      <Header
        brand="Plataforma Reservas"
        onLogin={() => navigate("/login")}
        onLogout={() => navigate("/logout")}
        myBookingsPath="/bookings?mine=1"
        mode={mode}
        onToggleTheme={toggleTheme}
      />

      <main className="app-main">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AppLayout;
