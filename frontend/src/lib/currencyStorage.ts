// The currency the user chose is kept in the browser. Storage can be blocked or can throw (a
// private window, site data switched off), so every access is guarded and the app works without it.
const KEY = 'spendwise.currency';
const CODE = /^[A-Z]{3}$/;

// The saved currency, or undefined when there is none, it is not a three-letter code, or the
// storage cannot be read.
export function loadCurrency(): string | undefined {
  try {
    const saved = localStorage.getItem(KEY);
    return saved !== null && CODE.test(saved) ? saved : undefined;
  } catch {
    return undefined; // storage is not available
  }
}

export function saveCurrency(code: string): void {
  try {
    localStorage.setItem(KEY, code);
  } catch {
    // storage is not available: the choice only lasts for this visit
  }
}

export function clearCurrency(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // storage is not available: there is nothing to clear
  }
}
