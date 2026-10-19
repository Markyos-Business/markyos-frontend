"use client";

import { InputHTMLAttributes, ReactNode, useId } from "react";

interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "size"> {
  label?: string;
  labelRight?: ReactNode;
  error?: string;
  hint?: string;
  size?: "sm" | "lg";
}

/**
 * The label used to be a `<span>` floating above the input, associated with it
 * by nothing but proximity. Three things were broken by that, and only one of
 * them was an accessibility problem:
 *
 *  - Clicking the word "Email" didn't focus the email box. Every other form on
 *    the web does, so people click and nothing happens.
 *  - A screen reader read the box as unlabelled, or read the placeholder, which
 *    disappears the moment you type — the one time you most need to know what
 *    you're in the middle of typing.
 *  - The error was a sibling `<span>`. The field announced itself as invalid
 *    with no way to reach the sentence explaining why.
 *
 * `htmlFor`/`id` fixes the first two, `aria-describedby` the third. `useId`
 * rather than a counter because the id has to survive server render and match
 * on the client.
 */
export function TextField({
  label,
  labelRight,
  error,
  hint,
  size = "sm",
  ...inputProps
}: TextFieldProps) {
  const reactId = useId();
  const id = inputProps.id ?? `tf-${reactId}`;
  const noteId = `${id}-note`;
  const height = size === "lg" ? 52 : 46;
  const note = error ?? hint;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {(label || labelRight) && (
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={id}
              className="text-[12px] font-medium cursor-pointer"
              style={{ color: "var(--text-muted)" }}
            >
              {label}
            </label>
          )}
          {labelRight}
        </div>
      )}
      <input
        {...inputProps}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        className="w-full rounded-[10px] px-4 outline-none text-[15px]"
        style={{
          height,
          background: "var(--surface-2)",
          border: 0,
          color: "var(--text)",
          boxShadow: error
            ? "inset 0 0 0 1px var(--danger)"
            : "inset 0 0 0 1px var(--hairline-strong)",
        }}
      />
      {note && (
        <span
          id={noteId}
          // Errors are announced the moment they appear. A hint is not: it is
          // there before you start and repeating it would talk over the field.
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
