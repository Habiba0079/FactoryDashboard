import { useEffect, useState } from "react";
import { getModels } from "../services/api";
import type { Model } from "../types";

function Models() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadModels() {
      try {
        const data = await getModels();
        setModels(data);
      } catch (error) {
        console.error(error);
        setError("حدث خطأ أثناء تحميل الموديلات");
      } finally {
        setLoading(false);
      }
    }

    loadModels();
  }, []);

  if (loading) {
    return <p>جاري تحميل الموديلات...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h1>الموديلات</h1>

      {models.length === 0 ? (
        <p>لا توجد موديلات حتى الآن.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>الموديل</th>
              <th>عدد القطع</th>
              <th>سعر القطعة</th>
              <th>المتراج</th>
              <th>إجمالي السعر</th>
              <th>إجمالي المتراج</th>
            </tr>
          </thead>

          <tbody>
            {models.map((model) => (
              <tr key={model.id}>
                <td>{model.date}</td>
                <td>{model.modelName}</td>
                <td>{model.quantity}</td>
                <td>{model.pricePerPiece}</td>
                <td>{model.fabricCm} سم</td>
                <td>{model.totalPrice} جنيه</td>
                <td>{model.totalFabricCm} سم</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Models;