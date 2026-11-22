"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../button/button";
import { Icon } from "../icon";
import type { DialogRequest } from "./dialog";
import { Popup } from "../popup";

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

  const [value, setValue] = useState(
    request.kind === "prompt" ? request.options.initialValue ?? "" : ""
  );
  const [phrase, setPhrase] = useState("");

  const confirmPhrase = request.kind === "confirm" ? request.options.confirmPhrase : undefined;
  const armed = !confirmPhrase || phrase.trim().toLowerCase() === confirmPhrase.trim().toLowerCase();

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

  const danger = request.options.tone === "danger";
  const cancelLabel = options.cancelLabel ?? (isAr ? "إلغاء" : "Cancel");
  const confirmLabel =
    options.confirmLabel ?? (isAr ? "تأكيد" : request.kind === "prompt" ? "Save" : "Confirm");

  return (
    <Popup open={!closing} onOpenChange={next => { if (!next) onSettle(cancelValue); }} title={options.title} description={options.body} size="sm" dir={isAr ? "rtl" : "ltr"} closeLabel={cancelLabel}>
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
                className="mk-field"
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
                  className="mk-field w-full pe-space-11"
                />
                {armed && (
                  <Icon name="check" size={16} className="pointer-events-none absolute end-space-4 text-success" />
                )}
              </div>
            </label>
          )}

          <div className="flex gap-space-4 justify-end">
            <Button type="button" variant="secondary" onClick={() => onSettle(cancelValue)}>
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
    </Popup>
  );
};

export { DialogHost };
export type { DialogHostProps };
