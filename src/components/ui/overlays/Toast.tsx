"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * An action a toast can carry — in practice, Undo.
 *
 * A confirm dialog in front of every small destructive action is a tax on the
 * ninety-nine times somebody meant it, paid to catch the one time they did not.
 * An undo charges nothing up front and still catches the one. It belongs on the
 * toast because the toast is already the thing that appears where the person is
 * looking the moment after the action.
 */
type ToastAction = {
  label: string;
  run: () => void;
};

type ToastVariant = "default" | "success" | "danger";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
  /** Fading out; removed once the exit has played. */
  leaving?: boolean;
};

/** How long a toast takes to fade out: `--duration-fast`. */
const EXIT_MS = 150;

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant, action?: ToastAction) => void;
};

// The edge says how it went; the fill stays neutral so the message reads.
const variants: Record<ToastVariant, string> = {
  default: "shadow-edge",
  success: "shadow-edge-success",
  danger: "shadow-edge-danger",
};

const ToastContext = createContext<ToastContextValue | null>(null);

type ToastProviderProps = { children: ReactNode };

const ToastProvider = ({ children }: ToastProviderProps) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, leaving: true } : i)));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), reduce ? 0 : EXIT_MS);
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "default", action?: ToastAction) => {
      const id = `t${counter.current++}`;
      setItems((prev) => [...prev, { id, message, variant, action }]);
      // Longer when there is something to press. 2.8 seconds is enough to read
      // a confirmation and not enough to notice a mistake, find the pointer and
      // act on it — which is the whole job of an undo.
      window.setTimeout(() => dismiss(id), action ? 7000 : 2800);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Anchored logically: a toast belongs at the end of the reading
          direction, which in Arabic is the left. This renders at the document
          root, outside the workspace shell's own `dir`, which is why that shell
          also stamps the direction onto `<html>` — without it a logical
          property here resolves against an LTR document and does nothing. */}
      {/* A polite live region: each toast is read out when it appears,
          without cutting off what the person is doing. */}
      <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-6 end-6 z-toast flex flex-col items-end gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`max-w-sm rounded-lg bg-surface-2 px-space-6 py-space-5 text-body font-medium text-text ${variants[item.variant]} ${
              item.leaving ? "pointer-events-none animate-fade-out" : "pointer-events-auto animate-fade-in"
            }`}
          >
            <span className="flex items-center gap-space-5">
              <span dir="auto" className="bidi-auto">
                {item.message}
              </span>
              {item.action && (
                <button
                  type="button"
                  onClick={() => {
                    item.action!.run();
                    dismiss(item.id);
                  }}
                  // The spec's link button: an overline in the accent.
                  className="mk-tap shrink-0 text-overline uppercase text-accent-text"
                >
                  {item.action.label}
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

export { ToastProvider, useToast };
export type { ToastAction, ToastContextValue, ToastProviderProps, ToastVariant };
