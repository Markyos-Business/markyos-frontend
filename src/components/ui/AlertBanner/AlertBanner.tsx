"use client";

import { ReactNode } from "react";

/**
 * A message about a whole form, as opposed to one field.
 *
 * "That email and password don't match an account" belongs to the pair, not
 * to either box, so putting it under one of them blames the wrong field.
 * `role="alert"` so it is announced the moment it appears: a submit that
 * silently fails is the most disorienting thing a form can do. Renders
 * nothing when there is no message, so a form can always include it.
 */
export function AlertBanner({ message, className = "" }: { message?: ReactNode; className?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={`rounded-[10px] bg-danger/12 px-3.5 py-3 text-[12.5px] leading-[1.5] text-danger ring-1 ring-inset ring-danger/35 ${className}`}
    >
      {message}
    </div>
  );
}
