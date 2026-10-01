const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export const formatNumber = (value: number) => numberFormat.format(value);

export const formatCurrency = (value: number) =>
  `${formatNumber(value)} جنيه`;

/** السنتيمتر → متر */
export const cmToMeters = (cm: number) => cm / 100;

export const formatMeters = (cm: number) =>
  `${formatNumber(cmToMeters(cm))} متر`;

/** تاريخ اليوم بصيغة yyyy-mm-dd حسب توقيت الجهاز (مش UTC) */
export function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** بيقبل yyyy-mm-dd أو ISO كامل ويرجّع yyyy-mm-dd */
export function toDateInput(value: string): string {
  return value ? value.slice(0, 10) : "";
}
