import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ConfirmDialog from "../src/components/ConfirmDialog";

const setup = (props: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      title="حذف الموديل"
      message="متأكدة؟"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onConfirm, onCancel, user: userEvent.setup() };
};

describe("ConfirmDialog", () => {
  it("shows the title and the message", () => {
    setup();
    expect(screen.getByRole("dialog", { name: "حذف الموديل" })).toBeInTheDocument();
    expect(screen.getByText("متأكدة؟")).toBeInTheDocument();
  });

  it("uses 'حذف' as the default confirm label and accepts a custom one", () => {
    setup();
    expect(screen.getByRole("button", { name: "حذف" })).toBeInTheDocument();
  });

  it("shows a custom confirm label", () => {
    setup({ confirmLabel: "إلغاء التسوية" });
    expect(screen.getByRole("button", { name: "إلغاء التسوية" })).toBeInTheDocument();
  });

  it("calls onConfirm only when confirming", async () => {
    const { onConfirm, onCancel, user } = setup();
    await user.click(screen.getByRole("button", { name: "حذف" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("calls onCancel when cancelling or pressing Escape", async () => {
    const { onConfirm, onCancel, user } = setup();
    await user.click(screen.getByRole("button", { name: "إلغاء" }));
    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("while busy it disables both buttons and shows progress", () => {
    setup({ busy: true });
    expect(screen.getByRole("button", { name: "جاري الحذف..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "إلغاء" })).toBeDisabled();
  });
});
