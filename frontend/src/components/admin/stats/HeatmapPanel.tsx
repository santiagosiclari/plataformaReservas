import React from "react";
import { Box, Paper, Typography, Stack, Divider } from "@mui/material";
import type { HeatCell } from "../admin.types";
import Heatmap from "./Heatmap";

type Props = {
  cells: HeatCell[];
  title?: string;
};

export default function HeatmapPanel({
  cells,
  title = "Heatmap demanda (día × hora)",
}: Props) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 4,
        borderRadius: 2,
      }}
    >
      <Typography variant="subtitle1" gutterBottom>
        {title}
      </Typography>
      <Heatmap cells={cells} />
      <Divider sx={{ my: 1 }} />
      <Stack direction="row" alignItems="center">
        <Typography variant="caption" color="text.secondary">
          Dom
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="caption" color="text.secondary">
          0h → 23h
        </Typography>
      </Stack>
    </Paper>
  );
}
