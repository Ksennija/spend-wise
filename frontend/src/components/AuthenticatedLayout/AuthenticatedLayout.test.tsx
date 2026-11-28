import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CurrencyProvider } from "../../context/CurrencyProvider";
import AuthenticatedLayout from "./AuthenticatedLayout";

function renderLayout() {
  render(
    <AuthenticatedLayout user={{ email: "user@example.com" }}>
      <h1>Some page</h1>
    </AuthenticatedLayout>
  );
}

describe("AuthenticatedLayout", () => {
  it("shows who is signed in above the page", () => {
    renderLayout();

    const user = screen.getByText("Logged in as user@example.com");
    const heading = screen.getByRole("heading", { level: 1, name: "Some page" });
    expect(user.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("puts the page inside the one main landmark", () => {
    renderLayout();

    const main = screen.getByRole("main");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(main.contains(screen.getByRole("heading", { name: "Some page" }))).toBe(true);
    expect(main.contains(screen.getByText("Logged in as user@example.com"))).toBe(true);
  });
});

describe("AuthenticatedLayout currency dropdown", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function renderWithCurrency(showCurrency?: boolean) {
    render(
      <CurrencyProvider>
        <AuthenticatedLayout user={{ email: "user@example.com" }} showCurrency={showCurrency}>
          <h1>Some page</h1>
        </AuthenticatedLayout>
      </CurrencyProvider>
    );
  }

  it("has no currency dropdown unless it is asked for", () => {
    renderWithCurrency();

    expect(screen.queryByText("Currency")).toBeNull();
  });

  it("shows the currency dropdown after the user line, in the same bar, when asked", () => {
    renderWithCurrency(true);

    const user = screen.getByText("Logged in as user@example.com");
    const label = screen.getByText("Currency");
    expect(user.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(user.parentElement).toBe(label.closest("div")?.parentElement);
  });

  it("waits for a currency: the button is disabled until the server or the user has named one", () => {
    renderWithCurrency(true);

    expect((screen.getByRole("button", { name: "Currency …" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the currency the user chose earlier", () => {
    localStorage.setItem("spendwise.currency", "USD");

    renderWithCurrency(true);

    expect(screen.getByRole("button", { name: "Currency USD · US Dollar" })).not.toBeNull();
  });

  it("changes the currency and remembers it when the user picks one", async () => {
    localStorage.setItem("spendwise.currency", "USD");
    renderWithCurrency(true);

    await userEvent.click(screen.getByRole("button", { name: "Currency USD · US Dollar" }));
    await userEvent.click(screen.getByRole("button", { name: "GBP · British Pound" }));

    expect(screen.getByRole("button", { name: "Currency GBP · British Pound" })).not.toBeNull();
    expect(localStorage.getItem("spendwise.currency")).toBe("GBP");
  });

  it("still puts the page inside the one main landmark", () => {
    renderWithCurrency(true);

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("main").contains(screen.getByText("Currency"))).toBe(true);
  });
});

