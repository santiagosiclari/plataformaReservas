import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";

import HomePage from "./pages/Home/HomePage";
import SearchPage from "./pages/Search/SearchPage";
import CourtDetailPage from "./pages/CourtDetail/CourtDetailPage";
import BookingPage from "./pages/Booking/BookingPage";
import BookingConfirmationPage from "./pages/BookingConfirmation/BookingConfirmationPage";
import UserPage from "./pages/User/UserPage";
import LoginPage from "./pages/Login/LoginPage";
import AdminDashboardPage from "./pages/Admin/AdminDashboardPage";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="courts/:courtId" element={<CourtDetailPage />} />
        <Route path="booking" element={<BookingPage />} />
        <Route path="booking/confirmation/:bookingId" element={<BookingConfirmationPage />} />
        <Route path="user" element={<UserPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="admin" element={<AdminDashboardPage />} />
        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
export default App;

