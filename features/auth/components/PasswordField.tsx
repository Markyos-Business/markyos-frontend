"use client";

import { InputHTMLAttributes, ReactNode, useId, useState } from "react";
import { Icon } from "@/shared/ui";
import { scorePassword } from "@/features/auth/model/auth";

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

  // Solved against the card, not the canvas — the meter sits on --surface-1.
  const TONES = ["var(--danger)", "var(--danger)", "var(--warning)", "var(--success)", "var(--success)"];

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[12px] font-medium cursor-pointer" style={{ color: "var(--text-muted)" }}>
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
          className="w-full rounded-[10px] ps-4 pe-12 outline-none text-[15px]"
          style={{
            height: 46,
            background: "var(--surface-2)",
            border: 0,
            color: "var(--text)",
            boxShadow: error
              ? "inset 0 0 0 1px var(--danger)"
              : "inset 0 0 0 1px var(--hairline-strong)",
          }}
        />
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          // The label says what the button does next, not what state the field
          // is in — "Show password" is an instruction, "Password hidden" is a
          // status, and a button should read as the former.
          aria-label={shown ? "Hide password" : "Show password"}
          title={shown ? "Hide password" : "Show password"}
          className="mk-icon-btn absolute top-1/2 end-2 -translate-y-1/2 cursor-pointer"
          style={{ color: "var(--text-muted)" }}
        >
          <Icon name={shown ? "eye-slash" : "eye"} size={15} />
        </button>
      </div>

      {rating && (
        <div id={meterId} className="flex flex-col gap-1.5 mt-0.5">
          <div className="flex items-center gap-1.5">
            <div className="flex-1 flex gap-1" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="flex-1 h-[3px] rounded-full transition-colors"
                  style={{
                    background: i < rating.score ? TONES[rating.score] : "var(--surface-3)",
                  }}
                />
              ))}
            </div>
            <span className="text-[11px] font-semibold shrink-0" style={{ color: TONES[rating.score] }}>
              {rating.label}
            </span>
          </div>
          {rating.advice && (
            <span className="text-[11.5px] leading-[1.45]" style={{ color: "var(--text-faint)" }}>
              {rating.advice}
            </span>
          )}
        </div>
      )}

      {note && (
        <span
          id={noteId}
          role={error ? "alert" : undefined}
          className="text-[12px]"
          style={{ color: error ? "var(--danger)" : "var(--text-faint)" }}
        >
          {note}
        </span>
      )}
    </div>
  );
}
