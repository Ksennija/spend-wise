import { useCallback, useMemo, useState, type ReactNode } from "react";
import { clearCurrency, loadCurrency, saveCurrency } from "../lib/currencyStorage";
import { CurrencyContext } from "./currencyContext";

const CODE = /^[A-Z]{3}$/;

// Keeps the chosen currency for every page below it, so it survives moving between pages, and
// remembers it in the browser across reloads.
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<string | undefined>(loadCurrency);
  const [reported, setReported] = useState<string | undefined>(undefined);

  const choose = useCallback((code: string) => {
    const upper = code.toUpperCase();
    if (!CODE.test(upper)) return;
    setSelected(upper);
    saveCurrency(upper);
  }, []);

  const forget = useCallback(() => {
    setSelected(undefined);
    clearCurrency();
  }, []);

  const report = useCallback((code: string) => {
    setReported(code.toUpperCase());
  }, []);

  const value = useMemo(
    () => ({ selected, reported, current: selected ?? reported, choose, forget, report }),
    [selected, reported, choose, forget, report]
  );

  return <CurrencyContext value={value}>{children}</CurrencyContext>;
}
