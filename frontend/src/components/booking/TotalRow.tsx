import React from "react";
import type { SelectionInfo } from "../../hooks/bookings/useSelection";


export const TotalRow: React.FC<{ selection: SelectionInfo }> = ({ selection }) => (
<div className="total-row">
<div className="label">Total estimado</div>
<div className="total">
{selection.totalPrice != null
? `$${selection.totalPrice.toLocaleString("es-AR")} ${selection.currency || ""}`
: "Se calcula al confirmar"}
</div>
</div>
);