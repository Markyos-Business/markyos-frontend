"use client";

import { useCallback, useId, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { Icon } from "../icon";
import { flattenErrors } from "./error-summary";
import { useFormMeta } from "./form-context";

type CollapsibleSectionProps = {
  /** What's inside, as a noun: "Advanced options" → "Show advanced options". */
  title: string;
  /** Open on first visit. Default false. */
  defaultOpen?: boolean;
  /** Remember open or closed in this browser under this key. */
  storageKey?: string;
  /** Field paths inside: an error in any of them opens the section. */
  fields?: readonly string[];
  showLabel?: string;
  hideLabel?: string;
  children: ReactNode;
};

const CHANGED = "mk-collapsible-changed";

const readOpen = (key: string | undefined, fallback: boolean) => {
  if (!key) return fallback;
  try {
    const v = window.localStorage.getItem(key);
    return v === null ? fallback : v === "1";
  } catch {
    return fallback;
  }
};

/**
 * Options most people skip: a "Show advanced options" button that opens
 * them in place. The fields stay in the form while closed (their values
 * submit), but out of reach: hidden and inert. An error inside opens it, so
 * a failed submit never points at a field nobody can see. With `storageKey`
 * it stays as the person left it.
 */
const CollapsibleSection = ({ title, defaultOpen = false, storageKey, fields, showLabel, hideLabel, children }: CollapsibleSectionProps) => {
  const meta = useFormMeta();
  const { formState } = useFormContext();
  const id = useId();
  const subscribe = useCallback((notify: () => void) => {
    window.addEventListener(CHANGED, notify);
    window.addEventListener("storage", notify);
    return () => {
      window.removeEventListener(CHANGED, notify);
      window.removeEventListener("storage", notify);
    };
  }, []);
  // Remembered in the browser with a key; for this page only without one.
  const stored = useSyncExternalStore(subscribe, () => readOpen(storageKey, defaultOpen), () => defaultOpen);
  const [local, setLocal] = useState(defaultOpen);
  const [noStore, setNoStore] = useState(false);
  const chosen = storageKey && !noStore ? stored : local;
  const hasError = !!fields?.length && flattenErrors(formState.errors).some((e) => fields.some((f) => e.path === f || e.path.startsWith(`${f}.`)));
  const open = chosen || hasError;

  const toggle = () => {
    if (!storageKey) return setLocal(!open);
    try {
      window.localStorage.setItem(storageKey, open ? "0" : "1");
      window.dispatchEvent(new Event(CHANGED));
    } catch {
      // No storage (a private window): it still toggles, for this page.
      setNoStore(true);
      setLocal(!open);
    }
  };

  return (
    <div className="flex flex-col gap-space-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={toggle}
        className="flex w-fit items-center gap-space-2 rounded-md text-body font-medium text-accent hover:underline"
      >
        <Icon name="angle-down" size={18} className={`transition-transform duration-fast motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
        {open ? (hideLabel ?? meta.strings.hide(title)) : (showLabel ?? meta.strings.show(title))}
      </button>
      <div id={`${id}-panel`} className="mk-collapse" data-open={open} inert={!open || undefined}>
        <div className="flex flex-col gap-space-6">{children}</div>
      </div>
    </div>
  );
};

export { CollapsibleSection };
export type { CollapsibleSectionProps };
