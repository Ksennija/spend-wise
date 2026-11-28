import { useId } from 'react';
import { useDropdown } from '../../hooks/useDropdown';
import { CATEGORIES } from '../../lib/categories';
import styles from './CategoryFilter.module.scss';

type Props = {
  selected: string[]; // category ids; empty means all
  onChange: (selected: string[]) => void;
};

// What the button says: nothing checked is "All categories", one or two are named, more are counted.
function buttonText(selected: string[]): string {
  if (selected.length === 0) return 'All categories';
  if (selected.length > 2) return `${selected.length} categories`;
  return CATEGORIES.filter((c) => selected.includes(c.id))
    .map((c) => c.label)
    .join(', ');
}

export default function CategoryFilter({ selected, onChange }: Props) {
  const { open, toggle, close, rootProps, buttonRef } = useDropdown();
  const panelId = useId();

  function toggleCategory(id: string, checked: boolean) {
    // Reported in the order of the list, not in the order of the clicks.
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    onChange(CATEGORIES.filter((c) => next.has(c.id)).map((c) => c.id));
  }

  return (
    <div {...rootProps} className={styles.root}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        {buttonText(selected)}
      </button>

      {open && (
        <div id={panelId} className={styles.panel}>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Categories</legend>
            {CATEGORIES.map((category) => (
              <div key={category.id}>
                <label className={styles.option}>
                  <input
                    type="checkbox"
                    checked={selected.includes(category.id)}
                    onChange={(e) => toggleCategory(category.id, e.target.checked)}
                  />{' '}
                  {category.label}
                </label>
              </div>
            ))}
          </fieldset>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.action}
              disabled={selected.length === 0}
              onClick={() => onChange([])}
            >
              Clear
            </button>
            <button type="button" className={styles.action} onClick={close}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
