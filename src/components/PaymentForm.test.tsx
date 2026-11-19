import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makePayment } from "../test/factories";
import type { NewPaymentData } from "../types";
import { findDuplicatePayment } from "../utils/duplicates";
import PaymentForm from "./PaymentForm";

type User = ReturnType<typeof userEvent.setup>;

async function fillForm(user: User, amount = "1000", notes = "") {
  const date = screen.getByLabelText("التاريخ");
  await user.clear(date);
  await user.type(date, "2026-10-01");
  await user.type(screen.getByLabelText("قيمة الدفعة (جنيه)"), amount);
  if (notes) await user.type(screen.getByLabelText("ملاحظات (اختياري)"), notes);
}

const saveButton = () => screen.getByRole("button", { name: "تسجيل الدفعة" });

describe("PaymentForm", () => {
  it("is pre-filled when editing", () => {
    const payment = makePayment({ amount: 2500, notes: "نقدي", date: "2026-09-01" });
    render(<PaymentForm initial={payment} onSubmit={vi.fn()} onCancel={() => {}} />);
    expect(screen.getByLabelText("قيمة الدفعة (جنيه)")).toHaveValue(2500);
    expect(screen.getByLabelText("ملاحظات (اختياري)")).toHaveValue("نقدي");
    expect(screen.getByRole("button", { name: "حفظ التعديل" })).toBeInTheDocument();
  });

  it("submits a number amount and trimmed notes", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<PaymentForm onSubmit={onSubmit} onCancel={() => {}} />);
    await fillForm(user, "1500", "  نقدي  ");
    await user.click(saveButton());

    expect(onSubmit).toHaveBeenCalledWith({
      date: "2026-10-01",
      amount: 1500,
      notes: "نقدي",
    } satisfies NewPaymentData);
  });

  it("requires an amount greater than zero", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PaymentForm onSubmit={onSubmit} onCancel={() => {}} />);
    await user.click(saveButton());

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("قيمة الدفعة لازم تكون أكبر من 0")).toBeInTheDocument();
  });

  it("shows an error and lets the user retry when saving fails", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("network"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<PaymentForm onSubmit={onSubmit} onCancel={() => {}} />);
    await fillForm(user);
    await user.click(saveButton());

    expect(await screen.findByText("حدث خطأ أثناء الحفظ، حاول مرة تانية")).toBeInTheDocument();
    expect(saveButton()).toBeEnabled();
  });

  describe("duplicate warning", () => {
    const existing = makePayment({ date: "2026-10-01", amount: 1000, notes: "" });
    const find = (data: NewPaymentData) => findDuplicatePayment([existing], data);
    const warning = /فيه دفعة بنفس البيانات/;

    it("the first save warns and does not submit; saving again submits once", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<PaymentForm onSubmit={onSubmit} onCancel={() => {}} findDuplicate={find} />);
      await fillForm(user);

      await user.click(saveButton());
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByText(warning)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "احفظ برضه" }));
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it("a different note makes it a different payment (no warning)", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<PaymentForm onSubmit={onSubmit} onCancel={() => {}} findDuplicate={find} />);
      await fillForm(user, "1000", "ايجار");
      await user.click(saveButton());
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });
});
