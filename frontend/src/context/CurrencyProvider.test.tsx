import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { useCurrency } from "../hooks/useCurrency";
import { CurrencyProvider } from "./CurrencyProvider";

const wrapper = ({ children }: { children: ReactNode }) => <CurrencyProvider>{children}</CurrencyProvider>;

function setup() {
  return renderHook(() => useCurrency(), { wrapper });
}

describe("CurrencyProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("starts with no choice and no reported currency, so the server decides", () => {
    const { result } = setup();

    expect(result.current.selected).toBeUndefined();
    expect(result.current.reported).toBeUndefined();
    expect(result.current.current).toBeUndefined();
  });

  it("shows the currency a page reported until the user chooses one", () => {
    const { result } = setup();

    act(() => result.current.report("EUR"));

    expect(result.current.reported).toBe("EUR");
    expect(result.current.selected).toBeUndefined();
    expect(result.current.current).toBe("EUR");
  });

  it("shows the chosen currency, in capitals, even when the server used another one", () => {
    const { result } = setup();
    act(() => result.current.report("EUR"));

    act(() => result.current.choose("usd"));

    expect(result.current.selected).toBe("USD");
    expect(result.current.current).toBe("USD");
    expect(result.current.reported).toBe("EUR");
  });

  it("writes a reported currency in capitals", () => {
    const { result } = setup();

    act(() => result.current.report("eur"));

    expect(result.current.reported).toBe("EUR");
  });

  it.each([["US"], ["USDD"], [""], ["12$"]])("ignores a choice that is not a currency code: %j", (code) => {
    const { result } = setup();

    act(() => result.current.choose(code));

    expect(result.current.selected).toBeUndefined();
    expect(localStorage.getItem("spendwise.currency")).toBeNull();
  });

  it("falls back to the reported currency when the choice is forgotten", () => {
    const { result } = setup();
    act(() => result.current.report("EUR"));
    act(() => result.current.choose("USD"));

    act(() => result.current.forget());

    expect(result.current.selected).toBeUndefined();
    expect(result.current.current).toBe("EUR");
  });

  it("remembers the choice in the browser and starts with it the next time", () => {
    const first = setup();
    act(() => first.result.current.choose("USD"));
    expect(localStorage.getItem("spendwise.currency")).toBe("USD");
    first.unmount();

    const second = setup();

    expect(second.result.current.selected).toBe("USD");
    expect(second.result.current.current).toBe("USD");
  });

  it("removes the saved choice when it is forgotten", () => {
    localStorage.setItem("spendwise.currency", "USD");
    const { result } = setup();
    expect(result.current.selected).toBe("USD");

    act(() => result.current.forget());

    expect(localStorage.getItem("spendwise.currency")).toBeNull();
  });

  it("ignores a saved value that is not a currency code", () => {
    localStorage.setItem("spendwise.currency", "xyz");

    const { result } = setup();

    expect(result.current.selected).toBeUndefined();
  });

  it("starts with no choice when the storage cannot be read", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    const { result } = setup();

    expect(result.current.selected).toBeUndefined();
  });

  it("still lets the user choose and forget for this visit when the storage cannot be written", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { result } = setup();

    act(() => result.current.choose("USD"));
    expect(result.current.current).toBe("USD");

    act(() => result.current.forget());
    expect(result.current.current).toBeUndefined();
  });

  it("keeps the same functions between renders, so a page can use them in an effect", () => {
    const { result, rerender } = setup();
    const { choose, forget, report } = result.current;

    act(() => result.current.report("EUR"));
    rerender();

    expect(result.current.choose).toBe(choose);
    expect(result.current.forget).toBe(forget);
    expect(result.current.report).toBe(report);
  });
});

describe("useCurrency without a provider", () => {
  it("is inert: nothing is chosen and changing it does nothing, so a page asks the server to decide", () => {
    const { result } = renderHook(() => useCurrency());

    act(() => {
      result.current.choose("USD");
      result.current.report("EUR");
      result.current.forget();
    });

    expect(result.current.selected).toBeUndefined();
    expect(result.current.reported).toBeUndefined();
    expect(result.current.current).toBeUndefined();
  });
});
