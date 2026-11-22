"use client";
import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
const subscribe = () => () => {};
/** Move the entire native form with its popup, preserving form ownership. */
export function PopupPortal({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  return ready ? createPortal(children, document.body) : null;
}
