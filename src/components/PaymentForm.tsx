import { useState } from "react";
import Field from "./Field";
import type { NewPaymentData, Payment } from "../types";
import { hasErrors, validatePayment } from "../utils/validation";
import type { Errors } from "../utils/validation";
import { formatCurrency, toDateInput, today } from "../utils/format";

interface PaymentFormProps {
  initial?: Payment;
  onSubmit: (data: NewPaymentData) => Promise<void>;
  onCancel: () => void;
  /** Returns an existing payment that looks like a double entry of `data`, if any. */
  findDuplicate?: (data: NewPaymentData) => Payment | null;
}

interface FormState {
  date: string;
  amount: string;
  notes: string;
}

function PaymentForm({ initial, onSubmit, onCancel, findDuplicate }: PaymentFormProps) {
  const [form, setForm] = useState<FormState>({
    date: initial ? toDateInput(initial.date) : today(),
    amount: initial ? String(initial.amount) : "",
    notes: initial?.notes ?? "",
  });
  const [errors, setErrors] = useState<Errors<NewPaymentData>>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  // Set after the first save attempt finds a possible double entry; saving again confirms it.
  const [duplicate, setDuplicate] = useState<Payment | null>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    setDuplicate(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data: NewPaymentData = {
      date: form.date,
      amount: Number(form.amount),
      notes: form.notes.trim(),
    };

    const found = validatePayment(data);
    setErrors(found);
    if (hasErrors(found)) return;

    if (findDuplicate && duplicate === null) {
      const existing = findDuplicate(data);
      if (existing) {
        setDuplicate(existing);
        return;
      }
    }

    try {
      setSaving(true);
      setSubmitError("");
      await onSubmit(data);
    } catch (error) {
      console.error(error);
      setSubmitError("حدث خطأ أثناء الحفظ، حاول مرة تانية");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Field
        label="التاريخ"
        type="date"
        name="date"
        value={form.date}
        onChange={handleChange}
        error={errors.date}
      />
      <Field
        label="قيمة الدفعة (جنيه)"
        type="number"
        inputMode="decimal"
        name="amount"
        value={form.amount}
        onChange={handleChange}
        error={errors.amount}
      />
      <Field
        label="ملاحظات (اختياري)"
        type="text"
        name="notes"
        value={form.notes}
        onChange={handleChange}
      />

      {duplicate && (
        <p className="form-warning">
          فيه دفعة بنفس البيانات متسجلة بالفعل ({toDateInput(duplicate.date)} —{" "}
          {formatCurrency(duplicate.amount)}). لو ده مقصود اضغطي "احفظ برضه"،
          ولو لأ اضغطي "إلغاء".
        </p>
      )}
      {submitError && <p className="form-error">{submitError}</p>}

      <div className="actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving
            ? "جاري الحفظ..."
            : duplicate
              ? "احفظ برضه"
              : initial
                ? "حفظ التعديل"
                : "تسجيل الدفعة"}
        </button>
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>
          إلغاء
        </button>
      </div>
    </form>
  );
}

export default PaymentForm;
