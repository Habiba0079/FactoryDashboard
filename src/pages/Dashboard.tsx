import { useEffect, useState } from "react";
import { getSummary } from "../services/api";
import type { Summary } from "../services/api";

function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSummary() {
      try {
        const data = await getSummary();
        setSummary(data);
      } catch (error) {
        console.error(error);
        setError("حدث خطأ أثناء تحميل الحساب");
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, []);

  if (loading) {
    return <p>جاري تحميل الحساب...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!summary) {
    return null;
  }

  const balanceText =
    summary.balance > 0
      ? "مستحق للمصنع"
      : summary.balance < 0
        ? "مستحق للتاجر"
        : "الحساب متسوي";

  return (
    <main>
      <h1>الحسابات</h1>

      <section>
        <h2>ملخص الحساب</h2>

        <div>
          <p>إجمالي قيمة الشغل</p>
          <strong>{summary.totalWork} جنيه</strong>
        </div>

        <div>
          <p>إجمالي الدفعات</p>
          <strong>{summary.totalPayments} جنيه</strong>
        </div>

        <div>
          <p>إجمالي القطع</p>
          <strong>{summary.totalPieces} قطعة</strong>
        </div>

        <div>
          <p>إجمالي المتراج</p>
          <strong>{summary.totalFabricCm / 100} متر</strong>
        </div>
      </section>

      <section>
        <h2>الرصيد الحالي</h2>

        <strong>
          {Math.abs(summary.balance)} جنيه
        </strong>

        <p>{balanceText}</p>
      </section>
    </main>
  );
}

export default Dashboard;