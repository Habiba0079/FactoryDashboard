import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import Modal from "../components/Modal";
import ModelForm from "../components/ModelForm";
import {
  createModel,
  deleteModel,
  getModels,
  updateModel,
} from "../services/api";
import type { Model, NewModelData } from "../types";
import {
  formatCurrency,
  formatMeters,
  formatNumber,
  toDateInput,
} from "../utils/format";

function Models() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // "new" = إضافة، Model = تعديل، null = الفورم مقفول
  const [editing, setEditing] = useState<Model | "new" | null>(null);
  const [deleting, setDeleting] = useState<Model | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const data = await getModels();
        if (cancelled) return;
        setModels(data);
        setError("");
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("حدث خطأ أثناء تحميل الموديلات");
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

  // الأحدث فوق
  const sorted = useMemo(() => {
    return [...models].sort((a, b) =>
      (a.modelName ?? "").localeCompare(b.modelName ?? ""),
    );
  }, [models]);

  const totals = useMemo(
    () => ({
      pieces: models.reduce((sum, m) => sum + m.quantity, 0),
      price: models.reduce((sum, m) => sum + m.totalPrice, 0),
      fabricCm: models.reduce((sum, m) => sum + m.totalFabricCm, 0),
    }),
    [models],
  );

  async function handleSave(data: NewModelData) {
    if (editing && editing !== "new") {
      const updated = await updateModel(editing.id, data);
      setModels((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } else {
      const created = await createModel(data);
      setModels((prev) => [...prev, created]);
    }
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      setDeleteBusy(true);
      setActionError("");
      await deleteModel(deleting.id);
      setModels((prev) => prev.filter((m) => m.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      console.error(err);
      setActionError("تعذر حذف الموديل، حاول مرة تانية");
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <section>
      <div className="page-head">
        <h1>الموديلات</h1>
        <button className="btn btn-primary" onClick={() => setEditing("new")}>
          + إضافة موديل
        </button>
      </div>

      {actionError && <p className="form-error">{actionError}</p>}

      {loading ? (
        <p className="state">جاري تحميل الموديلات...</p>
      ) : error ? (
        <div className="state state-error">
          <p>{error}</p>
          <button className="btn" onClick={retry}>
            إعادة المحاولة
          </button>
        </div>
      ) : models.length === 0 ? (
        <p className="state">
          لا توجد موديلات حتى الآن. اضغط "إضافة موديل" للبدء.
        </p>
      ) : (
        <>
          <div className="totals">
            <div>
              <span>إجمالي القطع</span>
              <strong>{formatNumber(totals.pieces)}</strong>
            </div>
            <div>
              <span>إجمالي القيمة</span>
              <strong>{formatCurrency(totals.price)}</strong>
            </div>
            <div>
              <span>إجمالي المتراج</span>
              <strong>{formatMeters(totals.fabricCm)}</strong>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الموديل</th>
                  <th>القطع</th>
                  <th>سعر القطعة</th>
                  <th>المتراج/قطعة</th>
                  <th>إجمالي السعر</th>
                  <th>إجمالي المتراج</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((model) => (
                  <tr key={model.id}>
                    <td>{toDateInput(model.date)}</td>
                    <td>{model.modelName}</td>
                    <td>{formatNumber(model.quantity)}</td>
                    <td>{formatCurrency(model.pricePerPiece)}</td>
                    <td>{formatNumber(model.fabricCm)} سم</td>
                    <td>{formatCurrency(model.totalPrice)}</td>
                    <td>{formatMeters(model.totalFabricCm)}</td>
                    <td className="row-actions">
                      <button
                        className="btn btn-sm"
                        onClick={() => setEditing(model)}
                      >
                        تعديل
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => setDeleting(model)}
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editing && (
        <Modal
          title={editing === "new" ? "إضافة موديل" : "تعديل الموديل"}
          onClose={() => setEditing(null)}
        >
          <ModelForm
            initial={editing === "new" ? undefined : editing}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="حذف الموديل"
          message={`متأكد إنك عايز تحذف موديل "${deleting.modelName}"؟ مش هتقدر ترجّعه.`}
          busy={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </section>
  );
}

export default Models;
