import { useContext } from "react";
import { CurrencyContext, type CurrencyState } from "../context/currencyContext";

// The chosen currency and what to do with it. See CurrencyProvider.
export function useCurrency(): CurrencyState {
  return useContext(CurrencyContext);
}
