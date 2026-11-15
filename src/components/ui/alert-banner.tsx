"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DURATION } from "@/lib/motion";
import { Icon } from "./icon";

type AlertTone = "danger" | "success" | "warning" | "info";

type AlertBannerProps = {
  /** Nothing shows while this is empty, so a form can always include it. */
  message?: ReactNode;
  /** Default danger: a form's or a page's error. */
  tone?: AlertTone;
  /** A bold first line, e.g. "Couldn't save". */
  title?: string;
  /** A button at the end: Retry, Reload. */
  action?: ReactNode;
  className?: string;
};

// Danger and success keep their tinted text (it passes on its own tint); the
// warning and info tints carry body text in the normal ink, with the tone in
// the icon, since their light tints are too pale for coloured words.
const TONES: Record<AlertTone, { box: string; icon: string; iconInk: string }> = {
  danger: { box: "bg-danger-soft text-danger shadow-edge-danger", icon: "exclamation-circle", iconInk: "" },
  success: { box: "bg-success-soft text-success shadow-edge-success", icon: "check-circle", iconInk: "" },
  warning: { box: "bg-warning-soft text-text shadow-edge", icon: "exclamation-circle", iconInk: "text-warning" },
  info: { box: "bg-info-soft text-text shadow-edge", icon: "info-circle", iconInk: "text-info" },
};

/**
 * A form's or a page's error, in the danger tint. It opens to its own height
 * and fades in when a message arrives, and closes the same way when it's
 * cleared, so the content below slides rather than jumps. It is announced the
 * moment it appears.
 */
const AlertBanner = ({ message, tone = "danger", title, action, className = "" }: AlertBannerProps) => {
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
            // Errors and warnings interrupt; good news and notes wait their turn.
            role={open ? (tone === "danger" || tone === "warning" ? "alert" : "status") : undefined}
            className={`rounded-lg px-space-6 py-space-5 text-body ${TONES[tone].box} ${title || action || tone !== "danger" ? "flex items-start gap-space-4" : ""} ${className}`}
          >
            {title || action || tone !== "danger" ? (
              <>
                <Icon name={TONES[tone].icon} size={18} className={`mt-0.5 shrink-0 ${TONES[tone].iconInk}`} />
                <div className="flex min-w-0 flex-1 flex-col gap-space-1">
                  {title && <strong className="font-medium">{title}</strong>}
                  <div>{shown}</div>
                </div>
                {action && <div className="shrink-0">{action}</div>}
              </>
            ) : (
              shown
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export { AlertBanner };
export type { AlertBannerProps, AlertTone };
