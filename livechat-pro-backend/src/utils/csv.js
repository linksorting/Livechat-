export function toCsv(rows = []) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);

  const escape = (value) => {
    const raw = value == null ? "" : String(value);
    if (raw.includes('"') || raw.includes(",") || raw.includes("\n")) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  };

  return [headers.join(","), ...rows.map((row) => headers.map((key) => escape(row[key])).join(","))].join("\n");
}
