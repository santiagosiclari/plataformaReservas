export const todayISO = () => new Date().toISOString().slice(0, 10);
export const subDaysISO = (days: number) => {
  const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10);
};
