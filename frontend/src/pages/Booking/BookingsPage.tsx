// src/pages/Booking/BookingsPage.tsx
import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  confirmBooking, declineBooking, cancelBooking,
  listMyBookings, listOwnerBookings,
} from "../../api/bookings.api";

import { Container, Paper, Typography, Tabs, Tab, Stack, Button, Alert, CircularProgress, Divider, Chip } from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
import RefreshIcon from "@mui/icons-material/Refresh";

import BookingsTable from "../../components/booking/BookingsTable";
import ActionsCell from "../../components/booking/ActionsCell";
import { useBookingsData } from "../../hooks/bookings/useBookingsData";

type TabKey = "mine" | "owner";

export default function BookingsPage() {
  const [params] = useSearchParams();
  const mineParam = params.get("mine") === "1";

  const [tab, setTab] = useState<TabKey>(mineParam ? "mine" : "mine");
  const { role, canOwner, rows, setRows, loading, err, setErr } = useBookingsData(mineParam, tab);

  async function refresh() {
    if (tab === "mine") {
      setRows(await listMyBookings());
    } else {
      const data = await listOwnerBookings({});
      data.sort((a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime());
      setRows(data);
    }
  }

  async function onConfirm(id: number) {
    try { await confirmBooking(id); await refresh(); }
    catch (e: any) { setErr(e?.message ?? "No se pudo confirmar"); }
  }
  async function onDecline(id: number) {
    try { await declineBooking(id); await refresh(); }
    catch (e: any) { setErr(e?.message ?? "No se pudo rechazar"); }
  }
  async function onCancel(id: number) {
    try { await cancelBooking(id); await refresh(); }
    catch (e: any) { setErr(e?.message ?? "No se pudo cancelar"); }
  }

  const tabs = useMemo(() => (
    <Tabs
      value={tab}
      onChange={(_, v) => setTab(v)}
      variant="scrollable"
      scrollButtons="auto"
      aria-label="Tabs de reservas"
      sx={(theme) => ({
        "& .MuiTab-root": {
          textTransform: "none",
          fontWeight: 700,
          borderRadius: 999,
          minHeight: 36,
          px: 1.5,
        },
        "& .MuiTabs-flexContainer": { gap: 1 },
        "& .MuiTab-root.Mui-selected": {
          color: theme.palette.mode === "dark" ? "#0b0c10" : "#fff",
          backgroundColor: theme.palette.primary.main,
        },
      })}
    >
      <Tab label="Mis reservas" value="mine" />
      {canOwner && <Tab label="Reservas de mis sedes" value="owner" />}
    </Tabs>
  ), [tab, canOwner]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mb: 3, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
          <Stack direction="row" alignItems="center" gap={1.25}>
            <EventNoteIcon color="primary" fontSize="large" />
            <Typography variant="h5" fontWeight={800}>Reservas</Typography>
            {role && <Chip size="small" label={role} variant="outlined" />}
          </Stack>
          <Button onClick={refresh} variant="outlined" startIcon={<RefreshIcon />} disabled={loading}>
            Actualizar
          </Button>
        </Stack>
        <Divider sx={{ my: 2 }} />
        {tabs}
      </Paper>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      {loading ? (
        <Paper elevation={0} sx={{ p: 5, textAlign: "center", bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
          <CircularProgress />
          <Typography sx={{ mt: 1.5, color: "text.secondary" }}>Cargando…</Typography>
        </Paper>
      ) : rows.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: "center", bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
          <Typography variant="h6" sx={{ color: "text.disabled", fontWeight: 800 }}>No hay reservas para mostrar.</Typography>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ p: { xs: 1, md: 2 }, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
          <BookingsTable
            rows={rows}
            tab={tab}
            canOwner={canOwner}
            onConfirm={onConfirm}
            onDecline={onDecline}
            onCancel={onCancel}
            ActionsCell={ActionsCell}
          />
        </Paper>
      )}
    </Container>
  );
}
