"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../buttons/Button";
import { Icon } from "../primitives/Icon";
import type { DialogRequest } from "./Dialog";

type DialogHostProps = {
  request: DialogRequest;
  /** Answered and on its way out: play the exit, take no more clicks. */
  closing?: boolean;
  onSettle: (value: boolean | string | null) => void;
};

const DialogHost = ({ request, closing = false, onSettle }: DialogHostProps) => {
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
      className={`fixed inset-0 z-dialog flex items-center justify-center bg-scrim p-6 ${
        closing ? "pointer-events-none animate-fade-out" : "animate-fade-in"
      }`}
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
        className={`flex w-full max-w-110 flex-col gap-space-6 rounded-card bg-surface-1 p-space-10 shadow-edge-modal ${
          isAr ? "font-arabic" : ""
        } ${closing ? "animate-fade-out" : "animate-fade-in"}`}
        // Inline on purpose: the panel takes focus only so the Tab trap has
        // somewhere to start, and the focus-ring rule yields to an inline
        // outline (tailwind/base.js), where it would not yield to a class.
        style={{ outline: "none" }}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-h4 font-medium text-text">
            {options.title}
          </h2>
          <button
            type="button"
            onClick={() => onSettle(cancelValue)}
            aria-label={cancelLabel}
            className="-me-1 -mt-1 grid size-7 shrink-0 place-items-center rounded-lg text-text-muted"
          >
            <Icon name="times" size={16} />
          </button>
        </div>

        {options.body && (
          <p id={bodyId} className="text-body text-text-muted">
            {options.body}
          </p>
        )}

        {request.kind === "confirm" && request.options.consequences?.length ? (
          <ul className="flex flex-col gap-1.5 rounded-lg bg-surface-sunken px-space-6 py-space-5">
            {request.options.consequences.map((line) => (
              <li key={line} className="flex gap-2.5 text-body">
                {/* A drawn dot rather than an icon: there is no `minus` glyph in
                    the offline icon set, and a missing glyph renders as a solid
                    square — a bullet is the one thing that must not become one. */}
                <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-text-faint" />
                <span className="text-text-secondary">{line}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {request.kind === "prompt" && (
            <label className="flex flex-col gap-space-2">
              {request.options.label && (
                <span className="text-caption text-text-muted">
                  {request.options.label}
                </span>
              )}
              <input
                data-autofocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={request.options.placeholder}
                className="mk-underline"
              />
              {request.options.hint && (
                <span className="text-caption text-text-faint">
                  {request.options.hint}
                </span>
              )}
            </label>
          )}

          {confirmPhrase && (
            <label className="flex flex-col gap-space-2">
              <span className="text-caption text-text-muted">
                {request.kind === "confirm" && request.options.confirmPhraseLabel ? (
                  request.options.confirmPhraseLabel
                ) : (
                  <>
                    {isAr ? "اكتب " : "Type "}
                    <span className="font-medium text-text">
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
                  data-state={armed ? "success" : undefined}
                  className="mk-underline w-full pe-space-11"
                />
                {armed && (
                  <Icon name="check" size={16} className="pointer-events-none absolute end-space-4 text-success" />
                )}
              </div>
            </label>
          )}

          <div className="flex gap-space-4 justify-end">
            <Button type="button" variant="outline" onClick={() => onSettle(cancelValue)}>
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              variant={danger ? "danger" : "primary"}
              disabled={!armed || (request.kind === "prompt" && !value.trim())}
              // Focus lands here only when nothing has to be typed first. When
              // something does, the field is the first stop and this button is
              // where the person arrives after proving they meant it.
              {...(!confirmPhrase && request.kind === "confirm" && !danger
                ? { "data-autofocus": true }
                : {})}
            >
              {confirmLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { DialogHost };
export type { DialogHostProps };
