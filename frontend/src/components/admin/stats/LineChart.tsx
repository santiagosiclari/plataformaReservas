import React, { useMemo } from "react";
import { Box } from "@mui/material";
import type { Point } from "../admin.types";

type Props = {
  data: Point[];
  height?: number;   // alto en px del SVG
  padding?: number;  // padding interno para ejes
  yLabel?: string;   // texto pequeño arriba-derecha (ej: "$" o "#")
  yTicks?: number;   // cantidad de líneas guía horizontales
  showDots?: boolean;
};

export default function LineChart({
  data,
  height = 160,
  padding = 32,
  yLabel,
  yTicks = 4,
  showDots = false,
}: Props) {
  const width = 720; // viewBox fijo; el SVG escala con width: 100%

  const { path, ticksY, xLabels, dots } = useMemo(() => {
    const values = data.length ? data.map((d) => d.value) : [0];
    const maxY = Math.max(1, ...values);
    const minY = 0;

    const innerW = width - padding * 2;
    const innerH = height - padding * 2;
    const xStep = data.length > 1 ? innerW / (data.length - 1) : 0;
    const yScale = (v: number) =>
      padding + innerH - ((v - minY) * innerH) / (maxY - minY || 1);

    const path = data
      .map((d, i) => `${i === 0 ? "M" : "L"} ${padding + i * xStep} ${yScale(d.value)}`)
      .join(" ");

    const ticksY = Array.from({ length: yTicks + 1 }, (_, i) => {
      const y = padding + (innerH * i) / yTicks;
      const val = Math.round(maxY - ((maxY - minY) * i) / yTicks);
      return { y, val };
    });

    const skip = Math.max(1, Math.ceil(data.length / 7)); // ~7 labels
    const xLabels = data.map((d, i) => {
      if (i % skip !== 0) return null;
      return {
        x: padding + i * xStep,
        text: d.date.slice(5), // "MM-DD"
      };
    }).filter(Boolean) as { x: number; text: string }[];

    const dots = data.map((d, i) => ({
      cx: padding + i * xStep,
      cy: yScale(d.value),
    }));

    return { path, ticksY, xLabels, dots };
  }, [data, height, padding, yTicks]);

  return (
    <Box sx={{ width: "100%" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height }}
        role="img"
        aria-label="Line chart"
      >
        {/* Líneas guía y ticks Y */}
        {ticksY.map((t, i) => (
          <g key={`ytick-${i}`}>
            <line
              x1={padding}
              y1={t.y}
              x2={width - padding}
              y2={t.y}
              stroke="currentColor"
              strokeOpacity={0.15}
            />
            <text x={8} y={t.y + 4} fontSize={11} fill="currentColor">
              {t.val}
            </text>
          </g>
        ))}
        {/* Etiqueta Y */}
        {yLabel && (
          <text x={width - padding} y={16} fontSize={12} fill="currentColor">
            {yLabel}
          </text>
        )}
        {/* Línea principal */}
        <path d={path} fill="none" stroke="currentColor" strokeWidth={2} />
        {/* Puntos (opcional) */}
        {showDots &&
          dots.map((d, i) => (
            <circle key={`dot-${i}`} cx={d.cx} cy={d.cy} r={2.5} fill="currentColor" />
          ))}
        {/* Labels X */}
        {xLabels.map((l, i) => (
          <text
            key={`xlabel-${i}`}
            x={l.x}
            y={height - 6}
            fontSize={10}
            fill="currentColor"
            textAnchor="middle"
          >
            {l.text}
          </text>
        ))}
      </svg>
    </Box>
  );
}
