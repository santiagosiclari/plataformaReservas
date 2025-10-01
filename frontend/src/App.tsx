import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";

import HomePage from "./pages/Home/HomePage";
import SearchPage from "./pages/Search/SearchPage";
import CourtDetailPage from "./pages/CourtDetail/CourtDetailPage";

// Booking (singular: flujo de reserva)
import BookingPage from "./pages/Booking/BookingPage";
import BookingConfirmationPage from "./pages/BookingConfirmation/BookingConfirmationPage";

// Bookings (plural: listado de reservas del usuario / owner tabs)
import BookingsPage from "./pages/Booking/BookingsPage";

import UserPage from "./pages/User/UserPage";
import LoginPage from "./pages/Login/LoginPage";
import RegisterPage from "./pages/Register/RegisterPage";


import AdminDashboardPage from "./pages/Admin/AdminDashboardPage";
import AdminManagePage from "./pages/Admin/AdminManagePage";

import RequireAuth from "./auth/RequireAuth";
import RequireOwner from "./auth/RequireOwner";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* públicas */}
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="courts/:courtId" element={<CourtDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* booking (singular) - puede estar protegida si querés que solo reserven logueados */}
        <Route
          path="booking"
          element={
            <RequireAuth>
              <BookingPage />
            </RequireAuth>
          }
        />
        <Route
          path="booking/confirmation/:bookingId"
          element={
            <RequireAuth>
              <BookingConfirmationPage />
            </RequireAuth>
          }
        />

        {/* área usuario */}
        <Route
          path="user"
          element={
            <RequireAuth>
              <UserPage />
            </RequireAuth>
          }
        />

        {/* listado de reservas (mis reservas / owner tabs) */}
        <Route
          path="bookings"
          element={
            <RequireAuth>
              <BookingsPage />
            </RequireAuth>
          }
        />

        {/* admin */}
        <Route
          path="admin"
          element={
            <RequireAuth>
              <RequireOwner>
                <AdminDashboardPage />
              </RequireOwner>
            </RequireAuth>
          }
        />
        <Route
          path="admin/manage"
          element={
            <RequireAuth>
              <RequireOwner>
                <AdminManagePage />
              </RequireOwner>
            </RequireAuth>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
export default App;