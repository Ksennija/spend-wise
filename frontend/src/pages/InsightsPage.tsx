import { useEffect, useState } from "react";
import {
  getCategoryChanges,
  type CategoryChanges as CategoryChangesData,
} from "../api/categoryChanges";
import CategoryChanges from "../components/CategoryChanges/CategoryChanges";
import RatesNotice from "../components/RatesNotice/RatesNotice";
import { useCurrency } from "../hooks/useCurrency";

type View =
  | { status: "loading" }
  | { status: "ready"; data: CategoryChangesData }
  | { status: "error"; code: string; message: string };

const RATES_UNAVAILABLE_MESSAGE =
  "Exchange rates are currently unavailable. Try again in a moment.";

export default function InsightsPage() {
  const { selected, report, forget } = useCurrency();
  const [attempt, setAttempt] = useState(0);
  // The answer is kept with the request it belongs to. When the user retries or chooses another
  // currency, the request changes, and until its answer arrives the page shows "Loading…".
  const [answer, setAnswer] = useState<{ request: string; view: View } | null>(null);
  const request = `${attempt}:${selected ?? ""}`;
  const view: View =
    answer?.request === request ? answer.view : { status: "loading" };

  // Only the user's own choice goes to the server. Without one the server picks the currency.
  useEffect(() => {
    let cancelled = false;
    getCategoryChanges(selected).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setAnswer({ request, view: { status: "ready", data: result.categoryChanges } });
      } else {
        const message =
          result.code === "rates-unavailable"
            ? RATES_UNAVAILABLE_MESSAGE
            : result.message;
        setAnswer({ request, view: { status: "error", code: result.code, message } });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [request, selected]);

  // The currency the server used is what the dropdown shows until the user chooses one.
  const usedCurrency = view.status === "ready" ? view.data.currency : undefined;
  useEffect(() => {
    if (usedCurrency) report(usedCurrency);
  }, [usedCurrency, report]);

  // A saved currency the server does not know is forgotten, and the page asks again without it.
  // Until then the page waits instead of showing an error.
  const rejectedCurrency =
    view.status === "error" &&
    view.code === "invalid-currency" &&
    selected !== undefined;
  useEffect(() => {
    if (rejectedCurrency) forget();
  }, [rejectedCurrency, forget]);

  function retry() {
    setAttempt((n) => n + 1);
  }

  return (
    <div>
      <h1>Insights</h1>

      {(view.status === "loading" || rejectedCurrency) && (
        <p role="status">Loading…</p>
      )}

      {view.status === "error" && !rejectedCurrency && (
        <>
          <p role="alert" style={{ color: "crimson" }}>
            {view.message}
          </p>
          <button type="button" onClick={retry}>
            Retry
          </button>
        </>
      )}

      {view.status === "ready" && view.data.ratesApproximate && <RatesNotice />}

      {view.status === "ready" && !view.data.hasTransactions && (
        <p>No transactions yet this month.</p>
      )}

      {view.status === "ready" &&
        view.data.hasTransactions &&
        view.data.changes.length === 0 && (
          <p>No spending changes compared to the same days last month.</p>
        )}

      {view.status === "ready" &&
        view.data.hasTransactions &&
        view.data.changes.length > 0 && (
          <CategoryChanges
            changes={view.data.changes}
            currency={view.data.currency}
          />
        )}
    </div>
  );
}
