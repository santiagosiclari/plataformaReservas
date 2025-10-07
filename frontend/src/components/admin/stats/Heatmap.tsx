import React, { useMemo } from "react";
import { Box } from "@mui/material";
import type { HeatCell } from "../admin.types";

type Props = {
  cells: HeatCell[];
  rows?: number;  // default 7 (días)
  cols?: number;  // default 24 (horas)
  minAlpha?: number; // visibilidad mínima para celdas no vacías
};

export default function Heatmap({
  cells,
  rows = 7,
  cols = 24,
  minAlpha = 0.12,
}: Props) {
  // Matriz y máximo
  const { counts, max } = useMemo(() => {
    const counts = Array.from({ length: rows }, () => Array(cols).fill(0));
    let max = 1;
    for (const c of cells) {
      if (c.weekday >= 0 && c.weekday < rows && c.hour >= 0 && c.hour < cols) {
        counts[c.weekday][c.hour] = c.count;
        if (c.count > max) max = c.count;
      }
    }
    return { counts, max };
  }, [cells, rows, cols]);

  return (
    <Box sx={{ width: "100%", display: "grid", gap: 0.5 }}>
      {counts.map((row, r) => (
        <Box
          key={`row-${r}`}
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 0.5,
          }}
        >
          {row.map((v, c) => {
            const intensity = v / max; // 0..1
            const alpha = v === 0 ? minAlpha : minAlpha + intensity * (1 - minAlpha);
            return (
              <Box
                key={`cell-${r}-${c}`}
                title={`D${r} H${c}: ${v}`}
                sx={{
                  aspectRatio: "1 / 1",
                  borderRadius: 0.5,
                  bgcolor: `rgba(0,0,0,${alpha})`,
                }}
              />
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
