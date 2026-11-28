import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useDropdown } from "../../hooks/useDropdown";
import {
  currencyLabel,
  currencyOptions,
  searchCurrencies,
  type Currency,
} from "../../lib/currencies";
import SearchBox from "../SearchBox/SearchBox";
import styles from "./CurrencySelect.module.scss";

type CurrencySelectProps = {
  current: string | undefined; // the currency in use; undefined until the server has answered
  onSelect: (code: string) => void;
};

function cx(...names: Array<string | false | undefined>) {
  return names.filter(Boolean).join(" ");
}

type CurrencyPanelProps = {
  id: string;
  options: Currency[];
  current: string | undefined;
  onChoose: (code: string) => void;
};

// The panel: a search box and the list of currencies. It is only on the page while the dropdown is
// open, so it starts with an empty search every time.
function CurrencyPanel({ id, options, current, onChoose }: CurrencyPanelProps) {
  const [text, setText] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const shown = searchCurrencies(options, text);

  // The search box has the focus when the panel opens, so the user can type at once.
  useEffect(() => {
    panelRef.current?.querySelector("input")?.focus();
  }, []);

  // The arrow keys move between the search box and the currencies.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const panel = panelRef.current;
    if (!panel) return;

    const items = Array.from(panel.querySelectorAll<HTMLButtonElement>("button[data-currency]"));
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    event.preventDefault();
    if (event.key === "ArrowDown") {
      items[index === -1 ? 0 : index + 1]?.focus();
    } else if (index <= 0) {
      panel.querySelector("input")?.focus();
    } else {
      items[index - 1]?.focus();
    }
  }

  return (
    <div id={id} ref={panelRef} className={styles.panel} onKeyDown={handleKeyDown}>
      <SearchBox
        value={text}
        onChange={setText}
        label="Search currencies"
        placeholder="Search currencies…"
      />
      <ul className={styles.list}>
        {shown.map((currency) => (
          <li key={currency.code}>
            <button
              type="button"
              data-currency={currency.code}
              className={cx(styles.option, currency.code === current && styles.selected)}
              aria-current={currency.code === current ? "true" : undefined}
              onClick={() => onChoose(currency.code)}
            >
              {currencyLabel(currency)}
            </button>
          </li>
        ))}
      </ul>
      <p className={styles.empty} aria-live="polite">
        {shown.length === 0 ? `No currency matches "${text.trim()}"` : ""}
      </p>
    </div>
  );
}

// The currency dropdown of the designs: a button with the current currency, and under it a panel
// with a search box and the list of currencies. Choosing a currency reports it and closes the panel.
export default function CurrencySelect({ current, onSelect }: CurrencySelectProps) {
  const { open, toggle, close, rootProps, buttonRef } = useDropdown();
  const labelId = useId();
  const buttonId = useId();
  const panelId = useId();

  // The server may use a currency that is not in our list; it is added so it can be shown.
  const options = currencyOptions(current);
  const currentOption = options.find((currency) => currency.code === current);

  function choose(code: string) {
    onSelect(code);
    close();
  }

  return (
    <div className={styles.currency}>
      <span id={labelId} className={styles.label}>
        Currency
      </span>
      <div {...rootProps} className={styles.root}>
        <button
          ref={buttonRef}
          id={buttonId}
          type="button"
          className={styles.button}
          aria-labelledby={`${labelId} ${buttonId}`}
          aria-expanded={open}
          aria-controls={panelId}
          disabled={current === undefined}
          onClick={toggle}
        >
          {currentOption ? currencyLabel(currentOption) : "…"}
        </button>

        {open && <CurrencyPanel id={panelId} options={options} current={current} onChoose={choose} />}
      </div>
    </div>
  );
}
