import { jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CurrencyProvider } from "../context/CurrencyProvider";
import { useCurrency } from "../hooks/useCurrency";
import InsightsPage from "./InsightsPage";

// Routes fetch calls by URL; each route returns the next queued response.
function mockApi(routes: Record<string, { status: number; body: unknown }[]>) {
  const fetchMock = jest.fn(async (url: string) => {
    const response = routes[url]?.shift();
    if (!response) throw new Error(`Unexpected request: ${url}`);
    return { ok: response.status < 400, status: response.status, json: async () => response.body };
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

const NO_TRANSACTIONS = {
  status: 200,
  body: { code: "category-changes", month: "2026-11", currency: "EUR", hasTransactions: false, changes: [] },
};

const WITH_CHANGES = {
  status: 200,
  body: {
    code: "category-changes",
    month: "2026-09",
    currency: "EUR",
    hasTransactions: true,
    changes: [
      { category: "shopping", direction: "up", amountCents: 5995 },
      { category: "other", direction: "down", amountCents: 2500 },
    ],
  },
};

const NO_CHANGES = {
  status: 200,
  body: { code: "category-changes", month: "2026-09", currency: "EUR", hasTransactions: true, changes: [] },
};

describe("InsightsPage", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows only 'No transactions yet this month.' when the user has no transactions (Test Case 15)", async () => {
    const fetchMock = mockApi({ "/api/category-changes": [NO_TRANSACTIONS] });

    render(<InsightsPage />);

    expect(await screen.findByText("No transactions yet this month.")).not.toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByRole("heading", { name: /changed this month/ })).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows Loading… first, then the headline and the table (Test Cases 19 and 1)", async () => {
    mockApi({ "/api/category-changes": [WITH_CHANGES] });

    render(<InsightsPage />);

    expect(screen.getByRole("status").textContent).toMatch(/loading/i);
    expect(await screen.findByRole("heading", { name: "🔎 2 things changed this month" })).not.toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByRole("cell", { name: "Shopping" })).not.toBeNull();
    expect(screen.getByRole("cell", { name: "Increase €60" })).not.toBeNull();
    expect(screen.getByRole("cell", { name: "Decrease €25" })).not.toBeNull();
  });

  it("shows a notice above the table when some amounts use an older exchange rate (Criterion 8)", async () => {
    mockApi({
      "/api/category-changes": [{ status: 200, body: { ...WITH_CHANGES.body, ratesApproximate: true } }],
    });

    render(<InsightsPage />);

    expect((await screen.findByRole("note")).textContent).toBe(
      "Some amounts use an older exchange rate because current rates are unavailable."
    );
    expect(screen.getByRole("table")).not.toBeNull();
  });

  it("shows 'No spending changes…' when no category changed by 1 euro or more (Test Case 16)", async () => {
    mockApi({ "/api/category-changes": [NO_CHANGES] });

    render(<InsightsPage />);

    expect(
      await screen.findByText("No spending changes compared to the same days last month.")
    ).not.toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByRole("heading", { name: /changed this month/ })).toBeNull();
  });

  it("shows an alert with Retry after an error, and the table after a successful retry (Test Case 20)", async () => {
    const fetchMock = mockApi({
      "/api/category-changes": [
        { status: 500, body: { code: "server-error", message: "Something went wrong" } },
        WITH_CHANGES,
      ],
    });

    render(<InsightsPage />);

    expect((await screen.findByRole("alert")).textContent).toBe("Something went wrong");
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("heading", { name: "🔎 2 things changed this month" })).not.toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows a friendly message when exchange rates are unavailable", async () => {
    mockApi({
      "/api/category-changes": [
        { status: 502, body: { code: "rates-unavailable", message: "Exchange rates are currently unavailable" } },
      ],
    });

    render(<InsightsPage />);

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Exchange rates are currently unavailable. Try again in a moment."
    );
  });

  describe("currency", () => {
    // Shows what the provider holds and lets a test choose a currency, as the dropdown does.
    function CurrencyProbe() {
      const { current, selected, choose } = useCurrency();
      return (
        <div>
          <p data-testid="current">{current ?? "none"}</p>
          <p data-testid="selected">{selected ?? "none"}</p>
          <button type="button" onClick={() => choose("GBP")}>
            Pick GBP
          </button>
        </div>
      );
    }

    function renderWithCurrency() {
      render(
        <CurrencyProvider>
          <CurrencyProbe />
          <InsightsPage />
        </CurrencyProvider>
      );
    }

    const inCurrency = (currency: string) => ({
      status: 200,
      body: { ...WITH_CHANGES.body, currency },
    });
    const urls = (fetchMock: { mock: { calls: unknown[][] } }) => fetchMock.mock.calls.map(([url]) => String(url));

    beforeEach(() => {
      localStorage.clear();
    });

    it("asks for no currency when none is chosen, and reports the one the server used", async () => {
      const fetchMock = mockApi({ "/api/category-changes": [WITH_CHANGES] });

      renderWithCurrency();
      await screen.findByRole("cell", { name: "Increase €60" });

      expect(urls(fetchMock)).toEqual(["/api/category-changes"]);
      await waitFor(() => expect(screen.getByTestId("current").textContent).toBe("EUR"));
      expect(screen.getByTestId("selected").textContent).toBe("none");
    });

    it("asks for the saved currency from the start, and shows the amounts in it", async () => {
      localStorage.setItem("spendwise.currency", "USD");
      const fetchMock = mockApi({ "/api/category-changes?currency=USD": [inCurrency("USD")] });

      renderWithCurrency();

      expect(await screen.findByRole("cell", { name: "Increase $60" })).not.toBeNull();
      expect(urls(fetchMock)).toEqual(["/api/category-changes?currency=USD"]);
      await waitFor(() => expect(screen.getByTestId("current").textContent).toBe("USD"));
    });

    it("loads again, in the new currency, when the user chooses one", async () => {
      const fetchMock = mockApi({
        "/api/category-changes": [WITH_CHANGES],
        "/api/category-changes?currency=GBP": [inCurrency("GBP")],
      });
      renderWithCurrency();
      await screen.findByRole("cell", { name: "Increase €60" });

      await userEvent.click(screen.getByRole("button", { name: "Pick GBP" }));

      expect(await screen.findByRole("cell", { name: "Increase £60" })).not.toBeNull();
      expect(urls(fetchMock)).toEqual(["/api/category-changes", "/api/category-changes?currency=GBP"]);
      expect(screen.getByTestId("selected").textContent).toBe("GBP");
    });

    it("shows Loading…, not the old amounts, while it loads again in the new currency", async () => {
      let release: (value: unknown) => void = () => {};
      const pending = new Promise((resolve) => {
        release = resolve;
      });
      globalThis.fetch = jest.fn(async (url: string) => {
        if (url === "/api/category-changes") {
          return { ok: true, status: 200, json: async () => WITH_CHANGES.body };
        }
        await pending;
        return { ok: true, status: 200, json: async () => inCurrency("GBP").body };
      }) as unknown as typeof fetch;
      renderWithCurrency();
      await screen.findByRole("cell", { name: "Increase €60" });

      await userEvent.click(screen.getByRole("button", { name: "Pick GBP" }));

      expect(screen.getByRole("status").textContent).toMatch(/loading/i);
      expect(screen.queryByRole("cell", { name: "Increase €60" })).toBeNull();
      release(undefined);
      expect(await screen.findByRole("cell", { name: "Increase £60" })).not.toBeNull();
    });

    it("forgets a saved currency the server rejects, asks again without it and shows no error", async () => {
      localStorage.setItem("spendwise.currency", "XYZ");
      const fetchMock = mockApi({
        "/api/category-changes?currency=XYZ": [
          { status: 400, body: { code: "invalid-currency", message: "Unsupported currency: EUR/XYZ" } },
        ],
        "/api/category-changes": [WITH_CHANGES],
      });

      renderWithCurrency();

      expect(await screen.findByRole("cell", { name: "Increase €60" })).not.toBeNull();
      expect(screen.queryByRole("alert")).toBeNull();
      expect(urls(fetchMock)).toEqual(["/api/category-changes?currency=XYZ", "/api/category-changes"]);
      expect(localStorage.getItem("spendwise.currency")).toBeNull();
      expect(screen.getByTestId("selected").textContent).toBe("none");
    });

    it("still shows an invalid-currency error when no currency was chosen, instead of asking again", async () => {
      const fetchMock = mockApi({
        "/api/category-changes": [{ status: 400, body: { code: "invalid-currency", message: "Unsupported currency" } }],
      });

      renderWithCurrency();

      expect((await screen.findByRole("alert")).textContent).toBe("Unsupported currency");
      expect(urls(fetchMock)).toHaveLength(1);
    });

    it("keeps the chosen currency when the user retries after an error", async () => {
      localStorage.setItem("spendwise.currency", "USD");
      const fetchMock = mockApi({
        "/api/category-changes?currency=USD": [
          { status: 500, body: { code: "server-error", message: "Something went wrong" } },
          inCurrency("USD"),
        ],
      });
      renderWithCurrency();
      await screen.findByRole("alert");

      await userEvent.click(screen.getByRole("button", { name: /retry/i }));

      expect(await screen.findByRole("cell", { name: "Increase $60" })).not.toBeNull();
      expect(urls(fetchMock)).toEqual(["/api/category-changes?currency=USD", "/api/category-changes?currency=USD"]);
    });
  });
});

