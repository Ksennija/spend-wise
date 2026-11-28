import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useDropdown } from "./useDropdown";

// A small dropdown that only uses the hook: a button, and a panel with an input and a Close button.
function Harness() {
  const { open, toggle, close, rootProps, buttonRef } = useDropdown();
  return (
    <div>
      <p>Outside</p>
      <div {...rootProps}>
        <button ref={buttonRef} type="button" aria-expanded={open} onClick={toggle}>
          Toggle
        </button>
        {open && (
          <div>
            <input aria-label="Inside" />
            <button type="button" onClick={close}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const toggleButton = () => screen.getByRole("button", { name: "Toggle" });
const panelIsOpen = () => screen.queryByRole("textbox", { name: "Inside" }) !== null;

describe("useDropdown", () => {
  it("starts closed", () => {
    render(<Harness />);

    expect(panelIsOpen()).toBe(false);
    expect(toggleButton().getAttribute("aria-expanded")).toBe("false");
  });

  it("opens and closes when the button is pressed", async () => {
    render(<Harness />);

    await userEvent.click(toggleButton());
    expect(panelIsOpen()).toBe(true);
    expect(toggleButton().getAttribute("aria-expanded")).toBe("true");

    await userEvent.click(toggleButton());
    expect(panelIsOpen()).toBe(false);
  });

  it("closes with close() and puts the focus back on the button", async () => {
    render(<Harness />);
    await userEvent.click(toggleButton());

    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(panelIsOpen()).toBe(false);
    expect(document.activeElement).toBe(toggleButton());
  });

  it("closes on Escape from inside the panel and puts the focus back on the button", async () => {
    render(<Harness />);
    await userEvent.click(toggleButton());
    await userEvent.click(screen.getByRole("textbox", { name: "Inside" }));

    await userEvent.keyboard("{Escape}");

    expect(panelIsOpen()).toBe(false);
    expect(document.activeElement).toBe(toggleButton());
  });

  it("does nothing on Escape while it is closed", async () => {
    render(<Harness />);
    toggleButton().focus();

    await userEvent.keyboard("{Escape}");

    expect(panelIsOpen()).toBe(false);
    expect(toggleButton().getAttribute("aria-expanded")).toBe("false");
  });

  it("closes on a click outside and leaves the focus where the click put it", async () => {
    render(<Harness />);
    const outside = screen.getByText("Outside");
    outside.tabIndex = -1;
    await userEvent.click(toggleButton());

    await userEvent.click(outside);

    expect(panelIsOpen()).toBe(false);
    expect(document.activeElement).toBe(outside);
  });

  it("stays open on a click inside the panel", async () => {
    render(<Harness />);
    await userEvent.click(toggleButton());

    await userEvent.click(screen.getByRole("textbox", { name: "Inside" }));

    expect(panelIsOpen()).toBe(true);
  });

  it("can be opened again after it was closed", async () => {
    render(<Harness />);
    await userEvent.click(toggleButton());
    await userEvent.keyboard("{Escape}");

    await userEvent.click(toggleButton());

    expect(panelIsOpen()).toBe(true);
  });

  it("stops listening for clicks when it is closed", async () => {
    const add = jest.spyOn(document, "addEventListener");
    const remove = jest.spyOn(document, "removeEventListener");
    render(<Harness />);

    await userEvent.click(toggleButton());
    expect(add).toHaveBeenCalledWith("mousedown", expect.any(Function));

    await userEvent.click(toggleButton());
    expect(remove).toHaveBeenCalledWith("mousedown", expect.any(Function));
    add.mockRestore();
    remove.mockRestore();
  });
});
