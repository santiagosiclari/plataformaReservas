import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, logout } from "../../api/auth.api";
import type { User } from "../../api/users.api";
import "./user.css";

// Opcional: simulo bookings si no tenés api todavía
type Booking = {
  id: number;
  court: string;
  start: string;
  end: string;
  status: string;
};

const UserPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const me = await getMe();
        setUser(me);

        // TODO: reemplazar con api real de bookings del user
        setBookings([
          {
            id: 1,
            court: "Cancha 2 - Football",
            start: "2025-09-24 15:00",
            end: "2025-09-24 16:00",
            status: "CONFIRMED",
          },
          {
            id: 2,
            court: "Cancha 1 - Tennis",
            start: "2025-09-27 19:00",
            end: "2025-09-27 20:00",
            status: "PENDING",
          },
        ]);
      } catch (e) {
        console.error("Error fetching user:", e);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [navigate]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (loading) return <div className="user-page">Cargando...</div>;
  if (!user) return null;

  return (
    <div className="user-page">
      <div className="user-card">
        <h1 className="user-title">👤 Mi Perfil</h1>
        <div className="user-info">
          <p><strong>Nombre:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Teléfono:</strong> {user.phone}</p>
          <p><strong>Rol:</strong> {user.role}</p>
        </div>

        <button className="btn btn-ghost w-full" onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </div>

      <div className="user-card">
        <h2 className="section-title">📅 Mis Reservas</h2>
        {bookings.length === 0 ? (
          <p>No tenés reservas todavía.</p>
        ) : (
          <ul className="booking-list">
            {bookings.map((b) => (
              <li key={b.id} className="booking-item">
                <div>
                  <p className="booking-court">{b.court}</p>
                  <p className="booking-time">
                    {b.start} → {b.end}
                  </p>
                </div>
                <span className={`status ${b.status.toLowerCase()}`}>
                  {b.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UserPage;
