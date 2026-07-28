function csvCell(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * Exports report data as a UTF-8 CSV file. Excel opens CSV files directly,
 * and this avoids shipping spreadsheet parsers with known security issues.
 */
export function exportToExcel(filename: string, sheets: { name: string; rows: Record<string, unknown>[] }[]) {
  const sections = sheets.map((sheet) => {
    const headers = Array.from(new Set(sheet.rows.flatMap((row) => Object.keys(row))));
    const lines = [
      [sheet.name],
      headers,
      ...sheet.rows.map((row) => headers.map((header) => row[header])),
    ];
    return lines.map((line) => line.map(csvCell).join(",")).join("\r\n");
  });
  const blob = new Blob([`\uFEFF${sections.join("\r\n\r\n")}`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename.replace(/\.(xlsx|csv)$/i, "")}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
