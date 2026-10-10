export function formatDeadline(iso: string, timeZone?: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function isValidDate(value: string | null): value is string {
  return value !== null && !Number.isNaN(Date.parse(value));
}
