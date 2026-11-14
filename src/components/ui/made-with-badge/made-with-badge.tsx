"use client";

import { useEffect, useId, useRef, useState } from "react";
import { variants } from "@/lib/motion";
import { MarkyosLogo } from "../brand/markyos-logo";
import { Button } from "../button/button";
import { UiStringsProvider, useUiStrings } from "../ui-strings";
import { deviceOf, type BadgeDevice, type BadgeEventName, type BadgePageType } from "./badge-events";

type MadeWithBadgeProps = {
  /** The language the visitor is reading the page in. */
  locale: "ar" | "en";
  pageType: BadgePageType;
  /** light or dark pill; auto follows the page. Default auto. */
  theme?: "light" | "dark" | "auto";
  signupUrl: string;
  websiteUrl: string;
  /** Each funnel action, once: viewed (first in view), clicked, signup clicked, learn more clicked. */
  onEvent?: (name: BadgeEventName, context: { theme: "light" | "dark"; device: BadgeDevice }) => void;
  /** Height of the page's own fixed bottom bar, to sit 8px above it. */
  bottomOffset?: number;
};

/** The theme the pill is actually drawn in. */
function resolvedTheme(theme: MadeWithBadgeProps["theme"], el: Element | null): "light" | "dark" {
  if (theme === "light" || theme === "dark") return theme;
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return el && getComputedStyle(el).colorScheme.includes("dark") ? "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const Badge = ({ locale, pageType, theme = "auto", signupUrl, websiteUrl, onEvent, bottomOffset = 0 }: MadeWithBadgeProps) => {
  const { t } = useUiStrings();
  const s = t.madeWith;
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const copyId = useId();
  const sent = useRef(new Set<BadgeEventName>());

  const fire = (name: BadgeEventName, once = true) => {
    if (once && sent.current.has(name)) return;
    sent.current.add(name);
    onEvent?.(name, { theme: resolvedTheme(theme, button.current), device: deviceOf(window.innerWidth) });
  };
  const fireRef = useRef(fire);
  useEffect(() => {
    fireRef.current = fire;
  });

  // Viewed: the first time the badge is actually on screen.
  useEffect(() => {
    const el = button.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        fireRef.current("badge_viewed");
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Open: focus moves in; Esc closes and comes back; a press outside closes.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>("a")?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!panel.current?.contains(target) && !button.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  // A fixed version (theme="light" | "dark") takes that theme's tokens, whatever the page's.
  const forced = theme === "light" ? "mk-theme-light" : theme === "dark" ? "mk-theme-dark" : "";

  return (
    // Its own language and direction: the badge reads like the page around it,
    // bottom-right in English and bottom-left in Arabic (inset-inline-end).
    // Not printed: printed and PDF pages don't carry the badge.
    <div lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={`print:hidden ${forced}`} style={{ ["--mk-badge-offset" as string]: `${bottomOffset}px` }}>
      {open && (
        <div
          ref={panel}
          role="dialog"
          aria-modal="false"
          aria-labelledby={copyId}
          className={`fixed inset-x-3 bottom-[calc(var(--mk-badge-offset)+48px)] z-sticky flex flex-col gap-space-4 rounded-card bg-surface-1 p-space-6 text-text shadow-edge-pop sm:inset-x-auto sm:end-4 sm:bottom-[calc(var(--mk-badge-offset)+56px)] sm:w-[280px] motion-reduce:animate-none ${variants.fadeUp.enter}`}
        >
          <p id={copyId} className="text-body font-medium">
            {s.invite[pageType]}
          </p>
          <Button asChild variant="primary" size="sm" block>
            <a href={signupUrl} target="_blank" rel="noopener" onClick={() => fire("badge_signup_clicked")}>
              {s.startFree}
            </a>
          </Button>
          <a href={websiteUrl} target="_blank" rel="noopener" onClick={() => fire("badge_learn_more_clicked")} className="self-center text-caption text-accent underline-offset-2 hover:underline">
            {s.learnMore}
          </a>
        </div>
      )}
      <button
        ref={button}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={s.open}
        onClick={() => {
          if (!open) fire("badge_clicked");
          setOpen(!open);
        }}
        // A 40px touch target around a 32px pill (28px on a phone), the pill 16px (12px) from the edges.
        className="fixed bottom-[calc(var(--mk-badge-offset)+12px)] end-4 z-sticky flex min-h-10 items-center rounded-full max-sm:bottom-[calc(var(--mk-badge-offset)+6px)] max-sm:end-3"
      >
        <span className="flex h-8 items-center gap-2 rounded-full bg-surface-1 px-space-4 text-caption font-medium text-text shadow-edge-pop transition-colors duration-fast motion-reduce:transition-none max-sm:h-7 max-sm:px-space-3">
          <MarkyosLogo variant="mark" hideBeta className="size-4" />
          <span className="whitespace-nowrap">{s.badge}</span>
        </span>
      </button>
    </div>
  );
};

/**
 * "Made with Markyos": the small pill free public pages carry, bottom
 * inline-end, and the invitation it opens ("Make your own form with Markyos,
 * free." · Start free · Learn about Markyos). Quiet: no load animation, no
 * pulse, no way to dismiss. A real button (aria-haspopup, aria-expanded,
 * "Made with Markyos. Open details"); the popover is non-modal, takes focus
 * on open and gives it back on Esc or a second tap; it sits above the badge,
 * 280px wide, and becomes a full-width card on a phone.
 *
 * Whether a page shows it is never decided here: the server leaves it out of
 * a paid page altogether (PublicPageShell).
 */
const MadeWithBadge = (props: MadeWithBadgeProps) => (
  <UiStringsProvider lang={props.locale}>
    <Badge {...props} />
  </UiStringsProvider>
);

export { MadeWithBadge };
export type { MadeWithBadgeProps };
