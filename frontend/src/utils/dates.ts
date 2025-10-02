export const todayISO = () => new Date().toISOString().slice(0, 10);
export const subDaysISO = (days: number) => {
  const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10);
};
export function fmtDate(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split("-");
  return `${d}/${m}/${y}`;
  }
  export function fmtHour(iso: string) {
  const dt = new Date(iso);
  return dt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  }