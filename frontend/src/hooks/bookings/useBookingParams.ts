import { useSearchParams } from "react-router-dom";


export function useBookingParams() {
const [params] = useSearchParams();
const courtId = Number(params.get("courtId"));
const date = params.get("date") || ""; // YYYY-MM-DD
const startISO = params.get("start") || ""; // ISO
const endISO = params.get("end") || ""; // ISO
const slotsCountParam = params.get("slots");


const hasAll = !!courtId && !!date && !!startISO && !!endISO;


return { courtId, date, startISO, endISO, slotsCountParam, hasAll };
}