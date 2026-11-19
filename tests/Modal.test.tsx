import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Modal from "../src/components/Modal";

describe("Modal", () => {
  it("shows its title and children in an accessible dialog", () => {
    render(
      <Modal title="إضافة موديل" onClose={() => {}}>
        <p>محتوى</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog", { name: "إضافة موديل" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "إضافة موديل" })).toBeInTheDocument();
    expect(screen.getByText("محتوى")).toBeInTheDocument();
  });

  it("does NOT close when the dark area outside the box is clicked (typed data must not be lost)", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <Modal title="t" onClose={onClose}>
        <p>x</p>
      </Modal>,
    );

    await user.click(container.querySelector(".modal-backdrop") as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not close when clicking inside the box", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal title="t" onClose={onClose}>
        <p>inside</p>
      </Modal>,
    );

    await user.click(screen.getByText("inside"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes when Escape is pressed", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal title="t" onClose={onClose}>
        <p>x</p>
      </Modal>,
    );

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stops listening for Escape after it is removed", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { unmount } = render(
      <Modal title="t" onClose={onClose}>
        <p>x</p>
      </Modal>,
    );

    unmount();
    await user.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
  });
});
