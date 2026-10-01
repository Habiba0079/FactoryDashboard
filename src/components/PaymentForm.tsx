import { useState } from "react";
import { createPayment } from "../services/api";
import type { Payment } from "../types";

type NewPaymentData = Omit<Payment, "id">;

function PaymentForm() {
  const [formData, setFormData] = useState<NewPaymentData>({
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: name === "amount" ? Number(value) : value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      await createPayment(formData);

      setMessage("تم تسجيل الدفعة بنجاح");

      setFormData({
        date: new Date().toISOString().split("T")[0],
        amount: 0,
        notes: "",
      });
    } catch (error) {
      console.error(error);
      setMessage("حدث خطأ أثناء تسجيل الدفعة");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>إضافة دفعة</h2>

      <input
        type="date"
        name="date"
        value={formData.date}
        onChange={handleChange}
      />

      <input
        type="number"
        name="amount"
        placeholder="قيمة الدفعة"
        value={formData.amount || ""}
        onChange={handleChange}
      />

      <input
        type="text"
        name="notes"
        placeholder="ملاحظات"
        value={formData.notes}
        onChange={handleChange}
      />

      <button type="submit" disabled={loading}>
        {loading ? "جاري الحفظ..." : "تسجيل الدفعة"}
      </button>

      {message && <p>{message}</p>}
    </form>
  );
}

export default PaymentForm;