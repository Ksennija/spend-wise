import { jest } from "@jest/globals";
import { clearCurrency, loadCurrency, saveCurrency } from "./currencyStorage";

describe("currencyStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("has no currency at first", () => {
    expect(loadCurrency()).toBeUndefined();
  });

  it("gives back a saved currency", () => {
    saveCurrency("USD");

    expect(loadCurrency()).toBe("USD");
  });

  it("forgets a currency that was cleared", () => {
    saveCurrency("USD");

    clearCurrency();

    expect(loadCurrency()).toBeUndefined();
  });

  it.each([["usd"], ["US"], ["USDD"], [""], ["12$"]])("ignores a saved value that is not a currency code: %j", (value) => {
    localStorage.setItem("spendwise.currency", value);

    expect(loadCurrency()).toBeUndefined();
  });

  it("does not throw when reading is blocked, and has no currency", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(loadCurrency()).toBeUndefined();
  });

  it("does not throw when writing is blocked", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => saveCurrency("USD")).not.toThrow();
  });

  it("does not throw when removing is blocked", () => {
    jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => clearCurrency()).not.toThrow();
  });
});
