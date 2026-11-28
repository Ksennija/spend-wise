export type Currency = { code: string; name: string };

// The currencies the exchange rate service (Frankfurter) can convert, in the order of their codes.
export const CURRENCY_CODES = [
  'AUD', 'BGN', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP',
  'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MXN', 'MYR',
  'NOK', 'NZD', 'PHP', 'PLN', 'RON', 'SEK', 'SGD', 'THB', 'TRY', 'USD',
  'ZAR',
];

const NAMES = new Intl.DisplayNames(['en'], { type: 'currency' });

// "Euro" for EUR. A code the browser does not know, or one that is not three letters, is shown as
// it is.
export function currencyName(code: string): string {
  try {
    return NAMES.of(code) ?? code;
  } catch {
    return code;
  }
}

// What the dropdown shows for a currency: "EUR · Euro".
export function currencyLabel(currency: Currency): string {
  return `${currency.code} · ${currency.name}`;
}

// The currencies to choose from, in the order of their codes. A currency the server picked for
// the user (the most common one of their transactions) may not be supported for conversion lists
// like ours; it is added so the dropdown can still show it.
export function currencyOptions(extraCode?: string): Currency[] {
  const codes = new Set(CURRENCY_CODES);
  if (extraCode) codes.add(extraCode.toUpperCase());
  return [...codes].sort().map((code) => ({ code, name: currencyName(code) }));
}

// A currency matches when the text appears in its code or in its name, whatever the letter case.
// Spaces around the text do not count. Without text every currency matches.
export function searchCurrencies(currencies: Currency[], text: string): Currency[] {
  const needle = text.trim().toLocaleLowerCase();
  if (needle === '') return currencies;
  return currencies.filter(
    ({ code, name }) =>
      code.toLocaleLowerCase().includes(needle) || name.toLocaleLowerCase().includes(needle),
  );
}
