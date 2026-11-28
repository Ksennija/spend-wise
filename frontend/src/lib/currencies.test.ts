import {
  CURRENCY_CODES,
  currencyLabel,
  currencyName,
  currencyOptions,
  searchCurrencies,
} from "./currencies";

const codes = (list: { code: string }[]) => list.map((currency) => currency.code);

describe("CURRENCY_CODES", () => {
  it("has the 31 currencies the rate service supports, each once, in the order of their codes", () => {
    expect(CURRENCY_CODES).toHaveLength(31);
    expect(new Set(CURRENCY_CODES).size).toBe(31);
    expect([...CURRENCY_CODES].sort()).toEqual(CURRENCY_CODES);
    for (const code of CURRENCY_CODES) expect(code).toMatch(/^[A-Z]{3}$/);
  });

  it("includes the common ones", () => {
    expect(CURRENCY_CODES).toEqual(expect.arrayContaining(["EUR", "USD", "GBP", "CHF", "JPY"]));
  });
});

describe("currencyName", () => {
  it("gives the English name of a currency", () => {
    expect(currencyName("EUR")).toBe("Euro");
    expect(currencyName("USD")).toBe("US Dollar");
  });

  it("falls back to the code when the name is unknown or the code is malformed", () => {
    expect(currencyName("EU")).toBe("EU");
    expect(currencyName("not a code")).toBe("not a code");
  });
});

describe("currencyLabel", () => {
  it("joins the code and the name", () => {
    expect(currencyLabel({ code: "EUR", name: "Euro" })).toBe("EUR · Euro");
  });
});

describe("currencyOptions", () => {
  it("lists every supported currency with its name, in the order of the codes", () => {
    const options = currencyOptions();

    expect(codes(options)).toEqual(CURRENCY_CODES);
    expect(options.find((currency) => currency.code === "EUR")?.name).toBe("Euro");
  });

  it("adds a currency that is not supported, in its place in the order", () => {
    const options = currencyOptions("RUB");

    expect(options).toHaveLength(32);
    expect(codes(options)).toEqual([...CURRENCY_CODES, "RUB"].sort());
    expect(options.find((currency) => currency.code === "RUB")?.name).toBe("Russian Ruble");
  });

  it("writes an added code in capitals", () => {
    expect(codes(currencyOptions("rub"))).toContain("RUB");
  });

  it("does not add a currency twice", () => {
    expect(currencyOptions("EUR")).toHaveLength(31);
    expect(currencyOptions("eur")).toHaveLength(31);
  });
});

describe("searchCurrencies", () => {
  const all = currencyOptions();

  it("finds a currency by its code", () => {
    expect(codes(searchCurrencies(all, "usd"))).toEqual(["USD"]);
  });

  it("finds a currency by its name", () => {
    expect(codes(searchCurrencies(all, "euro"))).toContain("EUR");
    expect(codes(searchCurrencies(all, "zloty"))).toEqual(["PLN"]);
  });

  it("finds every currency whose name has the word", () => {
    const found = codes(searchCurrencies(all, "dollar"));

    expect(found).toEqual(expect.arrayContaining(["USD", "CAD", "AUD"]));
    expect(found).not.toContain("EUR");
  });

  it("ignores letter case", () => {
    expect(searchCurrencies(all, "DOLLAR")).toEqual(searchCurrencies(all, "dollar"));
    expect(codes(searchCurrencies(all, "Usd"))).toEqual(["USD"]);
  });

  it("ignores spaces around the text", () => {
    expect(codes(searchCurrencies(all, "  usd  "))).toEqual(["USD"]);
  });

  it("returns every currency for an empty text or only spaces", () => {
    expect(searchCurrencies(all, "")).toEqual(all);
    expect(searchCurrencies(all, "   ")).toEqual(all);
  });

  it("returns nothing when no currency matches", () => {
    expect(searchCurrencies(all, "xyzzy")).toEqual([]);
  });

  it("keeps the order of the list", () => {
    const found = codes(searchCurrencies(all, "dollar"));

    expect(found).toEqual([...found].sort());
  });
});
