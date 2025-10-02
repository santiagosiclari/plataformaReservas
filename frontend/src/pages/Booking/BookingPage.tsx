import React from "react";
import { Link } from "react-router-dom";
import { useBookingParams } from "../../hooks/bookings/useBookingParams";
import { useCourtAndSlots } from "../../hooks/bookings/useCourtAndSlots";
import { useSelection } from "../../hooks/bookings/useSelection";
import { useBookingConfirm } from "../../hooks/bookings/useBookingConfirm";
import { BookingHeader } from "../../components/booking/BookingHeader";
import { InfoGrid } from "../../components/booking/InfoGrid";
import { SlotsDetail } from "../../components/booking/SlotsDetail";
import { TotalRow } from "../../components/booking/TotalRow";
import { Actions } from "../../components/booking/ActionsCell";
import "./booking.css";


const BookingPage: React.FC = () => {
const { courtId, date, startISO, endISO, slotsCountParam, hasAll } = useBookingParams();
const { court, daySlots, loading, err, setErr } = useCourtAndSlots(courtId, date);
const { selection, priceWarn, selectionError } = useSelection(daySlots, startISO, endISO, slotsCountParam);
const { handleConfirm, submitting, err: submitErr, setErr: setSubmitErr } = useBookingConfirm(court, selection);


// Estados de carga/errores equivalentes al componente original
if (loading) return <div className="booking-page">Cargando…</div>;


if (!hasAll || err || selectionError) {
const message = !hasAll ? "Faltan parámetros de la reserva." : (err || selectionError || null);
return (
<div className="booking-page">
{message && <div className="alert error">{message}</div>}
{courtId && date && (
<Link className="btn" to={`/courts/${courtId}?date=${date}`}>Ver horarios</Link>
)}
</div>
);
}


if (!court || !selection) return null;


return (
<div className="booking-page">
<div className="summary-card">
<h1 className="title">📅 Confirmar reserva</h1>


<BookingHeader court={court} />
<InfoGrid date={date} selection={selection} />
<SlotsDetail selection={selection} />
<TotalRow selection={selection} />


{priceWarn && <div className="alert warn">{priceWarn}</div>}
{submitErr && <div className="alert error">{submitErr}</div>}


<Actions
court={court}
date={date}
disabled={!selection.allFree || submitting}
onConfirm={handleConfirm}
submitting={submitting}
/>
</div>
</div>
);
};


export default BookingPage;