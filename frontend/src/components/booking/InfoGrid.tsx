import React from "react";
import { fmtDate, fmtHour } from "../../utils/dates";
import type { SelectionInfo } from "../../hooks/bookings/useSelection";


export const InfoGrid: React.FC<{ date: string; selection: SelectionInfo }> = ({ date, selection }) => (
<>
<div className="grid two">
<div className="box">
<div className="label">Fecha</div>
<div className="value">{fmtDate(date)}</div>
</div>
<div className="box">
<div className="label">Turnos</div>
<div className="value">{selection.count}</div>
</div>
</div>


<div className="box">
<div className="label">Horario</div>
<div className="value">{fmtHour(selection.start)} – {fmtHour(selection.end)}</div>
</div>
</>
);