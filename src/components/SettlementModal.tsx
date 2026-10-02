import { useState } from "react";
import Field from "./Field";
import Modal from "./Modal";
import { createSettlement } from "../services/api";
import type { Model, Payment, Settlement } from "../types";
import { lastDayOfMonth, summarizeUpTo } from "../utils/calculations";
import { formatCurrency, formatNumber } from "../utils/format";

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
  const [month, setMonth] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const upTo = month ? lastDayOfMonth(month) : "";
  const tooEarly =
    upTo !== "" && lastSettlementDate !== null && upTo <= lastSettlementDate;

  // معاينة: الرصيد اللي هيتقفل بالتسوية دي
  const preview =
    upTo && !tooEarly
      ? summarizeUpTo(models, payments, lastSettlementDate, upTo)
      : null;

  async function handleConfirm() {
    if (!upTo) return setError("اختاري الشهر الأول");
    if (tooEarly) return setError("الشهر ده قبل آخر تسوية أو نفس شهرها");

    try {
      setSaving(true);
      setError("");
      const created = await createSettlement({ date: upTo, notes: notes.trim() });
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
        التسوية بتقفل الحساب لحد آخر يوم في الشهر اللي تختاريه. الحساب الجديد
        بيبدأ من اليوم اللي بعده، وكل اللي قبل كده بيفضل موجود في الجداول بس
        مش بيتحسب.
      </p>

      <Field
        label="تسوية لحد نهاية شهر"
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        error={tooEarly ? "الشهر ده قبل آخر تسوية أو نفس شهرها" : undefined}
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
            لحد <strong>{upTo}</strong>
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
          {saving ? "جاري التسجيل..." : "تأكيد التسوية"}
        </button>
        <button className="btn" onClick={onClose} disabled={saving}>
          إلغاء
        </button>
      </div>
    </Modal>
  );
}

export default SettlementModal;
