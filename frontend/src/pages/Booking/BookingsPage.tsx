import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { confirmBooking, declineBooking, cancelBooking, listMyBookings, listOwnerBookings } from "../../api/bookings.api";
import HeaderTabs from "../../components/booking/HeaderTabs";
import BookingsTable from "../../components/booking/BookingsTable";
import ActionsCell from "../../components/booking/ActionsCell";
import { useBookingsData } from "../../hooks/bookings/useBookingsData";

type Tab = "mine" | "owner";

export default function BookingsPage() {
  const [params] = useSearchParams();
  const mineParam = params.get("mine") === "1";

  const [tab, setTab] = useState<Tab>(mineParam ? "mine" : "mine");
  const { role, canOwner, rows, setRows, loading, err, setErr } = useBookingsData(mineParam, tab);

  // Acciones
  async function onConfirm(id: number) {
    try {
      await confirmBooking(id);
      // refresco
      if (tab === "mine") setRows(await listMyBookings());
      else {
        const data = await listOwnerBookings({});
        data.sort((a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime());
        setRows(data);
      }
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo confirmar");
    }
  }
  async function onDecline(id: number) {
    try {
      await declineBooking(id);
      if (tab === "mine") setRows(await listMyBookings());
      else {
        const data = await listOwnerBookings({});
        data.sort((a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime());
        setRows(data);
      }
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo rechazar");
    }
  }
  async function onCancel(id: number) {
    try {
      await cancelBooking(id);
      if (tab === "mine") setRows(await listMyBookings());
      else {
        const data = await listOwnerBookings({});
        data.sort((a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime());
        setRows(data);
      }
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo cancelar");
    }
  }

  const header = useMemo(() => (
    <HeaderTabs tab={tab} canOwner={canOwner} onTab={setTab} />
  ), [tab, canOwner]);

  return (
    <div className="container booking-page" style={{ padding: 16 }}>
      {header}
      {err && <div className="alert error" style={{ marginTop: 8 }}>{err}</div>}
      {loading ? (
        <p>Cargando…</p>
      ) : rows.length === 0 ? (
        <p>No hay reservas para mostrar.</p>
      ) : (
        <BookingsTable
          rows={rows}
          tab={tab}
          canOwner={canOwner}
          onConfirm={onConfirm}
          onDecline={onDecline}
          onCancel={onCancel}
          ActionsCell={ActionsCell}
        />
      )}
    </div>
  );
}
