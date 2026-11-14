"use client";

import { useImperativeHandle, useState } from "react";
import type { FocusEvent, KeyboardEvent, Ref } from "react";
import { useRadioNavigation } from "../choice/use-radio-navigation";
import { Icon } from "../icon";
import { useUiStrings } from "../ui-strings";
import { Field, type FieldSize, type FieldState } from "./field";

type RatingProps = FieldState & {
  label?: string;
  /** 0 for none, up to `max`; halves with `allowHalf`. Controlled with `onChange`. */
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** When focus leaves the stars. */
  onBlur?: () => void;
  /** Submitted with a native form. */
  name?: string;
  /** Stars. Default 5. */
  max?: number;
  /** Half-star steps: 0.5, 1, 1.5… */
  allowHalf?: boolean;
  /** Offer "Clear rating" once there is one; Delete and Backspace clear it too. */
  clearable?: boolean;
  size?: FieldSize;
  className?: string;
  /** `focus()` moves to the chosen star: what `Controller` calls on an error. */
  ref?: Ref<{ focus: () => void }>;
  labels?: { ratingOf?: (n: number, max: number) => string; clearRating?: string; noRating?: string };
};

const STAR = { md: 22, sm: 18 } as const;

/**
 * A score in stars: rating a delivered asset, a review.
 *
 * Choosing is a radio group: one Tab stop, the arrow keys move the score
 * (mirrored in Arabic: the reading-forward arrow goes up), Home and End go
 * to the ends, and each star is named "4 of 5" (halves "3.5 of 5"). With
 * `allowHalf` each star is two targets, its start half and its end half.
 * Hovering previews the score. Read-only (or locked) it's an image named by
 * its score. Filled stars are solid and the accent, empty ones outlined, so
 * the score never rests on colour alone.
 */
const Rating = ({
  label,
  value,
  defaultValue = 0,
  onChange,
  onBlur,
  name,
  max = 5,
  allowHalf = false,
  clearable = false,
  size = "md",
  className = "",
  ref,
  labels,
  ...state
}: RatingProps) => {
  const { t } = useUiStrings();
  const [own, setOwn] = useState(defaultValue);
  const [hovered, setHovered] = useState<number | null>(null);
  const score = value ?? own;
  const of = labels?.ratingOf ?? t.ratingOf;
  const disabled = Boolean(state.disabled);
  const step = allowHalf ? 0.5 : 1;
  const steps = Array.from({ length: max / step }, (_, i) => String((i + 1) * step));

  const set = (next: number) => {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  const { group, radioProps } = useRadioNavigation({
    items: steps.map((v) => ({ value: v, disabled })),
    value: score ? String(score) : null,
    onChange: (v) => set(Number(v)),
  });
  useImperativeHandle(ref, () => ({ focus: () => group.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus() }), [group]);

  const shown = hovered ?? score;
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  const px = STAR[size];

  /** One star filled to `fill` (0, 0.5 or 1); a half fills from the reading start. */
  const star = (fill: number) => (
    <>
      <Icon name="star" size={px} className={fill === 1 ? "invisible" : "text-text-muted"} />
      {fill > 0 && (
        <span aria-hidden className={`absolute inset-0 grid place-items-center text-accent ${fill < 1 ? "[clip-path:inset(0_50%_0_0)] rtl:[clip-path:inset(0_0_0_50%)]" : ""}`}>
          <Icon name="star-solid" size={px} />
        </span>
      )}
    </>
  );
  const fillOf = (n: number) => Math.min(1, Math.max(0, shown - (n - 1)));

  const onKeyDown = (e: KeyboardEvent<HTMLElement>, own: (e: KeyboardEvent<HTMLElement>) => void) => {
    if (clearable && (e.key === "Delete" || e.key === "Backspace")) {
      e.preventDefault();
      set(0);
      return;
    }
    own(e);
  };

  return (
    <Field label={label} size={size} className={className} bare {...state}>
      {(control) =>
        control.readOnly ? (
          <span id={control.id} role="img" aria-label={`${label ? `${label}: ` : ""}${score ? of(score, max) : (labels?.noRating ?? t.noRating)}`} aria-describedby={control["aria-describedby"]} className="inline-flex gap-0.5 px-space-5">
            {stars.map((n) => (
              <span key={n} className="relative grid place-items-center">
                {star(Math.min(1, Math.max(0, score - (n - 1))))}
              </span>
            ))}
          </span>
        ) : (
          <div className="flex flex-wrap items-center gap-space-4 px-space-4">
            <div
              ref={group}
              id={control.id}
              role="radiogroup"
              aria-labelledby={label ? `${control.id}-label` : undefined}
              aria-label={label ? undefined : (labels?.ratingOf ?? t.ratingOf)(score, max)}
              aria-describedby={control["aria-describedby"]}
              aria-invalid={control["aria-invalid"]}
              aria-required={control["aria-required"]}
              aria-disabled={disabled || undefined}
              className="inline-flex"
              onMouseLeave={() => setHovered(null)}
              onBlur={(e: FocusEvent<HTMLDivElement>) => {
                if (!e.currentTarget.contains(e.relatedTarget)) onBlur?.();
              }}
            >
              {stars.map((n) => {
                const targets = allowHalf ? [n - 0.5, n] : [n];
                return (
                  <span key={n} className="relative grid size-8 place-items-center">
                    {star(fillOf(n))}
                    {targets.map((v, i) => {
                      const radio = radioProps({ value: String(v), disabled });
                      const position = allowHalf ? `absolute inset-y-0 w-1/2 ${i === 0 ? "start-0 rounded-s-md" : "end-0 rounded-e-md"}` : "absolute inset-0 rounded-md";
                      return (
                        <button
                          key={v}
                          type="button"
                          {...radio}
                          onKeyDown={(e) => onKeyDown(e, radio.onKeyDown)}
                          aria-label={of(v, max)}
                          disabled={disabled}
                          onClick={() => set(v)}
                          onMouseEnter={() => !disabled && setHovered(v)}
                          className={`${position} cursor-pointer outline-none transition-colors duration-fast hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:cursor-not-allowed disabled:hover:bg-transparent motion-reduce:transition-none`}
                        />
                      );
                    })}
                  </span>
                );
              })}
            </div>
            {clearable && score > 0 && !disabled && (
              <button type="button" onClick={() => set(0)} className="mk-tap text-caption font-medium text-text-muted hover:text-text">
                {labels?.clearRating ?? t.clearRating}
              </button>
            )}
            {name && <input type="hidden" name={name} value={score || ""} />}
          </div>
        )
      }
    </Field>
  );
};

export { Rating };
export type { RatingProps };
