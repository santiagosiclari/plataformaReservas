import React from "react";
import { Stack, Card, CardContent, Typography, useTheme } from "@mui/material";
import type { SummaryOut } from "../admin.types";

const fmtMoney = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

type Props = { summary: SummaryOut | null };

export default function SummaryCards({ summary }: Props) {
  const theme = useTheme();

  const cards = [
    { label: "Reservas", value: summary?.bookings_total ?? "—" },
    { label: "Ingresos", value: summary ? fmtMoney(summary.revenue_total) : "—" },
    { label: "Cancelaciones", value: summary?.cancellations ?? "—" },
    { label: "Tasa de cancelación", value: summary ? (summary.cancel_rate * 100).toFixed(1) + "%" : "—" },
    { label: "Courts activos", value: summary?.active_courts ?? "—" },
    { label: "Venues activos", value: summary?.active_venues ?? "—" },
  ];

  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      useFlexGap
      spacing={2}
      justifyContent="center"
      sx={{ mb: 3 }}
    >
      {cards.map((c, i) => (
        <Card
          key={i}
          variant="outlined"
          sx={{
            flex: "1 1 140px",
            minWidth: 140,
            maxWidth: 200,
            borderRadius: 2,
            bgcolor: theme.palette.background.paper,
          }}
        >
          <CardContent sx={{ textAlign: "center", py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              {c.label}
            </Typography>
            <Typography variant="h6" fontWeight="600">
              {c.value}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
