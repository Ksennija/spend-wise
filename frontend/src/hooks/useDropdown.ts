import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';

// The open-and-close behaviour that every dropdown of the app shares: a button opens a panel,
// Escape and a click outside close it, and closing with the keyboard or by choosing something
// gives the focus back to the button.
//
// Spread `rootProps` on the element that wraps the button and the panel, and give `buttonRef` to
// the button. The component then only has to say what is in the panel.
export function useDropdown() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggle = useCallback(() => setOpen((isOpen) => !isOpen), []);

  // Closes the panel and puts the focus back on the button, for Escape, a Close button or a choice.
  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  // A click outside closes the panel and leaves the focus where the click put it.
  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape' && open) close();
  }

  return {
    open,
    toggle,
    close,
    buttonRef,
    rootProps: { ref: rootRef, onKeyDown: handleKeyDown },
  };
}
