import React, { ReactNode } from "react";
import { Box, Container, Typography } from "@mui/material";

interface Props {
  children: ReactNode;
}

function AppLayout({ children }: Props) {
  return (
    <Box>
      <Box component="header" sx={{ p: 2, bgcolor: "primary.main", color: "white" }}>
        <Typography variant="h6">Mi App de Reservas</Typography>
      </Box>

      <Container component="main" sx={{ py: 3 }}>
        {children}
      </Container>

      <Box component="footer" sx={{ p: 2, bgcolor: "grey.200" }}>
        <Typography variant="body2" align="center">
          © {new Date().getFullYear()} Mi Proyecto
        </Typography>
      </Box>
    </Box>
  );
}

export default AppLayout;
