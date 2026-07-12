export type CsvColumn<T> = { header: string; value: (row: T) => string | number | null | undefined };

function escapeCell(raw: string | number | null | undefined): string {
  const s = raw == null ? "" : String(raw);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [
    columns.map((c) => escapeCell(c.header)).join(","),
    ...rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(",")),
  ];
  return lines.join("\r\n") + "\r\n";
}
