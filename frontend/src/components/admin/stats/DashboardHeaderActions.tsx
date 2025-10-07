import React from "react";
import { Stack, Typography, Button } from "@mui/material";

type Props = {
  title?: string;
  onExportAllCSV: () => void;
  onExportAllXLSX: () => void;
};

export default function DashboardHeaderActions({
  title = "📊 Admin Dashboard",
  onExportAllCSV,
  onExportAllXLSX,
}: Props) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems={{ sm: "center" }}
      justifyContent="space-between"
      spacing={2}
      mb={2}
    >
      <Typography variant="h4" component="h1">
        {title}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Button variant="contained" onClick={onExportAllCSV}>
          Exportar todo (CSV)
        </Button>
        <Button variant="outlined" onClick={onExportAllXLSX}>
          Exportar todo (Excel)
        </Button>
      </Stack>
    </Stack>
  );
}
