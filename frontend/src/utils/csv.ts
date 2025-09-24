export function toCSVRow(values: (string | number | null | undefined)[]): string {
    return values.map(v => {
      if (v == null) return "";
      const s = String(v);
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(",");
  }
  
  export function downloadCSV(name: string, header: string[], rows: (string|number|null|undefined)[][]) {
    const csv = [toCSVRow(header), ...rows.map(toCSVRow)].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }
  