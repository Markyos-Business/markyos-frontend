"use client";

import { InputHTMLAttributes, ReactNode, useId, useState } from "react";
import { FieldNote, inputClasses, labelClasses } from "@/components/form";
import { IconButton } from "@/components/ui";
import { scorePassword } from "../../utils/password";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type"> {
  label: string;
  labelRight?: ReactNode;
  error?: string;
  hint?: string;
  /** Draws the strength meter. Only for a password being *chosen*. */
  strength?: boolean;
}

/**
 * A password box with an eye, and — when one is being chosen — a meter.
 *
 * Reveal is not a nicety. Typing a long password blind on a phone keyboard is
 * where people give up and pick something short instead, so hiding the reveal
 * makes passwords worse, not safer. It starts hidden, and the button says which
 * way it is about to go.
 *
 * The meter is deliberately absent on the login form. Telling someone their
 * existing password is "weak" while they are trying to get in is a criticism
 * they can do nothing about at that moment.
 */
export function PasswordField({
  label,
  labelRight,
  error,
  hint,
  strength = false,
  value,
  ...inputProps
}: Props) {
  const reactId = useId();
  const id = inputProps.id ?? `pw-${reactId}`;
  const noteId = `${id}-note`;
  const meterId = `${id}-meter`;
  const [shown, setShown] = useState(false);

  const text = typeof value === "string" ? value : "";
  const rating = strength && text ? scorePassword(text) : null;
  const note = error ?? hint;

  // Solved against the card, not the canvas: the meter sits on surface-1.
  const BAR = ["bg-danger-fill", "bg-danger-fill", "bg-warning", "bg-success", "bg-success"];
  const INK = ["text-danger", "text-danger", "text-warning", "text-success", "text-success"];

  return (
    <div className="flex min-h-field w-full flex-col gap-space-2">
      <div className="flex items-center justify-between pe-space-4">
        <label htmlFor={id} className={labelClasses}>
          {label}
        </label>
        {labelRight}
      </div>

      <div className="relative">
        <input
          {...inputProps}
          id={id}
          value={value}
          type={shown ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={[note ? noteId : null, rating ? meterId : null].filter(Boolean).join(" ") || undefined}
          className={`${inputClasses} pe-10`}
        />
        <IconButton
          onClick={() => setShown((v) => !v)}
          // The label says what the button does next, not what state the field
          // is in: "Show password" is an instruction, "Password hidden" is a
          // status, and a button should read as the former.
          label={shown ? "Hide password" : "Show password"}
          icon={shown ? "eye-slash" : "eye"}
          className="absolute inset-e-1 top-1/2 -translate-y-1/2 text-text-muted"
        />
      </div>

      {rating && (
        <div id={meterId} className="mt-0.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <div className="flex flex-1 gap-1" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-0.75 flex-1 rounded-full transition-colors ${
                    i < rating.score ? BAR[rating.score] : "bg-surface-3"
                  }`}
                />
              ))}
            </div>
            <span className={`shrink-0 text-caption font-medium ${INK[rating.score]}`}>{rating.label}</span>
          </div>
          {rating.advice && <span className="text-caption text-text-faint">{rating.advice}</span>}
        </div>
      )}

      <FieldNote id={noteId} error={error} hint={hint} />
    </div>
  );
}
