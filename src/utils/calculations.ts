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
}

/** الموديلات مترتبة بالتاريخ (نسخة جديدة، والأصلية ما بتتغيرش) */
export const sortModelsByDate = (models: Model[]): Model[] =>
  [...models].sort((a, b) => a.date.localeCompare(b.date));

/**
 * بتحدد الموديلات والدفعات اللي داخلة في الفترة المختارة.
 * لو الاختيار غلط (موديل مش موجود، أو البداية بعد النهاية) بترجّع مصفوفتين فاضيتين.
 */
export function selectPeriod(
  models: Model[],
  payments: Payment[],
  { startModelId, endModelId, paymentsEndDate }: SummaryOptions,
): { periodModels: Model[]; periodPayments: Payment[] } {
  const sorted = sortModelsByDate(models);
  const startIndex = sorted.findIndex((m) => m.id === startModelId);

  const endIndex = endModelId
    ? sorted.findIndex((m) => m.id === endModelId)
    : sorted.length - 1;

  if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
    return { periodModels: [], periodPayments: [] };
  }

  const periodModels = sorted.slice(startIndex, endIndex + 1);
  const startDate = sorted[startIndex].date;

  const periodPayments = payments.filter(
    (p) =>
      p.date >= startDate &&
      (paymentsEndDate === null || p.date <= paymentsEndDate),
  );

  return { periodModels, periodPayments };
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

// ---------------------------------------------------------------- أسبوعي

export interface WeekPoint {
  weekStart: string; // yyyy-MM-dd (أول يوم في الأسبوع = السبت)
  work: number; // قيمة الشغل في الأسبوع
  payments: number; // الدفعات في الأسبوع
  net: number; // الصافي = الشغل - الدفعات
}

const DAY_MS = 86_400_000;

// بنشتغل بـ UTC عشان فرق التوقيت ما يزحزحش اليوم
const toUtcMs = (date: string) => {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUtcMs = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** أول يوم (سبت) في أسبوع التاريخ ده */
export function weekStart(date: string): string {
  const ms = toUtcMs(date);
  const day = new Date(ms).getUTCDay(); // 0=الأحد ... 6=السبت
  const sinceSaturday = (day + 1) % 7;
  return fromUtcMs(ms - sinceSaturday * DAY_MS);
}

/** بتجمّع الموديلات والدفعات في أسابيع (بتملى الأسابيع الفاضية بأصفار) */
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
