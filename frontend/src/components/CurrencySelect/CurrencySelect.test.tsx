import { jest } from "@jest/globals";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CurrencySelect from "./CurrencySelect";

// null means the server has not said yet (the component gets undefined); no argument means EUR.
function renderSelect(current: string | null = "EUR") {
  const onSelect = jest.fn();
  render(
    <div>
      <h1>Outside</h1>
      <CurrencySelect current={current ?? undefined} onSelect={onSelect} />
    </div>
  );
  return onSelect;
}

const trigger = (name = "Currency EUR · Euro") => screen.getByRole("button", { name }) as HTMLButtonElement;
const searchBox = () => screen.getByRole("searchbox", { name: "Search currencies" }) as HTMLInputElement;
const items = () => within(screen.getByRole("list")).getAllByRole("listitem");
const codesShown = () =>
  within(screen.getByRole("list"))
    .getAllByRole("button")
    .map((button) => button.getAttribute("data-currency"));
const open = async (name?: string) => userEvent.click(trigger(name));

describe("CurrencySelect", () => {
  it("shows a Currency label and a button with the current currency, with the panel closed", () => {
    renderSelect("EUR");

    expect(screen.getByText("Currency")).not.toBeNull();
    expect(trigger().textContent).toBe("EUR · Euro");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("is disabled and shows an ellipsis until the server has told which currency it uses", () => {
    renderSelect(null);

    const button = screen.getByRole("button", { name: "Currency …" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe("…");
  });

  it("opens a panel with a search box that has the focus and every currency", async () => {
    renderSelect();

    await open();

    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(searchBox());
    expect(items()).toHaveLength(31);
  });

  it("marks only the current currency as selected", async () => {
    renderSelect("USD");
    await open("Currency USD · US Dollar");

    const marked = within(screen.getByRole("list"))
      .getAllByRole("button")
      .filter((button) => button.getAttribute("aria-current") === "true");
    expect(marked.map((button) => button.getAttribute("data-currency"))).toEqual(["USD"]);
  });

  it("filters the list as the user types, by code or by name, ignoring letter case", async () => {
    renderSelect();
    await open();

    await userEvent.type(searchBox(), "zloty");
    expect(codesShown()).toEqual(["PLN"]);

    await userEvent.clear(searchBox());
    await userEvent.type(searchBox(), "DOL");
    expect(codesShown()).toEqual(expect.arrayContaining(["USD", "CAD", "AUD"]));
    expect(codesShown()).not.toContain("EUR");

    await userEvent.clear(searchBox());
    await userEvent.type(searchBox(), "gbp");
    expect(codesShown()).toEqual(["GBP"]);
  });

  it("shows every currency again when the text is cleared", async () => {
    renderSelect();
    await open();
    await userEvent.type(searchBox(), "dollar");

    await userEvent.clear(searchBox());

    expect(items()).toHaveLength(31);
  });

  it("says so, politely, when no currency matches", async () => {
    renderSelect();
    await open();

    await userEvent.type(searchBox(), "  xyzzy ");

    const message = screen.getByText('No currency matches "xyzzy"');
    expect(message.getAttribute("aria-live")).toBe("polite");
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("reports the chosen currency, closes the panel and puts the focus back on the button", async () => {
    const onSelect = renderSelect();
    await open();

    await userEvent.click(screen.getByRole("button", { name: "USD · US Dollar" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("USD");
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("starts with an empty search and every currency the next time it is opened", async () => {
    renderSelect();
    await open();
    await userEvent.type(searchBox(), "dollar");
    await userEvent.click(screen.getByRole("button", { name: "USD · US Dollar" }));

    await open();

    expect(searchBox().value).toBe("");
    expect(items()).toHaveLength(31);
  });

  it("closes on Escape without choosing, and puts the focus back on the button", async () => {
    const onSelect = renderSelect();
    await open();
    await userEvent.type(searchBox(), "dol");

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(document.activeElement).toBe(trigger());
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("closes on a click outside and stays open on a click inside", async () => {
    const onSelect = renderSelect();
    await open();

    await userEvent.click(searchBox());
    expect(screen.getByRole("searchbox", { name: "Search currencies" })).not.toBeNull();

    await userEvent.click(screen.getByRole("heading", { name: "Outside" }));
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("closes when the button is pressed again", async () => {
    renderSelect();
    await open();

    await userEvent.click(trigger());

    expect(screen.queryByRole("searchbox")).toBeNull();
  });

  it("moves between the search box and the currencies with the arrow keys", async () => {
    renderSelect();
    await open();
    const buttons = () => within(screen.getByRole("list")).getAllByRole("button");

    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(buttons()[0]);

    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(buttons()[1]);

    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(buttons()[0]);

    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(searchBox());
  });

  it("stays on the last currency when the arrow goes past the end", async () => {
    renderSelect();
    await open();
    await userEvent.type(searchBox(), "zloty");

    await userEvent.keyboard("{ArrowDown}{ArrowDown}");

    expect(document.activeElement).toBe(within(screen.getByRole("list")).getByRole("button", { name: "PLN · Polish Zloty" }));
  });

  it("chooses the focused currency with Enter", async () => {
    const onSelect = renderSelect();
    await open();
    await userEvent.type(searchBox(), "chf");

    await userEvent.keyboard("{ArrowDown}{Enter}");

    expect(onSelect).toHaveBeenCalledWith("CHF");
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("opens with the keyboard", async () => {
    renderSelect();

    trigger().focus();
    await userEvent.keyboard("{Enter}");

    expect(searchBox()).not.toBeNull();
  });

  it("adds a currency the list does not have, such as one the server picked, and marks it as selected", async () => {
    renderSelect("RUB");

    expect(trigger("Currency RUB · Russian Ruble").textContent).toBe("RUB · Russian Ruble");
    await open("Currency RUB · Russian Ruble");

    expect(items()).toHaveLength(32);
    expect(
      within(screen.getByRole("list")).getByRole("button", { name: "RUB · Russian Ruble" }).getAttribute("aria-current")
    ).toBe("true");
  });
});
