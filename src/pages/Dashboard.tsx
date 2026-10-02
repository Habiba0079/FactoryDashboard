import { useEffect, useState } from "react";
import SearchSelect from "../components/SearchSelect";
import WeeklyChart from "../components/WeeklyChart";
import { getModels, getPayments } from "../services/api";
import type { Model, Payment } from "../types";
import {
  calculateSummary,
  groupByWeek,
  selectPeriod,
  sortModelsByDate,
} from "../utils/calculations";
import {
  formatCurrency,
  formatMeters,
  formatNumber,
} from "../utils/format";

const WEEKS_SHOWN = 12;

// لو الـ id اللي كنا مختارينه اتحذف، نرجع للافتراضي (null)
const existing = (id: string | null, list: { id: string }[]) =>
  id !== null && list.some((item) => item.id === id) ? id : null;

function Dashboard() {
  const [models, setModels] = useState<Model[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // null = الافتراضي: أول موديل / آخر موديل / من غير نهاية للدفعات
  const [startModelId, setStartModelId] = useState<string | null>(null);
  const [endModelId, setEndModelId] = useState<string | null>(null);
  const [paymentsEndId, setPaymentsEndId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const [modelsData, paymentsData] = await Promise.all([
          getModels(),
          getPayments(),
        ]);
        if (cancelled) return;
        setModels(modelsData);
        setPayments(paymentsData);
        setError("");
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("حدث خطأ أثناء تحميل الحساب");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function retry() {
    setLoading(true);
    setError("");
    setReloadKey((key) => key + 1);
  }

  // لما البداية تتغير، لو النهاية بقت قبلها نرجّعها للافتراضي
  function handleStartChange(id: string | null) {
    setStartModelId(id);

    if (id !== null && endModelId !== null) {
      const sorted = sortModelsByDate(models);
      const startIndex = sorted.findIndex((m) => m.id === id);
      const endIndex = sorted.findIndex((m) => m.id === endModelId);
      if (endIndex < startIndex) setEndModelId(null);
    }
  }

  function resetPeriod() {
    setStartModelId(null);
    setEndModelId(null);
    setPaymentsEndId(null);
  }

  if (loading) return <p className="state">جاري تحميل الحساب...</p>;

  if (error) {
    return (
      <div className="state state-error">
        <p>{error}</p>
        <button className="btn" onClick={retry}>
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // ---------- الحسابات (مش state، بتتحسب من اللي فوق) ----------
  const sortedModels = sortModelsByDate(models);

  const startId = existing(startModelId, sortedModels);
  const endId = existing(endModelId, sortedModels);
  const payEndId = existing(paymentsEndId, payments);
  const paymentsEndDate = payments.find((p) => p.id === payEndId)?.date ?? null;

  const options = {
    startModelId: startId ?? sortedModels[0]?.id ?? "",
    endModelId: endId,
    paymentsEndDate,
  };

  const summary = calculateSummary(models, payments, options);
  const { periodModels, periodPayments } = selectPeriod(
    models,
    payments,
    options,
  );
  const weeks = groupByWeek(periodModels, periodPayments).slice(-WEEKS_SHOWN);

  // ---------- قوايم الاختيار (الأحدث فوق) ----------
  const modelItem = (m: Model) => ({
    value: m.id,
    label: `${m.modelName} — ${m.date} — ${formatNumber(m.quantity)} قطعة`,
    date: m.date,
  });

  const startItems = [...sortedModels].reverse().map(modelItem);

  // النهاية: من موديل البداية فما بعد بس
  const startIndex = startId
    ? sortedModels.findIndex((m) => m.id === startId)
    : 0;
  const endItems = sortedModels.slice(startIndex).reverse().map(modelItem);

  const paymentItems = [...payments]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((p) => ({
      value: p.id,
      label: `${p.date} — ${formatCurrency(p.amount)}`,
      date: p.date,
    }));

  const isCustomPeriod =
    startId !== null || endId !== null || payEndId !== null;

  // ---------- لون كارت الرصيد ----------
  const tone =
    summary.balance > 0 ? "positive" : summary.balance < 0 ? "negative" : "zero";
  const balanceText =
    summary.balance > 0
      ? "مستحق للمصنع"
      : summary.balance < 0
        ? "مستحق للتاجر"
        : "الحساب متسوي";

  return (
    <section>
      <div className="page-head">
        <h1>الحسابات</h1>
        <button className="btn" onClick={retry}>
          تحديث
        </button>
      </div>

      <details className="panel">
        <summary>
          فترة الحساب: {isCustomPeriod ? "مخصصة" : "كل الموديلات والدفعات"}
        </summary>

        <div className="filters">
          <div>
            <span className="filter-label">من موديل</span>
            <SearchSelect
              items={startItems}
              value={startId}
              onChange={handleStartChange}
              placeholder="ابحثي باسم الموديل"
              emptyLabel="أول موديل (تلقائي)"
            />
          </div>
          <div>
            <span className="filter-label">إلى موديل</span>
            <SearchSelect
              items={endItems}
              value={endId}
              onChange={setEndModelId}
              placeholder="ابحثي باسم الموديل"
              emptyLabel="آخر موديل (تلقائي)"
            />
          </div>
          <div>
            <span className="filter-label">آخر دفعة محسوبة</span>
            <SearchSelect
              items={paymentItems}
              value={payEndId}
              onChange={setPaymentsEndId}
              placeholder="ابحثي بالتاريخ أو القيمة"
              emptyLabel="كل الدفعات (تلقائي)"
            />
          </div>
        </div>

        {isCustomPeriod && (
          <button className="btn btn-sm" onClick={resetPeriod}>
            إعادة ضبط الفترة
          </button>
        )}
      </details>

      <div className={`balance-card ${tone}`}>
        <span>الرصيد الحالي</span>
        <strong>{formatCurrency(Math.abs(summary.balance))}</strong>
        <em>{balanceText}</em>
      </div>

      <div className="cards">
        <div className="card">
          <span>إجمالي قيمة الشغل</span>
          <strong>{formatCurrency(summary.totalWork)}</strong>
        </div>
        <div className="card">
          <span>إجمالي الدفعات</span>
          <strong>{formatCurrency(summary.totalPayments)}</strong>
        </div>
        <div className="card">
          <span>إجمالي القطع</span>
          <strong>{formatNumber(summary.totalPieces)} قطعة</strong>
        </div>
        <div className="card">
          <span>إجمالي المتراج</span>
          <strong>{formatMeters(summary.totalFabricCm)}</strong>
        </div>
      </div>

      <div className="panel">
        <h2>الصافي الأسبوعي</h2>
        <WeeklyChart data={weeks} />
        <p className="chart-note">
          <span className="dot dot-pos" /> أزرق: الشغل أكبر من الدفعات (مستحق
          للمصنع زاد) · <span className="dot dot-neg" /> أحمر: الدفعات أكبر من
          الشغل. الصافي = قيمة الشغل − الدفعات في الأسبوع، ومش ربح فعلي لأن
          تكاليف المصنع مش متسجلة. الأسبوع بيبدأ من السبت، وآخر {WEEKS_SHOWN}{" "}
          أسبوع داخل الفترة المختارة.
        </p>
      </div>
    </section>
  );
}

export default Dashboard;
