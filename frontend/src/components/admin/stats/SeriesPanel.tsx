import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import type { Point } from "../admin.types";
import LineChart from "./LineChart";

type Props = {
  title: string;
  data: Point[];
  yLabel?: string;
};

export default function SeriesPanel({ title, data, yLabel }: Props) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 2,
        width: "100%",
        borderRadius: 2,
      }}
    >
      <Typography variant="subtitle1" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <LineChart data={data} yLabel={yLabel} />
      </Box>
    </Paper>
  );
}
