import React from "react";
import type { CourtDetailPublic } from "../../api/courts.api";


export const BookingHeader: React.FC<{ court: CourtDetailPublic }> = ({ court }) => (
<div className="row">
<div>
<div className="venue">{court.venue_name} – {court.court_name}</div>
{court.address && <div className="muted">{court.address}</div>}
</div>
</div>
);