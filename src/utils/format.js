const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTime(value) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}

export function formatQuantity(value, unit = "") {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (Number.isNaN(number)) return "—";
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 3,
  }).format(number);
  return unit ? `${formatted} ${unit}` : formatted;
}
