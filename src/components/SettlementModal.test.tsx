import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeModel, makePayment } from "../test/factories";
import { createSettlement } from "../services/api";
import SettlementModal from "./SettlementModal";

vi.mock("../services/api", () => ({ createSettlement: vi.fn() }));

const models = [
  makeModel({ date: "2026-06-25", quantity: 10, totalPrice: 1000 }),
  makeModel({ date: "2026-07-05", quantity: 20, totalPrice: 2000 }),
];
const payments = [
  makePayment({ date: "2026-06-20", amount: 400 }),
  makePayment({ date: "2026-06-30", amount: 100 }),
  makePayment({ date: "2026-07-10", amount: 1500 }),
];

const setup = (lastSettlementDate: string | null = null) => {
  const onClose = vi.fn();
  const onCreated = vi.fn();
  render(
    <SettlementModal
      models={models}
      payments={payments}
      lastSettlementDate={lastSettlementDate}
      onClose={onClose}
      onCreated={onCreated}
    />,
  );
  return { onClose, onCreated, user: userEvent.setup() };
};

const chooseDate = (value: string) =>
  fireEvent.change(screen.getByLabelText("تسوية لحد يوم"), { target: { value } });
const confirm = () => screen.getByRole("button", { name: /تأكيد التسوية/ });

beforeEach(() => {
  vi.mocked(createSettlement).mockReset();
});

describe("SettlementModal", () => {
  it("starts without a preview and with the confirm button disabled", () => {
    setup();
    expect(confirm()).toBeDisabled();
    expect(screen.queryByText(/الرصيد اللي هيتقفل/)).toBeNull();
  });

  it("previews what would be settled up to the chosen day (inclusive)", () => {
    setup();
    chooseDate("2026-07-05");

    expect(screen.getByText(/الشغل: 3,000 جنيه/)).toBeInTheDocument();
    expect(screen.getByText(/الدفعات: 500 جنيه/)).toBeInTheDocument();
    expect(screen.getByText(/2,500 جنيه مستحق للمصنع/)).toBeInTheDocument();
    expect(confirm()).toBeEnabled();
    expect(confirm()).toHaveTextContent("تأكيد التسوية لحد 2026-07-05");
  });

  it("only previews what comes after the previous settlement", () => {
    setup("2026-06-30");
    chooseDate("2026-07-31");
    expect(screen.getByText(/الشغل: 2,000 جنيه/)).toBeInTheDocument();
    expect(screen.getByText(/الدفعات: 1,500 جنيه/)).toBeInTheDocument();
  });

  it("warns when the settlement covers ALL existing records (the dashboard would show zero)", () => {
    setup();
    chooseDate("2026-12-31");
    expect(screen.getByText(/بتغطي/)).toBeInTheDocument();
  });

  it("does not show that warning while later records still exist", () => {
    setup();
    chooseDate("2026-06-30");
    expect(screen.queryByText(/بتغطي/)).toBeNull();
  });

  it("warns about a date in the future", () => {
    setup();
    chooseDate("2999-01-01");
    expect(screen.getByText(/التاريخ ده في المستقبل/)).toBeInTheDocument();
  });

  it("warns that a remaining balance is not carried over", () => {
    setup();
    chooseDate("2026-07-05");
    expect(screen.getByText(/مش هيتنقل للحساب الجديد/)).toBeInTheDocument();
  });

  it("rejects a date on or before the previous settlement", () => {
    setup("2026-06-30");
    chooseDate("2026-06-30");
    expect(screen.getByText("التاريخ ده قبل آخر تسوية أو نفس يومها")).toBeInTheDocument();
    expect(confirm()).toBeDisabled();
  });

  it("creates the settlement with the chosen day and trimmed notes, then reports it", async () => {
    const created = { id: "S-1", date: "2026-07-05", notes: "يوليو" };
    vi.mocked(createSettlement).mockResolvedValue(created);
    const { onCreated, user } = setup();
    chooseDate("2026-07-05");
    await user.type(screen.getByLabelText("ملاحظات (اختياري)"), "  يوليو  ");
    await user.click(confirm());

    expect(createSettlement).toHaveBeenCalledWith({ date: "2026-07-05", notes: "يوليو" });
    expect(onCreated).toHaveBeenCalledWith(created);
  });

  it("shows an error and can be retried when saving fails", async () => {
    vi.mocked(createSettlement).mockRejectedValue(new Error("network"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { onCreated, user } = setup();
    chooseDate("2026-07-05");
    await user.click(confirm());

    expect(await screen.findByText("تعذر تسجيل التسوية، حاول مرة تانية")).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
    expect(confirm()).toBeEnabled();
  });

  it("cancel closes without creating anything", async () => {
    const { onClose, user } = setup();
    await user.click(screen.getByRole("button", { name: "إلغاء" }));
    expect(onClose).toHaveBeenCalled();
    expect(createSettlement).not.toHaveBeenCalled();
  });
});
