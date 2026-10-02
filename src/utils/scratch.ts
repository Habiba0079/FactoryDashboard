/// test

import { calculateSummary } from "./calculations";

// موديل A: تاريخ 2026-10-01، قطع 50، إجمالي سعر 3000، متراج 5850
// موديل B: تاريخ 2026-10-05، قطع 55، إجمالي سعر 3025، متراج 8525
// دفعات: 2026-09-28 بـ 1000، و2026-10-02 بـ 2000، و2026-10-10 بـ 500

const models = [
  {
    id: "A",
    date: "2026-10-01",
    quantity: 50,
    totalPrice: 3000,
    totalFabricCm: 5850,
  },
  {
    id: "B",
    date: "2026-10-05",
    quantity: 55,
    totalPrice: 3025,
    totalFabricCm: 8525,
  },
];

const payments = [
  { date: "2026-09-28", amount: 1000 },
  { date: "2026-10-02", amount: 2000 },
  { date: "2026-10-10", amount: 500 },
];

const summary = calculateSummary(models, payments, {
  startModelId: "A",
  endModelId: "B",
  paymentsEndDate: null,
});

console.log("إجمالي قيمة الشغل:", summary.totalWork); // يجب أن يكون 6025
console.log("إجمالي الدفعات:", summary.totalPayments);
console.log("الباقي:", summary.balance);
console.log("إجمالي القطع:", summary.totalPieces);
console.log("إجمالي نسيج (سم):", summary.totalFabricCm);
