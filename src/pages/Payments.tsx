import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import Modal from "../components/Modal";
import PaymentForm from "../components/PaymentForm";
import {
  createPayment,
  deletePayment,
  getPayments,
  updatePayment,
} from "../services/api";
import type { NewPaymentData, Payment } from "../types";
import { formatCurrency, toDateInput } from "../utils/format";

function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<Payment | "new" | null>(null);
  const [deleting, setDeleting] = useState<Payment | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const data = await getPayments();
        if (cancelled) return;
        setPayments(data);
        setError("");
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("حدث خطأ أثناء تحميل الدفعات");
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

  const sorted = useMemo(
    () => [...payments].sort((a, b) => b.date.localeCompare(a.date)),
    [payments]
  );

  const total = useMemo(
    () => payments.reduce((sum, p) => sum + p.amount, 0),
    [payments]
  );

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
      ) : error ? (
        <div className="state state-error">
          <p>{error}</p>
          <button className="btn" onClick={retry}>
            إعادة المحاولة
          </button>
        </div>
      ) : payments.length === 0 ? (
        <p className="state">لا توجد دفعات حتى الآن. اضغط "إضافة دفعة" للبدء.</p>
      ) : (
        <>
          <div className="totals">
            <div>
              <span>إجمالي الدفعات</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
            <div>
              <span>عدد الدفعات</span>
              <strong>{payments.length}</strong>
            </div>
          </div>

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
                {sorted.map((payment) => (
                  <tr key={payment.id}>
                    <td>{toDateInput(payment.date)}</td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td>{payment.notes || "—"}</td>
                    <td className="row-actions">
                      <button className="btn btn-sm" onClick={() => setEditing(payment)}>
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
                ))}
              </tbody>
            </table>
          </div>
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
          message={`متأكد إنك عايز تحذف دفعة ${formatCurrency(deleting.amount)} بتاريخ ${toDateInput(deleting.date)}؟`}
          busy={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </section>
  );
}

export default Payments;
