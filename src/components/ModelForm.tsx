import { useState } from "react";
import Field from "./Field";
import type { Model, NewModelData } from "../types";
import { hasErrors, validateModel } from "../utils/validation";
import type { Errors } from "../utils/validation";
import { toDateInput, today } from "../utils/format";

interface ModelFormProps {
  initial?: Model;
  onSubmit: (data: NewModelData) => Promise<void>;
  onCancel: () => void;
}

// الحقول بتتخزن كنص عشان المستخدم يقدر يمسح الرقم ويكتب من جديد براحته
interface FormState {
  date: string;
  modelName: string;
  quantity: string;
  pricePerPiece: string;
  fabricCm: string;
}

function ModelForm({ initial, onSubmit, onCancel }: ModelFormProps) {
  const [form, setForm] = useState<FormState>({
    date: initial ? toDateInput(initial.date) : today(),
    modelName: initial?.modelName ?? "",
    quantity: initial ? String(initial.quantity) : "",
    pricePerPiece: initial ? String(initial.pricePerPiece) : "",
    fabricCm: initial ? String(initial.fabricCm) : "",
  });
  const [errors, setErrors] = useState<Errors<NewModelData>>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data: NewModelData = {
      date: form.date,
      modelName: form.modelName.trim(),
      quantity: Number(form.quantity),
      pricePerPiece: Number(form.pricePerPiece),
      fabricCm: Number(form.fabricCm),
    };

    const found = validateModel(data);
    setErrors(found);
    if (hasErrors(found)) return;

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
        label="اسم الموديل"
        type="text"
        name="modelName"
        value={form.modelName}
        onChange={handleChange}
        error={errors.modelName}
      />
      <Field
        label="عدد القطع"
        type="number"
        inputMode="numeric"
        name="quantity"
        value={form.quantity}
        onChange={handleChange}
        error={errors.quantity}
      />
      <Field
        label="سعر القطعة (جنيه)"
        type="number"
        inputMode="decimal"
        name="pricePerPiece"
        value={form.pricePerPiece}
        onChange={handleChange}
        error={errors.pricePerPiece}
      />
      <Field
        label="المتراج للقطعة (سم)"
        type="number"
        inputMode="decimal"
        name="fabricCm"
        value={form.fabricCm}
        onChange={handleChange}
        error={errors.fabricCm}
      />

      {submitError && <p className="form-error">{submitError}</p>}

      <div className="actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "جاري الحفظ..." : initial ? "حفظ التعديل" : "إضافة الموديل"}
        </button>
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>
          إلغاء
        </button>
      </div>
    </form>
  );
}

export default ModelForm;
