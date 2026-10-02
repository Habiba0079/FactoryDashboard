import { useMemo, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import { CashIcon } from "../components/icons";
import Modal from "../components/Modal";
import PaymentForm from "../components/PaymentForm";
import TableFilters from "../components/TableFilters";
import { useData } from "../data/useData";
import {
  createPayment,
  deletePayment,
  updatePayment,
} from "../services/api";
import type { NewPaymentData, Payment } from "../types";
import { formatCurrency, toDateInput } from "../utils/format";
import { PAGE_SIZE, compareNewest, matchesMonth } from "../utils/table";

function Payments() {
  const {
    payments,
    setPayments,
    loading,
    hasData,
    error,
    refresh,
    lastSettlementDate,
  } = useData();

  const [editing, setEditing] = useState<Payment | "new" | null>(null);
  const [deleting, setDeleting] = useState<Payment | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...payments]
      .sort(compareNewest)
      .filter(
        (p) =>
          (!query ||
            (p.notes ?? "").toLowerCase().includes(query) ||
            String(p.amount).includes(query)) &&
          matchesMonth(p.date, month),
      );
  }, [payments, search, month]);

  const total = useMemo(
    () => filtered.reduce((sum, p) => sum + p.amount, 0),
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

  async function handleSave(data: NewPaymentData) {
    if (editing && editing !== "new") {
      const updated = await updatePayment(editing.id, data);
      setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } else {
      const created = await createPayment(data);
      setPayments((prev) => [...prev, created]);
    }
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      setDeleteBusy(true);
      setActionError("");
      await deletePayment(deleting.id);
      setPayments((prev) => prev.filter((p) => p.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      console.error(err);
      setActionError("تعذر حذف الدفعة، حاول مرة تانية");
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <section>
      <div className="page-head">
        <h1>الدفعات</h1>
        <button className="btn btn-primary" onClick={() => setEditing("new")}>
          + إضافة دفعة
        </button>
      </div>

      {actionError && <p className="form-error">{actionError}</p>}

      {loading ? (
        <p className="state">جاري تحميل الدفعات...</p>
      ) : !hasData && error ? (
        <div className="state state-error">
          <p>{error}</p>
          <button className="btn" onClick={refresh}>
            إعادة المحاولة
          </button>
        </div>
      ) : payments.length === 0 ? (
        <div className="state">
          <CashIcon size={44} />
          <p>لا توجد دفعات حتى الآن. اضغطي "إضافة دفعة" للبدء.</p>
        </div>
      ) : (
        <>
          <TableFilters
            search={search}
            onSearch={changeSearch}
            month={month}
            onMonth={changeMonth}
            placeholder="ابحثي بالملاحظات أو القيمة"
            shown={filtered.length}
            total={payments.length}
          />

          <div className="totals">
            <div>
              <span>إجمالي الدفعات</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
            <div>
              <span>عدد الدفعات</span>
              <strong>{filtered.length}</strong>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="state">مفيش دفعات مطابقة للفلتر.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>القيمة</th>
                    <th>ملاحظات</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((payment) => {
                    const settled =
                      lastSettlementDate !== null &&
                      payment.date <= lastSettlementDate;
                    return (
                      <tr
                        key={payment.id}
                        className={settled ? "row-settled" : ""}
                      >
                        <td>
                          {toDateInput(payment.date)}
                          {settled && <span className="badge">مسوّى</span>}
                        </td>
                        <td>{formatCurrency(payment.amount)}</td>
                        <td>{payment.notes || "—"}</td>
                        <td className="row-actions">
                          <button
                            className="btn btn-sm"
                            onClick={() => setEditing(payment)}
                          >
                            تعديل
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => setDeleting(payment)}
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
          title={editing === "new" ? "إضافة دفعة" : "تعديل الدفعة"}
          onClose={() => setEditing(null)}
        >
          <PaymentForm
            initial={editing === "new" ? undefined : editing}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="حذف الدفعة"
          message={`متأكدة إنك عايزة تحذفي دفعة ${formatCurrency(deleting.amount)} بتاريخ ${toDateInput(deleting.date)}؟`}
          busy={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </section>
  );
}

export default Payments;
