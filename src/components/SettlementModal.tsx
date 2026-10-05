import { useState } from "react";
import Field from "./Field";
import Modal from "./Modal";
import { createSettlement } from "../services/api";
import type { Model, Payment, Settlement } from "../types";
import { hasDataAfter, summarizeUpTo } from "../utils/calculations";
import { formatCurrency, formatNumber, today } from "../utils/format";

interface SettlementModalProps {
  models: Model[];
  payments: Payment[];
  lastSettlementDate: string | null;
  onClose: () => void;
  onCreated: (settlement: Settlement) => void;
}

function SettlementModal({
  models,
  payments,
  lastSettlementDate,
  onClose,
  onCreated,
}: SettlementModalProps) {
  const [date, setDate] = useState(""); // yyyy-MM-dd (يوم وشهر وسنة)
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const tooEarly =
    date !== "" && lastSettlementDate !== null && date <= lastSettlementDate;

  // معاينة: الرصيد اللي هيتقفل بالتسوية دي
  const preview =
    date && !tooEarly
      ? summarizeUpTo(models, payments, lastSettlementDate, date)
      : null;

  // تحذيرات تمنع التسوية بالغلط
  const coversEverything = preview !== null && !hasDataAfter(models, payments, date);
  const inFuture = date !== "" && date > today();

  async function handleConfirm() {
    if (!date) return setError("اختاري التاريخ الأول");
    if (tooEarly) return setError("التاريخ ده قبل آخر تسوية أو نفس يومها");

    try {
      setSaving(true);
      setError("");
      const created = await createSettlement({ date, notes: notes.trim() });
      onCreated(created);
    } catch (err) {
      console.error(err);
      setError("تعذر تسجيل التسوية، حاول مرة تانية");
      setSaving(false);
    }
  }

  return (
    <Modal title="تسوية الحساب" onClose={onClose}>
      <p className="muted">
        التسوية بتقفل الحساب لحد اليوم اللي تختاريه (شامل اليوم ده). الحساب
        الجديد بيبدأ من اليوم اللي بعده، وكل اللي قبل كده بيفضل موجود في
        الجداول بس مش بيتحسب. وتقدري تلغي التسوية بعدين من "سجل التسويات".
      </p>

      <Field
        label="تسوية لحد يوم"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        error={tooEarly ? "التاريخ ده قبل آخر تسوية أو نفس يومها" : undefined}
      />
      <Field
        label="ملاحظات (اختياري)"
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {preview && (
        <div className="settle-preview">
          <div>
            لحد <strong>{date}</strong>
          </div>
          <div>
            الشغل: {formatCurrency(preview.totalWork)} — الدفعات:{" "}
            {formatCurrency(preview.totalPayments)} (
            {formatNumber(preview.totalPieces)} قطعة)
          </div>
          <div>
            الرصيد اللي هيتقفل:{" "}
            <strong>
              {formatCurrency(Math.abs(preview.balance))}{" "}
              {preview.balance > 0
                ? "مستحق للمصنع"
                : preview.balance < 0
                  ? "مستحق للتاجر"
                  : "(متسوي)"}
            </strong>
          </div>
          {coversEverything && (
            <div className="form-error">
              انتبهي: التسوية دي بتغطي <strong>كل</strong> الموديلات والدفعات
              الموجودة، فالداشبورد هيبقى صفر لحد ما تضيفي بيانات بعد التاريخ
              ده. لو ده مش المقصود، اختاري تاريخ أبكر.
            </div>
          )}
          {inFuture && (
            <div className="form-error">
              التاريخ ده في المستقبل، وأي موديل أو دفعة تضيفيها قبله
              مش هتتحسب.
            </div>
          )}
          {preview.balance !== 0 && (
            <div className="form-error">
              انتبهي: الرصيد ده مش هيتنقل للحساب الجديد. لو لسه ما اتسددش
              بالكامل، اتأكدي إنه اتسدد أو اتفقتوا عليه قبل ما تأكدي.
            </div>
          )}
        </div>
      )}

      {error && <p className="form-error">{error}</p>}

      <div className="actions">
        <button
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={saving || !preview}
        >
          {saving ? "جاري التسجيل..." : date ? `تأكيد التسوية لحد ${date}` : "تأكيد التسوية"}
        </button>
        <button className="btn" onClick={onClose} disabled={saving}>
          إلغاء
        </button>
      </div>
    </Modal>
  );
}

export default SettlementModal;
