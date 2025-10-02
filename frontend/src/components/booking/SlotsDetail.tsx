import React from "react";
import { fmtHour } from "../../utils/dates";
import type { SelectionInfo } from "../../hooks/bookings/useSelection";


export const SlotsDetail: React.FC<{ selection: SelectionInfo }> = ({ selection }) => (
<div className="box">
<div className="label">Detalle</div>
<ul className="slots-list">
{selection.items.map((s, i) => (
<li key={i}>
<span>{fmtHour(s.start)} – {fmtHour(s.end)}</span>
{typeof s.price_per_slot === "number" ? (
<span className="price">${s.price_per_slot.toLocaleString("es-AR")}</span>
) : (
<span className="muted">—</span>
)}
</li>
))}
</ul>
</div>
);