import { useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  CashIcon,
  MannequinIcon,
  NeedleIcon,
  ScissorsIcon,
} from "../components/icons";
import Modal from "../components/Modal";
import SearchSelect from "../components/SearchSelect";
import SettlementModal from "../components/SettlementModal";
import WeeklyChart from "../components/WeeklyChart";
import { useData } from "../data/useData";
import { deleteSettlement } from "../services/api";
import type { Model, Settlement } from "../types";
import {
  calculateSummary,
  groupByWeek,
  selectPeriod,
  sortModelsByDate,
} from "../utils/calculations";
import { formatCurrency, formatNumber } from "../utils/format";

const WEEKS_SHOWN = 7;

// لو الـ id اللي كنا مختارينه اتحذف، نرجع للافتراضي (null)
const existing = (id: string | null, list: { id: string }[]) =>
  id !== null && list.some((item) => item.id === id) ? id : null;

function Dashboard() {
  const {
    models,
    payments,
    settlements,
    setSettlements,
    loading,
    hasData,
    refreshing,
    error,
    refresh,
    lastSettlementDate,
  } = useData();

  // null = الافتراضي: أول موديل / آخر موديل / من غير نهاية للدفعات
  const [startModelId, setStartModelId] = useState<string | null>(null);
  const [endModelId, setEndModelId] = useState<string | null>(null);
  const [paymentsEndId, setPaymentsEndId] = useState<string | null>(null);

  // عرض الحساب من الأول (تجاهل آخر تسوية)
  const [ignoreSettlement, setIgnoreSettlement] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deletingSettlement, setDeletingSettlement] =
    useState<Settlement | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const settledUpTo = ignoreSettlement ? null : lastSettlementDate;

  // الموديلات والدفعات اللي لسه بتتحسب (بعد آخر تسوية)
  const sortedModels = sortModelsByDate(models).filter(
    (m) => settledUpTo === null || m.date > settledUpTo,
  );
  const eligiblePayments = payments.filter(
    (p) => settledUpTo === null || p.date > settledUpTo,
  );

  function resetPeriod() {
    setStartModelId(null);
    setEndModelId(null);
    setPaymentsEndId(null);
  }

  // لما البداية تتغير، لو النهاية بقت قبلها نرجّعها للافتراضي
  function handleStartChange(id: string | null) {
    setStartModelId(id);

    if (id !== null && endModelId !== null) {
      const startIndex = sortedModels.findIndex((m) => m.id === id);
      const endIndex = sortedModels.findIndex((m) => m.id === endModelId);
      if (endIndex < startIndex) setEndModelId(null);
    }
  }

  function handleSettlementCreated(created: Settlement) {
    setSettlements((prev) => [...prev, created]);
    resetPeriod();
    setIgnoreSettlement(false);
    setSettleOpen(false);
  }

  async function handleDeleteSettlement() {
    if (!deletingSettlement) return;
    try {
      setDeleteBusy(true);
      setActionError("");
      await deleteSettlement(deletingSettlement.id);
      setSettlements((prev) =>
        prev.filter((s) => s.id !== deletingSettlement.id),
      );
      resetPeriod();
      setDeletingSettlement(null);
    } catch (err) {
      console.error(err);
      setActionError("تعذر إلغاء التسوية، حاول مرة تانية");
      setDeletingSettlement(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading) return <p className="state">جاري تحميل الحساب...</p>;

  if (!hasData && error) {
    return (
      <div className="state state-error">
        <p>{error}</p>
        <button className="btn" onClick={refresh}>
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // ---------- الحسابات (مش state، بتتحسب من اللي فوق) ----------
  const startId = existing(startModelId, sortedModels);
  const endId = existing(endModelId, sortedModels);
  const payEndId = existing(paymentsEndId, eligiblePayments);
  const paymentsEndDate =
    payments.find((p) => p.id === payEndId)?.date ?? null;

  const options = {
    startModelId: startId ?? sortedModels[0]?.id ?? "",
    endModelId: endId,
    paymentsEndDate,
    settledUpTo,
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

  const paymentItems = [...eligiblePayments]
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
        <button className="btn" onClick={refresh} disabled={refreshing}>
          {refreshing ? "جاري التحديث..." : "تحديث"}
        </button>
      </div>

      {error && hasData && (
        <p className="form-error">تعذر التحديث، بنعرض آخر بيانات محفوظة.</p>
      )}
      {actionError && <p className="form-error">{actionError}</p>}

      <div className="settle-bar">
        <NeedleIcon size={20} />
        <span>
          {lastSettlementDate
            ? `آخر تسوية: لحد ${lastSettlementDate}`
            : "لا توجد تسويات سابقة"}
        </span>
        <button className="btn btn-sm" onClick={() => setSettleOpen(true)}>
          تسوية الحساب
        </button>
        {settlements.length > 0 && (
          <button className="btn btn-sm" onClick={() => setHistoryOpen(true)}>
            سجل التسويات
          </button>
        )}
      </div>

      {lastSettlementDate && (
        <label className="toggle">
          <input
            type="checkbox"
            checked={ignoreSettlement}
            onChange={(e) => {
              setIgnoreSettlement(e.target.checked);
              resetPeriod();
            }}
          />
          عرض الحساب من الأول (تجاهل التسوية)
        </label>
      )}

      <details className="panel">
        <summary>
          فترة الحساب: {isCustomPeriod ? "مخصصة" : "الافتراضية"}
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
        <span>
          الرصيد الحالي
          {settledUpTo ? ` (من بعد ${settledUpTo})` : ""}
        </span>
        <strong>{formatCurrency(Math.abs(summary.balance))}</strong>
        <em>{balanceText}</em>
      </div>

      <div className="cards">
        <div className="card">
          <span>
            <ScissorsIcon size={16} /> إجمالي قيمة الشغل
          </span>
          <strong>{formatCurrency(summary.totalWork)}</strong>
        </div>
        <div className="card">
          <span>
            <CashIcon size={16} /> إجمالي الدفعات
          </span>
          <strong>{formatCurrency(summary.totalPayments)}</strong>
        </div>
        <div className="card">
          <span>
            <MannequinIcon size={16} /> إجمالي القطع
          </span>
          <strong>{formatNumber(summary.totalPieces)} قطعة</strong>
        </div>
      </div>

      <div className="panel">
        <h2>الصافي الأسبوعي (آخر {WEEKS_SHOWN} أسابيع)</h2>
        <WeeklyChart data={weeks} />
        <p className="chart-note">
          <span className="dot dot-pos" /> أزرق: الشغل أكبر من الدفعات (مستحق
          للمصنع زاد) · <span className="dot dot-neg" /> أحمر: الدفعات أكبر من
          الشغل. الصافي = قيمة الشغل − الدفعات في الأسبوع، ومش ربح فعلي لأن
          تكاليف المصنع مش متسجلة. الأسبوع بيبدأ من السبت.
        </p>
      </div>

      {settleOpen && (
        <SettlementModal
          models={models}
          payments={payments}
          lastSettlementDate={lastSettlementDate}
          onClose={() => setSettleOpen(false)}
          onCreated={handleSettlementCreated}
        />
      )}

      {historyOpen && (
        <Modal title="سجل التسويات" onClose={() => setHistoryOpen(false)}>
          <ul className="history">
            {[...settlements]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((s) => (
                <li key={s.id}>
                  <div>
                    <strong>لحد {s.date}</strong>
                    {s.notes && <small>{s.notes}</small>}
                  </div>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => setDeletingSettlement(s)}
                  >
                    إلغاء التسوية
                  </button>
                </li>
              ))}
          </ul>
          <div className="actions">
            <button className="btn" onClick={() => setHistoryOpen(false)}>
              إغلاق
            </button>
          </div>
        </Modal>
      )}

      {deletingSettlement && (
        <ConfirmDialog
          title="إلغاء التسوية"
          message={`متأكدة إنك عايزة تلغي تسوية ${deletingSettlement.date}؟ الحساب هيرجع يحسب من قبلها.`}
          confirmLabel="إلغاء التسوية"
          busy={deleteBusy}
          onConfirm={handleDeleteSettlement}
          onCancel={() => setDeletingSettlement(null)}
        />
      )}
    </section>
  );
}

export default Dashboard;
