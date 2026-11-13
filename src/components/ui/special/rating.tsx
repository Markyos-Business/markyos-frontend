"use client";

import { useId } from "react";
import { useRadioNavigation } from "../choice/use-radio-navigation";
import { Icon } from "../icon";
import { labelClasses } from "../field/input-field";
import { useUiStrings } from "../ui-strings";

type RatingProps = {
  label: string;
  /** 1 to `max`, or 0 for none. */
  value: number;
  onChange?: (value: number) => void;
  /** Stars. Default 5. */
  max?: number;
  /** Show the stars only, not choose them (an average, a review). */
  readOnly?: boolean;
  /** Offer "Clear rating" once one is chosen. */
  clearable?: boolean;
  disabled?: boolean;
  strings?: { stars?: (n: number) => string; clearRating?: string };
};

/**
 * A score out of five stars. Choosing is a radio group: one Tab stop, the
 * arrow keys move the score (mirrored in Arabic), each star named "3 stars".
 * Read-only, it's an image of the score with that score as its name. The
 * filled stars are the accent; the rest stay muted, and the state is read,
 * never shown by colour alone.
 */
const Rating = ({ label, value, onChange, max = 5, readOnly = false, clearable = false, disabled = false, strings }: RatingProps) => {
  const { t } = useUiStrings();
  const id = useId();
  const name = strings?.stars ?? t.stars;
  const scores = Array.from({ length: max }, (_, i) => String(i + 1));
  const { group, radioProps } = useRadioNavigation({
    items: scores.map((v) => ({ value: v, disabled })),
    value: value ? String(value) : null,
    onChange: (v) => onChange?.(Number(v)),
  });

  if (readOnly) {
    return (
      <span className="inline-flex flex-col gap-space-1">
        <span className={labelClasses}>{label}</span>
        <span role="img" aria-label={`${label}: ${name(value)} / ${max}`} className="inline-flex gap-0.5 px-space-5">
          {scores.map((v) => (
            <Icon key={v} name="star" size={18} className={Number(v) <= value ? "text-accent" : "text-text-disabled"} />
          ))}
        </span>
      </span>
    );
  }

  return (
    <div className="inline-flex flex-col gap-space-1">
      <span id={`${id}-label`} className={labelClasses}>
        {label}
      </span>
      <div className="flex items-center gap-space-4 px-space-5">
        <div ref={group} role="radiogroup" aria-labelledby={`${id}-label`} className="inline-flex gap-0.5">
          {scores.map((v) => (
            <button
              key={v}
              type="button"
              {...radioProps({ value: v, disabled })}
              aria-label={name(Number(v))}
              disabled={disabled}
              onClick={() => onChange?.(Number(v))}
              className={`grid size-8 place-items-center rounded-md transition-colors hover:bg-ink-soft disabled:cursor-not-allowed ${Number(v) <= value ? "text-accent" : "text-text-disabled"}`}
            >
              <Icon name="star" size={22} />
            </button>
          ))}
        </div>
        {clearable && value > 0 && !disabled && (
          <button type="button" onClick={() => onChange?.(0)} className="text-caption font-medium text-text-muted hover:text-text">
            {strings?.clearRating ?? t.clearRating}
          </button>
        )}
      </div>
    </div>
  );
};

export { Rating };
export type { RatingProps };
