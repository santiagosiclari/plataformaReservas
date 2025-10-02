import { useEffect, useMemo, useState } from "react";
import type { AvailabilitySlot } from "../../api/courts.api";


export interface SelectionInfo {
start: string;
end: string;
count: number;
allFree: boolean;
totalPrice: number | null;
currency: string;
items: AvailabilitySlot[];
a: number; b: number;
}


export function useSelection(daySlots: AvailabilitySlot[], startISO: string, endISO: string, slotsCountParam?: string | null) {
const [priceWarn, setPriceWarn] = useState<string | null>(null);
const [selectionError, setSelectionError] = useState<string | null>(null);


const selection: SelectionInfo | null = useMemo(() => {
if (!daySlots?.length) return null;
const startIdx = daySlots.findIndex((s) => s.start === startISO);
const endIdx = daySlots.findIndex((s) => s.end === endISO);
if (startIdx === -1 || endIdx === -1) return null;


const a = Math.min(startIdx, endIdx);
const b = Math.max(startIdx, endIdx);
const slice = daySlots.slice(a, b + 1);


const allFree = slice.every((s) => s.available);
const tot = slice.reduce((acc, s) => acc + (typeof s.price_per_slot === "number" ? s.price_per_slot : 0), 0);
const pricedCount = slice.filter((s) => typeof s.price_per_slot === "number").length;


return {
start: slice[0].start,
end: slice[slice.length - 1].end,
count: slice.length,
allFree,
totalPrice: pricedCount === slice.length ? tot : null,
currency: slice.find((s) => s.currency)?.currency ?? "ARS",
items: slice,
a, b,
};
}, [daySlots, startISO, endISO]);


useEffect(() => {
setPriceWarn(null);
setSelectionError(null);
if (!selection) return;


const slotsParamNum = Number(slotsCountParam || "0");
if (slotsParamNum && selection.count !== slotsParamNum) {
setPriceWarn(`La cantidad de turnos cambió: ${selection.count} seleccionados (antes ${slotsParamNum}).`);
}
if (!selection.allFree) {
setSelectionError("Uno o más horarios ya no están disponibles. Volvé al detalle y elegí otra franja.");
}
}, [selection, slotsCountParam]);


return { selection, priceWarn, selectionError } as const;
}