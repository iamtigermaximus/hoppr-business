// Shared CSV export utility — converts structured data to a downloadable CSV file

export interface CsvSheet {
  /** Name shown in the filename, e.g. "overview" */
  name: string;
  /** Column headers */
  headers: string[];
  /** Data rows — each row is an array matching header length */
  rows: (string | number)[][];
}

/**
 * Escape a single CSV cell value.
 * Wraps in double-quotes and escapes internal quotes.
 */
function escapeCell(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of CsvSheet definitions into a single CSV string.
 * Each sheet is separated by a blank line with a title row.
 */
export function sheetsToCSV(sheets: CsvSheet[]): string {
  const blocks: string[] = [];

  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    if (i > 0) blocks.push(""); // blank separator

    blocks.push(`# ${sheet.name}`);
    blocks.push(sheet.headers.map(escapeCell).join(","));
    for (const row of sheet.rows) {
      blocks.push(row.map(escapeCell).join(","));
    }
  }

  // BOM for Excel UTF-8 compatibility
  return "﻿" + blocks.join("\n");
}

/**
 * Trigger a browser download of a CSV file.
 * @param filename — without extension, ".csv" is appended
 * @param sheets — one or more sheets to include
 */
export function downloadCSV(filename: string, sheets: CsvSheet[]): void {
  const csv = sheetsToCSV(sheets);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Quick one-sheet download — convenience wrapper.
 */
export function downloadSimpleCSV(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
): void {
  downloadCSV(filename, [{ name: filename, headers, rows }]);
}
