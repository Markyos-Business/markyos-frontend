"use client";

import { Icon } from "@/components/ui";
import { VIEWPORT_WIDTH } from "@/lib/doc/core/types";
import { secondaryViewNotice } from "@/lib/doc/core/rules";
import type { Breakpoint, Lang } from "./viewTypes";
import type { ViewContext } from "@/lib/doc/core/types";

/**
 * Which view the canvas is showing: a width and a language.
 *
 * These belong together in one control because they are the same kind of thing.
 * A guideline page is one document rendered four or six different ways, and
 * only one of those ways — the widest, in the brand's own language — is where
 * its structure is decided. Splitting the two into separate controls in
 * separate corners would hide that, and the rule only makes sense if you can
 * see which view you are in.
 */

const WIDTHS: Array<{ key: Breakpoint; icon: string; label: string; arLabel: string }> = [
  { key: "desktop", icon: "desktop", label: "Desktop", arLabel: "سطح المكتب" },
  { key: "tablet", icon: "tablet", label: "Tablet", arLabel: "لوحي" },
  { key: "phone", icon: "mobile", label: "Phone", arLabel: "هاتف" },
];

export function ViewSwitcher({
  breakpoint,
  onBreakpoint,
  lang,
  onLang,
  isAr,
}: {
  breakpoint: Breakpoint;
  onBreakpoint: (bp: Breakpoint) => void;
  lang: Lang;
  onLang: (lang: Lang) => void;
  isAr: boolean;
}) {
  return (
    // Named because the rendered page inside the canvas has a language toggle
    // of its own, with the same accessible name — it is the *client's* control
    // for the published site, and this is the studio's control for the editor.
    // Both are correct; only a selector needs help telling them apart.
    <div data-view-switcher className="flex items-center gap-1.5 shrink-0">
      <div
        className="flex rounded-full p-0.5"
        role="radiogroup"
        aria-label={isAr ? "عرض الشاشة" : "Canvas width"}
        style={{ background: "var(--surface-1)" }}
      >
        {WIDTHS.map((w) => {
          const active = breakpoint === w.key;
          const label = isAr ? w.arLabel : w.label;
          return (
            <button
              key={w.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onBreakpoint(w.key)}
              // The pixel width is in the title rather than the label: it is
              // the answer to "which one is this?" and nothing else, and three
              // numbers across the top bar is noise the rest of the time.
              title={`${label} — ${VIEWPORT_WIDTH[w.key]}px`}
              aria-label={label}
              className="h-7 px-2.5 rounded-full grid place-items-center cursor-pointer"
              style={{
                background: active ? "var(--surface-2)" : "transparent",
                color: active ? "var(--text)" : "var(--text-faint)",
              }}
            >
              <Icon name={w.icon} size={13} />
            </button>
          );
        })}
      </div>

      <div
        className="flex rounded-full p-0.5"
        role="radiogroup"
        aria-label={isAr ? "لغة المعاينة" : "Preview language"}
        // Scoped the same way `LangToggle` is. This screen carries three EN/ع
        // pills — the interface language, this one, and the one belonging to
        // the page inside the canvas — and the name they are selected by is
        // translated, so it cannot be a selector.
        data-lang-toggle="preview"
        style={{ background: "var(--surface-1)" }}
      >
        {(["en", "ar"] as const).map((l) => {
          const active = lang === l;
          const name = isAr
            ? `لغة المعاينة — ${l === "en" ? "الإنجليزية" : "العربية"}`
            : `Preview language — ${l === "en" ? "English" : "العربية"}`;
          return (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onLang(l)}
              // Says which of the three pills this is, for everyone who cannot
              // hear the radiogroup's name.
              aria-label={name}
              title={name}
              className="h-7 px-3 rounded-full text-[11px] font-semibold cursor-pointer"
              style={{
                background: active ? "var(--surface-2)" : "transparent",
                color: active ? "var(--text)" : "var(--text-faint)",
              }}
            >
              {l === "en" ? "EN" : "ع"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The quiet line above the canvas when the current view cannot restructure.
 *
 * It names the view that can. A restriction with no route out of it reads as
 * a bug — people click the greyed-out control twice and then go looking for
 * the setting that turned it off.
 */
export function SecondaryViewBanner({ ctx, isAr }: { ctx: ViewContext; isAr: boolean }) {
  const notice = secondaryViewNotice(ctx, isAr);
  if (!notice) return null;
  return (
    <div
      className="flex items-start gap-2 px-3 py-2 rounded-lg text-[11.5px] leading-[1.45] animate-fade-in"
      style={{ background: "var(--surface-1)", color: "var(--text-muted)" }}
    >
      <Icon name="info-circle" size={13} style={{ color: "var(--text-faint)", flexShrink: 0, marginTop: 1 }} />
      <span dir="auto" className="bidi-auto">
        <strong style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{notice.title}</strong>
        {" — "}
        {notice.body}
      </span>
    </div>
  );
}
