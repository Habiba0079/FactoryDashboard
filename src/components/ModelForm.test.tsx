import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeModel } from "../test/factories";
import type { NewModelData } from "../types";
import { findDuplicateModel } from "../utils/duplicates";
import { today } from "../utils/format";
import ModelForm from "./ModelForm";

type User = ReturnType<typeof userEvent.setup>;

async function fillForm(user: User, name = "بنطلون") {
  const date = screen.getByLabelText("التاريخ");
  await user.clear(date);
  await user.type(date, "2026-10-01");
  await user.type(screen.getByLabelText("اسم الموديل"), name);
  await user.type(screen.getByLabelText("عدد القطع"), "10");
  await user.type(screen.getByLabelText("سعر القطعة (جنيه)"), "50");
  await user.type(screen.getByLabelText("المتراج للقطعة (سم)"), "100");
}

const addButton = () => screen.getByRole("button", { name: "إضافة الموديل" });

describe("ModelForm", () => {
  it("starts with today's date and empty fields", () => {
    render(<ModelForm onSubmit={vi.fn()} onCancel={() => {}} />);
    expect(screen.getByLabelText("التاريخ")).toHaveValue(today());
    expect(screen.getByLabelText("اسم الموديل")).toHaveValue("");
    expect(screen.getByLabelText("عدد القطع")).toHaveValue(null);
  });

  it("is pre-filled when editing", () => {
    const model = makeModel({ modelName: "قميص", quantity: 7, pricePerPiece: 40, fabricCm: 90, date: "2026-09-01" });
    render(<ModelForm initial={model} onSubmit={vi.fn()} onCancel={() => {}} />);
    expect(screen.getByLabelText("اسم الموديل")).toHaveValue("قميص");
    expect(screen.getByLabelText("عدد القطع")).toHaveValue(7);
    expect(screen.getByLabelText("التاريخ")).toHaveValue("2026-09-01");
    expect(screen.getByRole("button", { name: "حفظ التعديل" })).toBeInTheDocument();
  });

  it("submits clean data: trimmed name and numbers instead of text", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ModelForm onSubmit={onSubmit} onCancel={() => {}} />);
    await fillForm(user, "  بنطلون  ");
    await user.click(addButton());

    expect(onSubmit).toHaveBeenCalledWith({
      date: "2026-10-01",
      modelName: "بنطلون",
      quantity: 10,
      pricePerPiece: 50,
      fabricCm: 100,
    } satisfies NewModelData);
  });

  it("shows validation errors, does not submit, and clears an error when the field is edited", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ModelForm onSubmit={onSubmit} onCancel={() => {}} />);
    await user.click(addButton());

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("اسم الموديل مطلوب")).toBeInTheDocument();
    expect(screen.getByText("عدد القطع لازم يكون أكبر من 0")).toBeInTheDocument();

    await user.type(screen.getByLabelText("اسم الموديل"), "ب");
    expect(screen.queryByText("اسم الموديل مطلوب")).toBeNull();
    expect(screen.getByText("عدد القطع لازم يكون أكبر من 0")).toBeInTheDocument();
  });

  it("disables the buttons while saving", async () => {
    let finish: () => void = () => {};
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const user = userEvent.setup();
    render(<ModelForm onSubmit={onSubmit} onCancel={() => {}} />);
    await fillForm(user);
    await user.click(addButton());

    expect(screen.getByRole("button", { name: "جاري الحفظ..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "إلغاء" })).toBeDisabled();
    finish();
  });

  it("shows an error and lets the user retry when saving fails", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("network"));
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ModelForm onSubmit={onSubmit} onCancel={() => {}} />);
    await fillForm(user);
    await user.click(addButton());

    expect(await screen.findByText("حدث خطأ أثناء الحفظ، حاول مرة تانية")).toBeInTheDocument();
    expect(addButton()).toBeEnabled();
  });

  it("calls onCancel", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<ModelForm onSubmit={vi.fn()} onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: "إلغاء" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  describe("duplicate warning", () => {
    const existing = makeModel({ date: "2026-10-01", modelName: "بنطلون", quantity: 10, pricePerPiece: 50 });
    const find = (data: NewModelData) => findDuplicateModel([existing], data);
    const warning = /فيه موديل بنفس البيانات/;

    it("the first save warns and does not submit; saving again submits once", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<ModelForm onSubmit={onSubmit} onCancel={() => {}} findDuplicate={find} />);
      await fillForm(user);

      await user.click(addButton());
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByText(warning)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "احفظ برضه" }));
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it("changing a field clears the warning and the next save is checked again", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<ModelForm onSubmit={onSubmit} onCancel={() => {}} findDuplicate={find} />);
      await fillForm(user);
      await user.click(addButton());
      expect(screen.getByText(warning)).toBeInTheDocument();

      await user.clear(screen.getByLabelText("عدد القطع"));
      await user.type(screen.getByLabelText("عدد القطع"), "11");
      expect(screen.queryByText(warning)).toBeNull();

      await user.click(addButton());
      expect(onSubmit).toHaveBeenCalledTimes(1); // different quantity: no longer a duplicate
    });

    it("saves straight away when nothing matches", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<ModelForm onSubmit={onSubmit} onCancel={() => {}} findDuplicate={find} />);
      await fillForm(user, "قميص");
      await user.click(addButton());
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it("a form with validation errors never reaches the duplicate check", async () => {
      const findDuplicate = vi.fn();
      const user = userEvent.setup();
      render(<ModelForm onSubmit={vi.fn()} onCancel={() => {}} findDuplicate={findDuplicate} />);
      await user.click(addButton());
      expect(findDuplicate).not.toHaveBeenCalled();
    });

    it("works without a findDuplicate prop", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<ModelForm onSubmit={onSubmit} onCancel={() => {}} />);
      await fillForm(user);
      await user.click(addButton());
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it("editing a model does not warn about itself", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(
        <ModelForm
          initial={existing}
          onSubmit={onSubmit}
          onCancel={() => {}}
          findDuplicate={(data) => findDuplicateModel([existing], data, existing.id)}
        />,
      );
      await user.click(screen.getByRole("button", { name: "حفظ التعديل" }));
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });
});
