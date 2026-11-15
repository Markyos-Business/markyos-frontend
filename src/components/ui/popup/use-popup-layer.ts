"use client";
import { useEffect, useRef, type RefObject } from "react";
const layers: symbol[] = [];
let bodyOverflow = "";
const hidden = new Map<HTMLElement, { count: number; previous: string | null }>();
const controls = 'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])';
const portal = '[data-popup-portal],[data-radix-popper-content-wrapper]';
function visible(element: HTMLElement) { return element.getClientRects().length > 0 && !element.closest('[inert],[hidden],[aria-hidden="true"]'); }

/** One active keyboard layer, one scroll lock, and restoration to the actual opener. */
export function usePopupLayer({ open, panel, root, onClose, dismissOnEscape, initialFocusRef, returnFocusRef }: {
  open: boolean; panel: RefObject<HTMLDivElement | null>; root: RefObject<HTMLDivElement | null>;
  onClose: () => void; dismissOnEscape: boolean; initialFocusRef?: RefObject<HTMLElement | null>; returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  const latest = useRef({ onClose, dismissOnEscape });
  useEffect(() => { latest.current = { onClose, dismissOnEscape }; });
  useEffect(() => {
    if (!open || !panel.current || !root.current) return;
    const token = Symbol("popup"); const element = panel.current;
    const opener = returnFocusRef?.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    if (!layers.length) { bodyOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; }
    layers.push(token);
    const top = () => layers.at(-1) === token;
    const requested = initialFocusRef?.current;
    const first = requested && element.contains(requested) && visible(requested) ? requested : Array.from(element.querySelectorAll<HTMLElement>('[data-autofocus],input:not([type="hidden"]):not(:disabled),select:not(:disabled),textarea:not(:disabled),[role="combobox"]')).find(visible) ?? element;
    first.focus({ preventScroll: true });
    if (first instanceof HTMLInputElement && first.hasAttribute("data-autofocus")) first.select();
    const siblings = Array.from(document.body.children).filter((node): node is HTMLElement => node instanceof HTMLElement && node !== root.current && !node.contains(root.current) && !["SCRIPT", "STYLE", "LINK"].includes(node.tagName));
    for (const node of siblings) { const state = hidden.get(node) ?? { count: 0, previous: node.getAttribute("aria-hidden") }; state.count++; hidden.set(node, state); node.setAttribute("aria-hidden", "true"); }
    function key(event: KeyboardEvent) {
      if (!top() || event.defaultPrevented) return;
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); if (latest.current.dismissOnEscape) latest.current.onClose(); return; }
      if (event.key !== "Tab") return;
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.closest(portal) && !element.contains(active)) return;
      const items = Array.from(element.querySelectorAll<HTMLElement>(controls)).filter(visible);
      if (!items.length) { event.preventDefault(); element.focus(); return; }
      const head = items[0], tail = items.at(-1)!;
      if (event.shiftKey && (active === head || active === element)) { event.preventDefault(); tail.focus(); }
      else if (!event.shiftKey && (active === tail || !element.contains(active))) { event.preventDefault(); head.focus(); }
    }
    function focus(event: FocusEvent) {
      const target = event.target;
      if (!top() || !(target instanceof HTMLElement) || element.contains(target) || target.closest(portal)) return;
      (Array.from(element.querySelectorAll<HTMLElement>(controls)).find(visible) ?? element).focus({ preventScroll: true });
    }
    window.addEventListener("keydown", key);
    document.addEventListener("focusin", focus);
    return () => {
      const wasTop = top(); const index = layers.indexOf(token); if (index >= 0) layers.splice(index, 1);
      window.removeEventListener("keydown", key); document.removeEventListener("focusin", focus);
      for (const node of siblings) { const state = hidden.get(node); if (!state) continue; state.count--; if (!state.count) { if (state.previous === null) node.removeAttribute("aria-hidden"); else node.setAttribute("aria-hidden", state.previous); hidden.delete(node); } }
      if (!layers.length) document.body.style.overflow = bodyOverflow;
      if (wasTop && opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open, panel, root, initialFocusRef, returnFocusRef]);
}
