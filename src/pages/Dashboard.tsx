import { useEffect, useState } from "react";
import { getSummary } from "../services/api";
import type { Summary } from "../types";
import { formatCurrency, formatMeters, formatNumber } from "../utils/format";

function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const data = await getSummary();
        if (cancelled) return;
        setSummary(data);
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

  if (loading) return <p className="state">جاري تحميل الحساب...</p>;

  if (error || !summary) {
    return (
      <div className="state state-error">
        <p>{error || "لا توجد بيانات"}</p>
        <button className="btn" onClick={retry}>
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const tone =
    summary.balance > 0 ? "owed-factory" : summary.balance < 0 ? "owed-trader" : "settled";
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
    </section>
  );
}

export default Dashboard;
