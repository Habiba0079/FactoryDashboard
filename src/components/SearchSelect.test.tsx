import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import SearchSelect from "./SearchSelect";
import type { SearchSelectItem } from "./SearchSelect";

const items: SearchSelectItem[] = [
  { value: "1", label: "بنطلون جينز — 2026-09-10", date: "2026-09-10" },
  { value: "2", label: "قميص كتان — 2026-10-05", date: "2026-10-05" },
  { value: "3", label: "بنطلون كارجو — 2026-10-20", date: "2026-10-20" },
];

// The real parent keeps the selected value, so we do the same here.
function Harness({
  list = items,
  initial = null,
  onChange,
  emptyLabel,
}: {
  list?: SearchSelectItem[];
  initial?: string | null;
  onChange?: (value: string | null) => void;
  emptyLabel?: string;
}) {
  const [value, setValue] = useState<string | null>(initial);
  return (
    <SearchSelect
      items={list}
      value={value}
      placeholder="ابحثي"
      emptyLabel={emptyLabel}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

const input = () => screen.getByPlaceholderText("ابحثي");

describe("SearchSelect", () => {
  it("starts closed", () => {
    render(<Harness />);
    expect(screen.queryByRole("listitem")).toBeNull();
  });

  it("shows the selected item's label when closed", () => {
    render(<Harness initial="2" />);
    expect(input()).toHaveValue("قميص كتان — 2026-10-05");
  });

  it("opens and lists every item when the field is clicked", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(input());
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("filters the list by the typed text", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(input());
    await user.type(input(), "بنطلون");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByText("قميص كتان — 2026-10-05")).toBeNull();
  });

  it("says when nothing matches", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(input());
    await user.type(input(), "مفيش");
    expect(screen.getByText("لا توجد نتائج")).toBeInTheDocument();
  });

  it("selecting an item reports its value, closes the list and shows its label", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);
    await user.click(input());
    await user.click(screen.getByText("قميص كتان — 2026-10-05"));

    expect(onChange).toHaveBeenCalledWith("2");
    expect(screen.queryByRole("listitem")).toBeNull();
    expect(input()).toHaveValue("قميص كتان — 2026-10-05");
  });

  it("offers the default option only when emptyLabel is given, and it reports null", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { unmount } = render(<Harness initial="1" onChange={onChange} />);
    await user.click(input());
    expect(screen.queryByText("آخر موديل (تلقائي)")).toBeNull();
    unmount();

    render(<Harness initial="1" emptyLabel="آخر موديل (تلقائي)" onChange={onChange} />);
    await user.click(input());
    await user.click(screen.getByText("آخر موديل (تلقائي)"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("closes without selecting when focus leaves the field", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);
    await user.click(input());
    await user.click(document.body);
    expect(screen.queryByRole("listitem")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  describe("month filter", () => {
    it("is offered when the items have dates", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      await user.click(input());
      expect(screen.getByLabelText("الشهر والسنة")).toBeInTheDocument();
    });

    it("is not offered when the items have no dates", async () => {
      const user = userEvent.setup();
      render(<Harness list={[{ value: "a", label: "بدون تاريخ" }]} />);
      await user.click(input());
      expect(screen.queryByLabelText("الشهر والسنة")).toBeNull();
    });

    it("keeps only the items of the chosen month", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      await user.click(input());
      fireEvent.change(screen.getByLabelText("الشهر والسنة"), { target: { value: "2026-10" } });

      expect(screen.getAllByRole("listitem")).toHaveLength(2);
      expect(screen.queryByText("بنطلون جينز — 2026-09-10")).toBeNull();
    });

    it("combines with the text search", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      await user.click(input());
      fireEvent.change(screen.getByLabelText("الشهر والسنة"), { target: { value: "2026-10" } });
      await user.type(input(), "كارجو");

      expect(screen.getAllByRole("listitem")).toHaveLength(1);
      expect(screen.getByText("بنطلون كارجو — 2026-10-20")).toBeInTheDocument();
    });

    it("the 'كل الشهور' button brings every item back", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      await user.click(input());
      fireEvent.change(screen.getByLabelText("الشهر والسنة"), { target: { value: "2026-10" } });
      await user.click(screen.getByRole("button", { name: "كل الشهور" }));

      expect(screen.getAllByRole("listitem")).toHaveLength(3);
    });

    it("works with full ISO dates too", async () => {
      const user = userEvent.setup();
      render(<Harness list={[{ value: "x", label: "تاريخ كامل", date: "2026-10-05T21:00:00.000Z" }]} />);
      await user.click(input());
      fireEvent.change(screen.getByLabelText("الشهر والسنة"), { target: { value: "2026-10" } });
      expect(screen.getByText("تاريخ كامل")).toBeInTheDocument();
    });
  });
});
