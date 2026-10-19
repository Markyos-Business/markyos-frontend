"use client";

import { useEffect, useRef } from "react";

/**
 * Escape closes it, and the focus goes back where it came from.
 *
 * The app grew seven hand-rolled modals — the asset detail panel, the colour
 * editor, the two importers, the logo preview, the extract-from-logo sheet, the
 * competitor editor — and every one of them could only be dismissed by clicking
 * the backdrop or finding the ×. Escape is the key people press when they want
 * out of something, and a panel that ignores it is a panel you feel stuck in.
 * A pointer-only exit is also no exit at all for anybody on a keyboard.
 *
 * `components/Dialog.tsx` already does all of this — it is the shared confirm
 * and prompt, and it traps Tab as well. This is the smaller half of the same
 * job, for the panels that carry their own layout and only needed the
 * behaviour.
 *
 * **Focus goes back to the opener.** Without it, closing a modal drops the
 * caret at the top of the document, so tabbing after dismissing an asset panel
 * starts again from the sidebar rather than returning to the card that opened
 * it — a small loss of place every single time.
 */
export function useModalDismiss(onClose: () => void) {
  // Read at mount, before the modal moves focus into itself.
  const openerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      // Stopped here, so a modal inside a modal closes only the top one.
      e.stopPropagation();
      closeRef.current();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // `isConnected`, because the thing that opened the modal is sometimes
      // removed by what the modal did — refocusing a detached node silently
      // moves focus to the body, which is the state this is here to avoid.
      const opener = openerRef.current;
      if (opener?.isConnected) opener.focus?.();
    };
  }, []);
}
