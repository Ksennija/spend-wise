import { createContext } from "react";

export type CurrencyState = {
  selected: string | undefined; // what the user chose; undefined means "the server decides"
  reported: string | undefined; // the currency of the last response, which the server chose
  current: string | undefined; // what to show: the choice, else the one the server used
  choose: (code: string) => void;
  forget: () => void; // drops the choice, e.g. when the server rejects it
  report: (code: string) => void; // a page tells which currency its response used
};

// Without a provider (a page tested on its own) the state is inert: nothing is chosen and nothing
// can be changed, so the page asks the server to decide.
const INERT: CurrencyState = {
  selected: undefined,
  reported: undefined,
  current: undefined,
  choose: () => {},
  forget: () => {},
  report: () => {},
};

export const CurrencyContext = createContext<CurrencyState>(INERT);
