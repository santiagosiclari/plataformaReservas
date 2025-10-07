// src/pages/home/HomePage.tsx
import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Stack, Paper, Typography, Button } from "@mui/material";
import { alpha, darken } from "@mui/material/styles";

export default function HomePage() {
  const features = [
    { emoji: "⚽", title: "Deportes variados", desc: "Fútbol, tenis, pádel y más. Encontrá la cancha ideal." },
    { emoji: "⚡", title: "Reserva inmediata", desc: "Disponibilidad en tiempo real y confirmación al instante." },
    { emoji: "💰", title: "Precios claros", desc: "Consultá el precio por franja antes de confirmar tu reserva." },
  ];

  return (
    <Box className="home" sx={{ bgcolor: "background.default" }}>
      {/* HERO */}
      <Box
        sx={(theme) => ({
          pt: { xs: 12, md: 14 },
          pb: { xs: 6, md: 8 },
          background:
            theme.palette.mode === "dark"
              ? `linear-gradient(135deg,
                   ${alpha(theme.palette.primary.main, 0.12)} 0%,
                   ${alpha(theme.palette.text.secondary, 0.08)} 60%)`
              : "linear-gradient(135deg, #dbeafe 0%, #f1f5f9 60%)",
        })}
      >
        <Box sx={{ maxWidth: 900, mx: "auto", px: 2, textAlign: "center" }}>
          <Typography
            variant="h3"
            sx={{ fontWeight: 800, letterSpacing: "-.02em", color: "text.primary" }}
          >
            Reservá tu cancha en minutos
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 2, lineHeight: 1.6 }}>
            Buscá sedes, elegí el deporte y confirmá tu horario.
            <br />Simple, rápido y desde cualquier dispositivo.
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            justifyContent="center"
            sx={{ mt: 3 }}
          >
            <Button component={RouterLink} to="/search" variant="contained">
              🔍 Buscar canchas
            </Button>
            <Button component={RouterLink} to="/bookings?mine=1" variant="outlined">
              📅 Mis reservas
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* FEATURES */}
      <Box sx={{ maxWidth: 1100, mx: "auto", px: 2, py: 6 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          {features.map((f) => (
            <Paper
              key={f.title}
              elevation={0}
              sx={(theme) => ({
                p: 3,
                textAlign: "center",
                borderRadius: 3,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? `0 6px 24px ${alpha("#000", 0.25)}`
                    : `0 6px 24px ${alpha("#000", 0.06)}`,
              })}
            >
              <Typography fontSize={36} sx={{ mb: 1 }}>
                {f.emoji}
              </Typography>
              <Typography sx={{ fontWeight: 700, color: "text.primary" }}>
                {f.title}
              </Typography>
              <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
                {f.desc}
              </Typography>
            </Paper>
          ))}
        </Stack>
      </Box>

      {/* ATAJOS */}
      <Box
        sx={(theme) => ({
          py: 6,
          bgcolor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.common.white, 0.06)
              : "#f8fafc",
        })}
      >
        <Box sx={{ maxWidth: 800, mx: "auto", px: 2, textAlign: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary", mb: 2 }}>
            Atajos
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            justifyContent="center"
          >
            <Button component={RouterLink} to="/venues" variant="outlined">🏟️ Ver sedes</Button>
            <Button component={RouterLink} to="/courts" variant="outlined">🧭 Explorar canchas</Button>
            <Button component={RouterLink} to="/user" variant="outlined">👤 Mi perfil</Button>
          </Stack>
        </Box>
      </Box>

      {/* CTA */}
      <Box
        sx={(theme) => {
          const main = theme.palette.primary.main;
          const end = darken(main, theme.palette.mode === "dark" ? 0.5 : 0.35);
          return {
            color: theme.palette.getContrastText(main),
            background: `linear-gradient(135deg, ${main} 0%, ${end} 100%)`,
            py: 8,
          };
        }}
      >
        <Box sx={{ maxWidth: 1100, mx: "auto", px: 2, textAlign: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            ¿Listo para jugar?
          </Typography>
          <Typography sx={{ opacity: 0.9, mb: 3 }}>
            Encontrá tu cancha ideal y empezá tu partido hoy mismo.
          </Typography>
          <Button component={RouterLink} to="/search" variant="contained" size="large" color="inherit">
            Comenzar ahora
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
