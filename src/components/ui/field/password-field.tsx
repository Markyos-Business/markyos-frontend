"use client";

import { useId, useState } from "react";
import type { KeyboardEvent } from "react";
import { scorePassword, type Strength } from "@/lib/passwordStrength";
import { IconButton } from "../button/icon-button";
import { useUiStrings } from "../ui-strings";
import { InputField, type InputFieldProps } from "./input-field";

type PasswordStrings = {
  show?: string;
  hide?: string;
  capsLock?: string;
  levels?: string[];
  labels?: { tooCommon: string; tooSimple: string };
  advice?: Record<NonNullable<Strength["advice"]>, string>;
};

type PasswordFieldProps = Omit<InputFieldProps, "type" | "action" | "strings"> & {
  /** Draw the strength meter. Only for a password being *chosen*. */
  strength?: boolean;
  strings?: PasswordStrings & InputFieldProps["strings"];
};

// Solved against the card, not the canvas: the meter sits on surface-1.
const BAR = ["bg-danger-fill", "bg-danger-fill", "bg-warning", "bg-success", "bg-success"];
const INK = ["text-danger", "text-danger", "text-warning", "text-success", "text-success"];

/**
 * A password with an eye, a caps-lock warning, and — when one is being chosen —
 * a strength meter.
 *
 * Reveal is not a nicety. Typing a long password blind on a phone keyboard is
 * where people give up and pick something short, so hiding the reveal makes
 * passwords worse, not safer. It starts hidden, and the button says which way
 * it is about to go. The meter is off by default: telling someone their
 * existing password is "weak" while they are trying to sign in is criticism
 * they can do nothing about. Works with `register`.
 */
const PasswordField = ({ strength = false, strings, warning, onKeyDown, onKeyUp, onBlur, ...rest }: PasswordFieldProps) => {
  const { t } = useUiStrings();
  const meterId = `${useId()}-meter`;
  const [shown, setShown] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [typed, setTyped] = useState("");
  const text = typeof rest.value === "string" ? rest.value : typed;
  const rating = strength && text ? scorePassword(text) : null;
  const levels = strings?.levels ?? t.strength;
  const labels = strings?.labels ?? t.strengthLabels;
  const advice = strings?.advice ?? t.strengthAdvice;
  const readCaps = (e: KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState?.("CapsLock") ?? false);

  return (
    <InputField
      autoComplete={strength ? "new-password" : "current-password"}
      {...rest}
      type={shown ? "text" : "password"}
      // Caps lock is a warning, and only while typing here.
      warning={warning ?? (capsLock ? (strings?.capsLock ?? t.capsLockOn) : undefined)}
      aria-describedby={[rest["aria-describedby"], rating ? meterId : null].filter(Boolean).join(" ") || undefined}
      strings={strings}
      onKeyDown={(e) => {
        readCaps(e);
        onKeyDown?.(e);
      }}
      onKeyUp={(e) => {
        readCaps(e);
        onKeyUp?.(e);
      }}
      onBlur={(e) => {
        setCapsLock(false);
        onBlur?.(e);
      }}
      onChange={(e) => {
        setTyped(e.target.value);
        rest.onChange?.(e);
      }}
      action={
        <IconButton
          onClick={() => setShown((v) => !v)}
          // What the button does next, not the field's state: an instruction, not a status.
          label={shown ? (strings?.hide ?? t.hidePassword) : (strings?.show ?? t.showPassword)}
          icon={shown ? "eye-slash" : "eye"}
          disabled={rest.disabled}
          className="-me-space-2 text-text-muted"
        />
      }
      below={
        rating && (
          <div id={meterId} className="flex flex-col gap-space-1 px-space-5">
            <div className="flex items-center gap-space-3">
              <div className="flex flex-1 gap-space-1" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={`h-0.75 flex-1 rounded-sm transition-colors duration-base ${i < rating.score ? BAR[rating.score] : "bg-surface-3"}`} />
                ))}
              </div>
              <span className={`shrink-0 text-caption font-medium ${INK[rating.score]}`}>
                {rating.label ? labels[rating.label] : levels[rating.score]}
              </span>
            </div>
            {rating.advice && <span className="text-caption text-text-faint">{advice[rating.advice]}</span>}
          </div>
        )
      }
    />
  );
};

/** PasswordInput, by the UI library's name. */
const PasswordInput = PasswordField;

export { PasswordField, PasswordInput };
export type { PasswordFieldProps, PasswordStrings };
