"use client";

import {
  createContext,
  FormEvent,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Icon } from "@/components/ui/primitives/Icon";

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

export interface ConfirmOptions {
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

export interface PromptOptions {
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

type Request =
  | { id: number; kind: "confirm"; options: ConfirmOptions }
  | { id: number; kind: "prompt"; options: PromptOptions };

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null);
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
    setRequest(null);
    resolve?.(value as never);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolverRef.current?.(false as never);
        resolverRef.current = resolve as (value: never) => void;
        setRequest({ id: counter.current++, kind: "confirm", options });
      }),
    []
  );

  const prompt = useCallback(
    (options: PromptOptions) =>
      new Promise<string | null>((resolve) => {
        resolverRef.current?.(null as never);
        resolverRef.current = resolve as (value: never) => void;
        setRequest({ id: counter.current++, kind: "prompt", options });
      }),
    []
  );

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}
      {request && (
        // Keyed by request id so each dialog mounts with its own fresh field
        // state instead of inheriting the last one's typed text.
        <DialogHost key={request.id} request={request} onSettle={settle} />
      )}
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within DialogProvider");
  return ctx;
}

function DialogHost({
  request,
  onSettle,
}: {
  request: Request;
  onSettle: (value: boolean | string | null) => void;
}) {
  const { options } = request;
  const isAr = !!options.isAr;
  const cancelValue = request.kind === "confirm" ? false : null;

  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();

  const [value, setValue] = useState(
    request.kind === "prompt" ? request.options.initialValue ?? "" : ""
  );
  const [phrase, setPhrase] = useState("");

  const confirmPhrase = request.kind === "confirm" ? request.options.confirmPhrase : undefined;
  const armed = !confirmPhrase || phrase.trim().toLowerCase() === confirmPhrase.trim().toLowerCase();

  /**
   * Escape closes, Tab stays inside, and focus goes back where it came from.
   *
   * The focus return matters more than it looks: these are triggered from a
   * row in a list, and without it a keyboard user is dropped at the top of the
   * document after every rename and has to walk back down the page.
   */
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    // Focus has to land *inside* the panel or the Tab trap below has nothing
    // to trap: the opener is still focused, outside the dialog, and the first
    // Tab walks off into the page behind the scrim. The panel itself is the
    // fallback for a dialog whose only safe first stop is "read this".
    const first = panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel;
    first?.focus();
    if (first instanceof HTMLInputElement) first.select();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onSettle(cancelValue);
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const edge = e.shiftKey ? focusable[0] : focusable[focusable.length - 1];
      if (document.activeElement === edge) {
        e.preventDefault();
        (e.shiftKey ? focusable[focusable.length - 1] : focusable[0]).focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus?.();
    };
  }, [onSettle, cancelValue]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (request.kind === "prompt") {
      const trimmed = value.trim();
      if (!trimmed) return;
      onSettle(trimmed);
      return;
    }
    if (!armed) return;
    onSettle(true);
  }

  const danger = request.kind === "confirm" && request.options.tone === "danger";
  const cancelLabel = options.cancelLabel ?? (isAr ? "إلغاء" : "Cancel");
  const confirmLabel =
    options.confirmLabel ?? (isAr ? "تأكيد" : request.kind === "prompt" ? "Save" : "Confirm");

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="fixed inset-0 z-[120] flex items-center justify-center p-6 animate-fade-in"
      style={{ background: "var(--scrim)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onSettle(cancelValue);
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby={titleId}
        aria-describedby={options.body ? bodyId : undefined}
        className="w-full max-w-[440px] rounded-[20px] p-6 flex flex-col gap-4 animate-pop"
        style={{
          background: "var(--surface-0)",
          outline: "none",
          boxShadow: "0 0 0 1px var(--hairline-strong), var(--shadow-modal)",
          fontFamily: isAr ? "var(--font-arabic)" : undefined,
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id={titleId}
            className="text-[18px] font-semibold tracking-tight leading-snug"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {options.title}
          </h2>
          <button
            type="button"
            onClick={() => onSettle(cancelValue)}
            aria-label={cancelLabel}
            className="shrink-0 w-7 h-7 -me-1 -mt-1 grid place-items-center rounded-full cursor-pointer"
            style={{ color: "var(--text-muted)" }}
          >
            <Icon name="times" size={16} />
          </button>
        </div>

        {options.body && (
          <p id={bodyId} className="text-[13.5px] leading-[1.6]" style={{ color: "var(--text-muted)" }}>
            {options.body}
          </p>
        )}

        {request.kind === "confirm" && request.options.consequences?.length ? (
          <ul
            className="flex flex-col gap-1.5 rounded-xl px-3.5 py-3"
            style={{ background: "var(--surface-2)" }}
          >
            {request.options.consequences.map((line) => (
              <li key={line} className="flex gap-2.5 text-[12.5px] leading-[1.5]">
                {/* A drawn dot rather than an icon: there is no `minus` glyph in
                    the offline icon set, and a missing glyph renders as a solid
                    square — a bullet is the one thing that must not become one. */}
                <span
                  aria-hidden
                  className="w-1 h-1 rounded-full shrink-0"
                  style={{ background: "var(--text-faint)", marginTop: 7 }}
                />
                <span style={{ color: "var(--text-secondary)" }}>{line}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {request.kind === "prompt" && (
            <label className="flex flex-col gap-1.5">
              {request.options.label && (
                <span className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
                  {request.options.label}
                </span>
              )}
              <input
                data-autofocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={request.options.placeholder}
                className="h-11 rounded-[10px] px-3.5 outline-none text-[14px]"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--text)",
                  boxShadow: "inset 0 0 0 1px var(--hairline-strong)",
                }}
              />
              {request.options.hint && (
                <span className="text-[12px]" style={{ color: "var(--text-faint)" }}>
                  {request.options.hint}
                </span>
              )}
            </label>
          )}

          {confirmPhrase && (
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                {request.kind === "confirm" && request.options.confirmPhraseLabel ? (
                  request.options.confirmPhraseLabel
                ) : (
                  <>
                    {isAr ? "اكتب " : "Type "}
                    <span className="font-semibold" style={{ color: "var(--text)" }}>
                      {confirmPhrase}
                    </span>
                    {isAr ? " للتأكيد" : " to confirm"}
                  </>
                )}
              </span>
              <div className="relative flex items-center">
                <input
                  data-autofocus
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                  placeholder={confirmPhrase}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={!armed}
                  className="w-full h-11 rounded-[10px] px-3.5 pe-10 outline-none text-[14px]"
                  style={{
                    background: "var(--surface-2)",
                    color: "var(--text)",
                    boxShadow: armed
                      ? "inset 0 0 0 1px var(--success)"
                      : "inset 0 0 0 1px var(--hairline-strong)",
                  }}
                />
                {armed && (
                  <Icon
                    name="check"
                    size={15}
                    style={{
                      color: "var(--success)",
                      position: "absolute",
                      insetInlineEnd: 12,
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
            </label>
          )}

          <div className="flex gap-2.5 justify-end">
            <button
              type="button"
              onClick={() => onSettle(cancelValue)}
              className="h-10 px-5 rounded-full text-[13px] font-semibold cursor-pointer"
              style={{
                background: "var(--surface-2)",
                color: "var(--text)",
                boxShadow: "inset 0 0 0 1px var(--hairline-strong)",
              }}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={!armed || (request.kind === "prompt" && !value.trim())}
              // Focus lands here only when nothing has to be typed first. When
              // something does, the field is the first stop and this button is
              // where the person arrives after proving they meant it.
              {...(!confirmPhrase && request.kind === "confirm" && !danger
                ? { "data-autofocus": true }
                : {})}
              className="h-10 px-5 rounded-full text-[13px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={
                danger
                  ? { background: "var(--danger)", color: "var(--danger-ink)" }
                  : { background: "var(--solid)", color: "var(--solid-ink)" }
              }
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
