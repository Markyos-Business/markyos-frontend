"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DURATION } from "@/lib/motion";

type AlertBannerProps = {
  /** Nothing shows while this is empty, so a form can always include it. */
  message?: ReactNode;
  className?: string;
};

/**
 * A form's or a page's error, in the danger tint. It opens to its own height
 * and fades in when a message arrives, and closes the same way when it's
 * cleared, so the content below slides rather than jumps. It is announced the
 * moment it appears.
 */
const AlertBanner = ({ message, className = "" }: AlertBannerProps) => {
  // The last message stays readable while the banner closes over it.
  const [shown, setShown] = useState(message);
  if (message && message !== shown) setShown(message);
  const open = Boolean(message);
  // Once closed, it lets go of the message and leaves the layout entirely,
  // so an empty banner never adds a gap to the form around it.
  useEffect(() => {
    if (open || !shown) return;
    const t = window.setTimeout(() => setShown(undefined), DURATION.base);
    return () => window.clearTimeout(t);
  }, [open, shown]);
  if (!open && !shown) return null;
  return (
    <div className="mk-collapse" data-open={open} aria-hidden={!open}>
      <div>
        {shown && (
          <div
            role={open ? "alert" : undefined}
            className={`rounded-lg bg-danger-soft px-space-6 py-space-5 text-body text-danger shadow-edge-danger ${className}`}
          >
            {shown}
          </div>
        )}
      </div>
    </div>
  );
};

export { AlertBanner };
export type { AlertBannerProps };
