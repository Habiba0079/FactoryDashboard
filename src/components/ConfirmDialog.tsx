import Modal from "./Modal";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  title,
  message,
  confirmLabel = "حذف",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p>{message}</p>
      <div className="actions">
        <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>
          {busy ? "جاري الحذف..." : confirmLabel}
        </button>
        <button className="btn" onClick={onCancel} disabled={busy}>
          إلغاء
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
