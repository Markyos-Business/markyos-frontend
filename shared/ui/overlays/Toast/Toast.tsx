"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

/**
 * An action a toast can carry — in practice, Undo.
 *
 * A confirm dialog in front of every small destructive action is a tax on the
 * ninety-nine times somebody meant it, paid to catch the one time they did not.
 * An undo charges nothing up front and still catches the one. It belongs on the
 * toast because the toast is already the thing that appears where the person is
 * looking the moment after the action.
 */
export interface ToastAction {
  label: string;
  run: () => void;
}

interface ToastItem {
  id: string;
  message: string;
  variant: "default" | "success" | "danger";
  action?: ToastAction;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastItem["variant"], action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastItem["variant"] = "default", action?: ToastAction) => {
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
      <div className="fixed bottom-6 end-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {items.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto max-w-sm rounded-xl px-4 py-3 text-[13px] font-medium shadow-lg animate-toast-in"
            style={{
              background: "var(--surface-2)",
              color: "var(--text)",
              boxShadow:
                item.variant === "danger"
                  ? "inset 0 0 0 1px rgba(255,128,139,.5)"
                  : item.variant === "success"
                  ? "inset 0 0 0 1px rgba(124,231,172,.5)"
                  : "inset 0 0 0 1px var(--hairline-strong)",
            }}
          >
            <span className="flex items-center gap-3">
              <span dir="auto" className="bidi-auto">{item.message}</span>
              {item.action && (
                <button
                  type="button"
                  onClick={() => {
                    item.action!.run();
                    dismiss(item.id);
                  }}
                  className="mk-tap shrink-0 rounded-full px-2.5 h-7 text-[12px] font-semibold cursor-pointer"
                  style={{ background: "var(--surface-0)", color: "var(--accent-text)" }}
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
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
