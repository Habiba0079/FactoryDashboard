const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export const formatNumber = (value: number) => numberFormat.format(value);

export const formatCurrency = (value: number) =>
  `${formatNumber(value)} جنيه`;

/** Convert centimeters to meters. */
export const cmToMeters = (cm: number) => cm / 100;

export const formatMeters = (cm: number) =>
  `${formatNumber(cmToMeters(cm))} متر`;

/** Return today's date as yyyy-MM-dd in local time, not UTC. */
export function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Normalize a yyyy-MM-dd or full ISO date string to yyyy-MM-dd. */
export function toDateInput(value: string): string {
  return value ? value.slice(0, 10) : "";
}
