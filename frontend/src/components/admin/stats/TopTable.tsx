import React from "react";
import {
  Paper,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import type { TopItem } from "../admin.types";

const fmtMoney = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

type Props = {
  items: TopItem[];
  title: string;
};

export default function TopTable({ items, title }: Props) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 2,
      }}
    >
      <Typography variant="subtitle1" gutterBottom>
        {title}
      </Typography>
      <TableContainer sx={{ maxHeight: 340 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell align="right">Reservas</TableCell>
              <TableCell align="right">Ingresos</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id} hover>
                <TableCell>{it.name}</TableCell>
                <TableCell align="right">{it.bookings}</TableCell>
                <TableCell align="right">{fmtMoney(it.revenue)}</TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ color: "text.secondary" }}>
                  Sin datos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
