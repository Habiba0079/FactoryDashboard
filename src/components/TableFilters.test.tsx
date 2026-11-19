import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TableFilters from "./TableFilters";

const setup = (props: Partial<Parameters<typeof TableFilters>[0]> = {}) => {
  const onSearch = vi.fn();
  const onMonth = vi.fn();
  const view = render(
    <TableFilters
      search=""
      onSearch={onSearch}
      month=""
      onMonth={onMonth}
      placeholder="ابحثي باسم الموديل"
      shown={10}
      total={10}
      {...props}
    />,
  );
  return { onSearch, onMonth, view, user: userEvent.setup() };
};

describe("TableFilters", () => {
  it("shows only the total when no filter is active, and no clear button", () => {
    setup();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "مسح الفلتر" })).toBeNull();
  });

  it("reports the search text as it changes", () => {
    const { onSearch } = setup();
    fireEvent.change(screen.getByPlaceholderText("ابحثي باسم الموديل"), {
      target: { value: "جينز" },
    });
    expect(onSearch).toHaveBeenCalledWith("جينز");
  });

  it("reports the chosen month", () => {
    const { onMonth } = setup();
    fireEvent.change(screen.getByLabelText("الشهر"), { target: { value: "2026-10" } });
    expect(onMonth).toHaveBeenCalledWith("2026-10");
  });

  it("shows 'shown of total' and a clear button once a filter is active", () => {
    setup({ search: "جينز", shown: 3 });
    expect(screen.getByText("3 من 10")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "مسح الفلتر" })).toBeInTheDocument();
  });

  it("treats a chosen month as an active filter", () => {
    setup({ month: "2026-10", shown: 2 });
    expect(screen.getByText("2 من 10")).toBeInTheDocument();
  });

  it("the clear button resets both the search and the month", async () => {
    const { onSearch, onMonth, user } = setup({ search: "جينز", month: "2026-10" });
    await user.click(screen.getByRole("button", { name: "مسح الفلتر" }));
    expect(onSearch).toHaveBeenCalledWith("");
    expect(onMonth).toHaveBeenCalledWith("");
  });
});
