import React from "react";
import { Stack, Tabs, Tab, Typography, Chip } from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";

export default function HeaderTabs({
  tab, canOwner, onTab, role,
}: {
  tab: "mine" | "owner";
  canOwner: boolean;
  onTab: (t: "mine" | "owner") => void;
  role?: string;
}) {
  return (
    <Stack
      direction="column"
      spacing={1.5}
      sx={(theme) => ({
        mb: 2,
        p: { xs: 2, md: 3 },
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
      })}
    >
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <EventNoteIcon color="primary" fontSize="large" />
        <Typography variant="h5" fontWeight={800}>Reservas</Typography>
        {role && <Chip size="small" label={role} variant="outlined" />}
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, v) => onTab(v)}
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
    </Stack>
  );
}
