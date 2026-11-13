"use client";

import { useEffect, useRef, useState } from "react";
import { useUiStrings } from "../../ui/i18n/uiStrings";
import { InputField, type InputFieldProps } from "../fields/InputField";

/**
 * A slug from any text: lowercase Latin letters, digits and single dashes.
 * Accents are dropped (é → e); anything else, Arabic included, becomes a
 * dash, so an Arabic name needs a Latin slug typed for it. `typing` keeps a
 * trailing dash so the next word can follow it.
 */
function toSlug(input: string, typing = false): string {
  const slug = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, 60);
  return typing ? slug.replace(/-{2,}/g, "-") : slug.replace(/-+$/g, "");
}

type SlugFieldProps = Omit<InputFieldProps, "value" | "defaultValue" | "onChange" | "prefix"> & {
  value: string;
  onChange: (slug: string) => void;
  /** Fixed before the slug, e.g. "markyos.com/". */
  base?: string;
  /** Text to make the slug from (a name) until the person types their own. */
  from?: string;
  /** Resolves true when the slug is free. Asked once typing pauses. */
  checkAvailability?: (slug: string) => Promise<boolean>;
  debounceMs?: number;
  strings?: InputFieldProps["strings"] & { available?: string; taken?: string };
};

/**
 * The address part of a link: "markyos.com/" fixed, then the slug, made as
 * you type. It follows `from` until edited by hand, and checks availability
 * after a pause; only the latest answer counts. Controlled.
 */
const SlugField = ({ value, onChange, base, from, checkAvailability, debounceMs = 400, strings, error, success, onBlur, ...rest }: SlugFieldProps) => {
  const { t } = useUiStrings();
  const [edited, setEdited] = useState(false);
  // The latest answer, for the slug it was about; an older slug's answer is
  // ignored, so the status shown is always for what's in the field.
  const [answer, setAnswer] = useState<{ slug: string; free: boolean } | null>(null);
  const latest = useRef(0);
  const slug = toSlug(value);
  const status = !checkAvailability || !slug ? "idle" : answer?.slug !== slug ? "checking" : answer.free ? "available" : "taken";

  // Until it's edited by hand, the slug follows the name it's made from.
  useEffect(() => {
    if (from !== undefined && !edited) {
      const next = toSlug(from);
      if (next !== value) onChange(next);
    }
    // `onChange` and `value` are read, not watched: only the name drives this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, edited]);

  useEffect(() => {
    if (!checkAvailability || !slug) return;
    const ask = ++latest.current;
    const timer = window.setTimeout(() => {
      checkAvailability(slug)
        .then((free) => ask === latest.current && setAnswer({ slug, free }))
        // A failed check says nothing either way; the field simply stops checking.
        .catch(() => ask === latest.current && setAnswer({ slug, free: true }));
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [slug, checkAvailability, debounceMs]);

  return (
    <InputField
      spellCheck={false}
      autoComplete="off"
      dir="ltr"
      boxDir="ltr"
      {...rest}
      value={value}
      prefix={base && <span className="text-text-muted">{base}</span>}
      validating={status === "checking"}
      error={error ?? (status === "taken" ? (strings?.taken ?? t.slugTaken) : undefined)}
      success={success ?? (status === "available" ? (strings?.available ?? t.slugAvailable) : undefined)}
      strings={strings}
      onChange={(e) => {
        setEdited(true);
        onChange(toSlug(e.target.value, true));
      }}
      onBlur={(e) => {
        const tidy = toSlug(value);
        if (tidy !== value) onChange(tidy);
        onBlur?.(e);
      }}
    />
  );
};

/** SlugInput, by the UI library's name. */
const SlugInput = SlugField;

export { SlugField, SlugInput, toSlug };
export type { SlugFieldProps };
