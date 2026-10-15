import type { Model, Payment, Summary } from "../types";

export const calculateTotalPrice = (quantity: number, pricePerPiece: number) =>
  quantity * pricePerPiece;

export const calculateTotalFabric = (quantity: number, fabricCm: number) =>
  quantity * fabricCm;

export const calculateBalance = (totalWork: number, totalPayments: number) =>
  totalWork - totalPayments;

interface SummaryOptions {
  startModelId: string;
  endModelId: string | null;
  paymentsEndDate: string | null;
  /** Last settled date; earlier dates are excluded. Null means no settlement. */
  settledUpTo?: string | null;
}

/** Sort models by date without mutating the original array. */
export const sortModelsByDate = (models: Model[]): Model[] =>
  [...models].sort((a, b) => a.date.localeCompare(b.date));

/**
 * Select the models and payments included in the chosen period.
 * Returns empty arrays for an invalid selection, such as a missing model or
 * a start model that follows the end model.
 */
export function selectPeriod(
  models: Model[],
  payments: Payment[],
  { startModelId, endModelId, paymentsEndDate, settledUpTo = null }: SummaryOptions,
): { periodModels: Model[]; periodPayments: Payment[] } {
  const afterSettlement = (date: string) =>
    settledUpTo === null || date > settledUpTo;

  const sorted = sortModelsByDate(models).filter((m) => afterSettlement(m.date));

  const eligiblePayments = payments.filter(
    (p) =>
      afterSettlement(p.date) &&
      (paymentsEndDate === null || p.date <= paymentsEndDate),
  );

  // If no models remain (for example, after a settlement), payments alone produce a negative balance.
  if (sorted.length === 0) {
    return { periodModels: [], periodPayments: eligiblePayments };
  }

  const startIndex = sorted.findIndex((m) => m.id === startModelId);

  const endIndex = endModelId
    ? sorted.findIndex((m) => m.id === endModelId)
    : sorted.length - 1;

  if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
    return { periodModels: [], periodPayments: [] };
  }

  const periodModels = sorted.slice(startIndex, endIndex + 1);
  const startDate = sorted[startIndex].date;

  const periodPayments = eligiblePayments.filter((p) => p.date >= startDate);

  return { periodModels, periodPayments };
}

function summarize(periodModels: Model[], periodPayments: Payment[]): Summary {
  const totalWork = periodModels.reduce(
    (sum, model) => sum + model.totalPrice,
    0,
  );
  const totalPayments = periodPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const balance = calculateBalance(totalWork, totalPayments);
  const totalPieces = periodModels.reduce(
    (sum, model) => sum + model.quantity,
    0,
  );
  const totalFabricCm = periodModels.reduce(
    (sum, model) => sum + model.totalFabricCm,
    0,
  );
  return {
    totalWork,
    totalPayments,
    balance,
    totalPieces,
    totalFabricCm,
  };
}

export function calculateSummary(
  models: Model[],
  payments: Payment[],
  options: SummaryOptions,
): Summary {
  const { periodModels, periodPayments } = selectPeriod(
    models,
    payments,
    options,
  );
  return summarize(periodModels, periodPayments);
}

/** Summarize records after `after` through `upTo`, inclusive, for settlement previews. */
export function summarizeUpTo(
  models: Model[],
  payments: Payment[],
  after: string | null,
  upTo: string,
): Summary {
  const inRange = (date: string) =>
    (after === null || date > after) && date <= upTo;

  return summarize(
    models.filter((m) => inRange(m.date)),
    payments.filter((p) => inRange(p.date)),
  );
}

/** Check whether any model or payment exists after the given date. */
export function hasDataAfter(
  models: Model[],
  payments: Payment[],
  date: string,
): boolean {
  return models.some((m) => m.date > date) || payments.some((p) => p.date > date);
}

/** Convert a yyyy-MM month string to the month's final yyyy-MM-dd date. */
export function lastDayOfMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  // Day zero of the following month is the final day of this month.
  return fromUtcMs(Date.UTC(year, monthNumber, 0));
}

// Weekly calculations.

export interface WeekPoint {
  weekStart: string; // yyyy-MM-dd; weeks start on Saturday.
  work: number; // Total work value for the week.
  payments: number; // Total payments for the week.
  net: number; // Net amount: work minus payments.
}

const DAY_MS = 86_400_000;

// Use UTC to prevent time-zone offsets from shifting the date.
const toUtcMs = (date: string) => {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUtcMs = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Return the Saturday that starts the week containing the given date. */
export function weekStart(date: string): string {
  const ms = toUtcMs(date);
  const day = new Date(ms).getUTCDay(); // 0 = Sunday, 6 = Saturday.
  const sinceSaturday = (day + 1) % 7;
  return fromUtcMs(ms - sinceSaturday * DAY_MS);
}

/** Group models and payments by week, filling empty weeks with zero values. */
export function groupByWeek(
  models: Model[],
  payments: Payment[],
): WeekPoint[] {
  const map = new Map<string, { work: number; payments: number }>();

  const bucket = (date: string) => {
    const key = weekStart(date);
    let entry = map.get(key);
    if (!entry) {
      entry = { work: 0, payments: 0 };
      map.set(key, entry);
    }
    return entry;
  };

  models.forEach((m) => {
    bucket(m.date).work += m.totalPrice;
  });
  payments.forEach((p) => {
    bucket(p.date).payments += p.amount;
  });

  const keys = [...map.keys()].sort();
  if (keys.length === 0) return [];

  const points: WeekPoint[] = [];
  const last = toUtcMs(keys[keys.length - 1]);

  for (let t = toUtcMs(keys[0]); t <= last; t += 7 * DAY_MS) {
    const key = fromUtcMs(t);
    const entry = map.get(key) ?? { work: 0, payments: 0 };
    points.push({
      weekStart: key,
      work: entry.work,
      payments: entry.payments,
      net: entry.work - entry.payments,
    });
  }

  return points;
}
