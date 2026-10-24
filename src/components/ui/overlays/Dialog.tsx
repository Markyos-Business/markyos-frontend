"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePresence } from "@/hooks/usePresence";
import { DialogHost } from "./DialogHost";

/**
 * The app's own confirm and prompt.
 *
 * These replace `window.confirm` / `window.prompt`, which were doing the
 * heavy lifting on destructive actions — deleting files, handing a brand to
 * someone else, renaming a department. A native dialog is the wrong tool here
 * for four reasons, and the last two are the serious ones:
 *
 *   1. It can't be styled, so the most consequential moment in the product is
 *      the only moment that doesn't look like the product.
 *   2. It always renders left-to-right in browser chrome, so the Arabic
 *      interface breaks out of RTL exactly when the stakes are highest.
 *   3. It offers OK/Cancel and nothing else — no room to name the consequence,
 *      so "Are you sure?" is all the warning a one-way action ever got.
 *   4. Its guard is a single click, which is the same guard the action itself
 *      had. For something irreversible that is not a confirmation, it's a
 *      speed bump. `confirmPhrase` asks the person to type the name of the
 *      thing instead, which is the one guard a misclick can't pass.
 *
 * The API is promise-based so a call site reads almost exactly like the
 * `window.*` call it replaces.
 */

interface ConfirmOptions {
  title: string;
  /** What is about to happen, in plain words. */
  body?: ReactNode;
  /** Named losses, listed. Answers "what do I give up", not "what do I gain". */
  consequences?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "neutral" | "danger";
  /**
   * When set, the action stays disabled until the person types this string.
   * Reserved for the genuinely irreversible.
   */
  confirmPhrase?: string;
  /** Shown above the type-to-confirm field, e.g. "Type Nadeen Studio to confirm". */
  confirmPhraseLabel?: ReactNode;
  isAr?: boolean;
}

interface PromptOptions {
  title: string;
  body?: ReactNode;
  label?: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  hint?: string;
  isAr?: boolean;
}

interface DialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
}

type DialogRequest =
  | { id: number; kind: "confirm"; options: ConfirmOptions }
  | { id: number; kind: "prompt"; options: PromptOptions };

const DialogContext = createContext<DialogContextValue | null>(null);

type DialogProviderProps = { children: ReactNode };

const DialogProvider = ({ children }: DialogProviderProps) => {
  const [request, setRequest] = useState<DialogRequest | null>(null);
  // Open and closed is tracked apart from the request, so a dialog that has
  // just been answered stays on screen for its exit while the caller already
  // has its answer.
  const [open, setOpen] = useState(false);
  const { mounted, closing } = usePresence(open);
  const resolverRef = useRef<((value: never) => void) | null>(null);
  const counter = useRef(0);

  /**
   * Settles whatever is open and clears it. A dialog opened while another is
   * still up resolves the first as cancelled rather than dropping its promise
   * on the floor — an awaited call that never settles is a hung call site.
   */
  const settle = useCallback((value: boolean | string | null) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setOpen(false);
    resolve?.(value as never);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolverRef.current?.(false as never);
        resolverRef.current = resolve as (value: never) => void;
        setRequest({ id: counter.current++, kind: "confirm", options });
        setOpen(true);
      }),
    []
  );

  const prompt = useCallback(
    (options: PromptOptions) =>
      new Promise<string | null>((resolve) => {
        resolverRef.current?.(null as never);
        resolverRef.current = resolve as (value: never) => void;
        setRequest({ id: counter.current++, kind: "prompt", options });
        setOpen(true);
      }),
    []
  );

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}
      {request && mounted && (
        // Keyed by request id so each dialog mounts with its own fresh field
        // state instead of inheriting the last one's typed text.
        <DialogHost key={request.id} request={request} closing={closing} onSettle={settle} />
      )}
    </DialogContext.Provider>
  );
};

const useDialog = (): DialogContextValue => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within DialogProvider");
  return ctx;
};

export { DialogProvider, useDialog };
export type { ConfirmOptions, DialogProviderProps, PromptOptions, DialogRequest };
