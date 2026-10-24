"use client";

import type { ReactNode } from "react";

type AlertBannerProps = {
  /** Nothing renders while this is empty, so a form can always include it. */
  message?: ReactNode;
  className?: string;
};

/**
 * A message about a whole form, as opposed to one field.
 *
 * "That email and password don't match an account" belongs to the pair, not
 * to either box, so putting it under one of them blames the wrong field.
 * `role="alert"` so it is announced the moment it appears: a submit that
 * silently fails is the most disorienting thing a form can do.
 */
const AlertBanner = ({ message, className = "" }: AlertBannerProps) => {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={`rounded-lg bg-danger-soft px-space-6 py-space-5 text-body text-danger shadow-edge-danger ${className}`}
    >
      {message}
    </div>
  );
};

export { AlertBanner };
export type { AlertBannerProps };
