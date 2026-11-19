import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Field from "../src/components/Field";

describe("Field", () => {
  it("links the label to its input when a name is given", () => {
    render(<Field label="الاسم" name="modelName" defaultValue="x" />);
    expect(screen.getByLabelText("الاسم")).toHaveValue("x");
  });

  it("links the label to its input even without a name or id", () => {
    render(<Field label="تسوية لحد يوم" type="date" />);
    expect(screen.getByLabelText("تسوية لحد يوم")).toHaveAttribute("type", "date");
  });

  it("gives two fields without names different ids", () => {
    render(
      <>
        <Field label="أول" />
        <Field label="تاني" />
      </>,
    );
    expect(screen.getByLabelText("أول").id).not.toBe(screen.getByLabelText("تاني").id);
  });

  it("shows the error text and marks the input as invalid", () => {
    render(<Field label="العدد" name="quantity" error="مطلوب" />);
    expect(screen.getByText("مطلوب")).toBeInTheDocument();
    expect(screen.getByLabelText("العدد")).toBeInvalid();
  });

  it("is valid when there is no error", () => {
    render(<Field label="العدد" name="quantity" />);
    expect(screen.getByLabelText("العدد")).toBeValid();
  });
});
