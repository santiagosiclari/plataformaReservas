export const fmtMoney = (n: number) =>
    n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
  
  export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString();
  