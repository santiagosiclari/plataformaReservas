import React from "react";
import { Stack, CircularProgress } from "@mui/material";

type Props = {
  open: boolean;
};

export default function LoadingOverlay({ open }: Props) {
  if (!open) return null;
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1200,
      }}
    >
      <CircularProgress size={36} />
    </Stack>
  );
}
