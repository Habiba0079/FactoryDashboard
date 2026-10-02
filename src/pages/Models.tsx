import { useMemo, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import { ScissorsIcon } from "../components/icons";
import Modal from "../components/Modal";
import ModelForm from "../components/ModelForm";
import TableFilters from "../components/TableFilters";
import { useData } from "../data/useData";
import { createModel, deleteModel, updateModel } from "../services/api";
import type { Model, NewModelData } from "../types";
import {
  formatCurrency,
  formatMeters,
  formatNumber,
  toDateInput,
} from "../utils/format";
import { PAGE_SIZE, compareNewest, matchesMonth } from "../utils/table";

function Models() {
  const {
    models,
    setModels,
    loading,
    hasData,
    error,
    refresh,
    lastSettlementDate,
  } = useData();

  // "new" = إضافة، Model = تعديل، null = الفورم مقفول
  const [editing, setEditing] = useState<Model | "new" | null>(null);
  const [deleting, setDeleting] = useState<Model | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  // الأحدث فوق + الفلتر
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...models]
      .sort(compareNewest)
      .filter(
        (m) =>
          (!query || m.modelName.toLowerCase().includes(query)) &&
          matchesMonth(m.date, month),
      );
  }, [models, search, month]);

  // الإجماليات على كل نتايج الفلتر (مش على أول ٥٠ بس)
  const totals = useMemo(
    () => ({
      pieces: filtered.reduce((sum, m) => sum + m.quantity, 0),
      price: filtered.reduce((sum, m) => sum + m.totalPrice, 0),
      fabricCm: filtered.reduce((sum, m) => sum + m.totalFabricCm, 0),
    }),
    [filtered],
  );

  const visible = filtered.slice(0, limit);

  function changeSearch(value: string) {
    setSearch(value);
    setLimit(PAGE_SIZE);
  }
  function changeMonth(value: string) {
    setMonth(value);
    setLimit(PAGE_SIZE);
  }

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
      ) : !hasData && error ? (
        <div className="state state-error">
          <p>{error}</p>
          <button className="btn" onClick={refresh}>
            إعادة المحاولة
          </button>
        </div>
      ) : models.length === 0 ? (
        <div className="state">
          <ScissorsIcon size={44} />
          <p>لا توجد موديلات حتى الآن. اضغطي "إضافة موديل" للبدء.</p>
        </div>
      ) : (
        <>
          <TableFilters
            search={search}
            onSearch={changeSearch}
            month={month}
            onMonth={changeMonth}
            placeholder="ابحثي باسم الموديل"
            shown={filtered.length}
            total={models.length}
          />

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

          {filtered.length === 0 ? (
            <p className="state">مفيش موديلات مطابقة للفلتر.</p>
          ) : (
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
                  {visible.map((model) => {
                    const settled =
                      lastSettlementDate !== null &&
                      model.date <= lastSettlementDate;
                    return (
                      <tr key={model.id} className={settled ? "row-settled" : ""}>
                        <td>
                          {toDateInput(model.date)}
                          {settled && <span className="badge">مسوّى</span>}
                        </td>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > visible.length && (
            <button
              className="btn show-more"
              onClick={() => setLimit((l) => l + PAGE_SIZE)}
            >
              عرض {PAGE_SIZE} أخرى ({filtered.length - visible.length} متبقي)
            </button>
          )}
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
          message={`متأكدة إنك عايزة تحذفي موديل "${deleting.modelName}"؟ مش هتقدري ترجّعيه.`}
          busy={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </section>
  );
}

export default Models;
