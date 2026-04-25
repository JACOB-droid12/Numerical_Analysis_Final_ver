export function csvEscapeCell(value: unknown): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function rowsToCsv(rows: unknown[][]): string {
  return rows.map((row) => row.map(csvEscapeCell).join(',')).join('\r\n');
}
