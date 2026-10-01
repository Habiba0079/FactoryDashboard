import { useState } from "react";
import { createModel } from "../services/api";
import type { NewModelData } from "../types";

function ModelForm() {
  const [formData, setFormData] = useState<NewModelData>({
    date: new Date().toISOString().split("T")[0],
    modelName: "",
    quantity: 0,
    pricePerPiece: 0,
    fabricCm: 0,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        name === "quantity" || name === "pricePerPiece" || name === "fabricCm"
          ? Number(value)
          : value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      await createModel(formData);

      setMessage("تم إضافة الموديل بنجاح");

      setFormData({
        date: new Date().toISOString().split("T")[0],
        modelName: "",
        quantity: 0,
        pricePerPiece: 0,
        fabricCm: 0,
      });
    } catch (error) {
      console.error(error);
      setMessage("حدث خطأ أثناء إضافة الموديل");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="date"
        name="date"
        value={formData.date}
        onChange={handleChange}
      />

      <input
        type="text"
        name="modelName"
        placeholder="اسم الموديل"
        value={formData.modelName}
        onChange={handleChange}
      />

      <input
        type="number"
        name="quantity"
        placeholder="عدد القطع"
        value={formData.quantity || ""}
        onChange={handleChange}
      />

      <input
        type="number"
        name="pricePerPiece"
        placeholder="سعر القطعة"
        value={formData.pricePerPiece || ""}
        onChange={handleChange}
      />

      <input
        type="number"
        name="fabricCm"
        placeholder="المتراج للقطعة بالسنتي"
        value={formData.fabricCm || ""}
        onChange={handleChange}
      />

      <button type="submit" disabled={loading}>
        {loading ? "جاري الحفظ..." : "إضافة الموديل"}
      </button>

      {message && <p>{message}</p>}
    </form>
  );
}

export default ModelForm;
