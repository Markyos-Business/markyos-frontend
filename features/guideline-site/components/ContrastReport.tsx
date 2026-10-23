"use client";

import { Icon } from "@/shared/ui";
import { getBrandTheme } from "@/features/guideline-site/model/theme";
import { bestInkOn, checkContrast, ContrastResult, formatRatio, LEVEL_COLOR, LEVEL_LABEL, levelOf } from "@/shared/lib/contrast";
import { SlotKind, Workspace } from "@/core/data/types";

/**
 * How legible the guideline site is in the brand's own colours.
 *
 * Checks what the site will actually render, not the palette in the abstract:
 * the ground the site resolves to, the text colours drawn on it, and the
 * accent where it carries meaning. A swatch that never touches text isn't
 * flagged, because a warning nobody needs to act on trains people to ignore
 * the ones they do.
 */

interface Row {
  label: string;
  hint?: string;
  fg: string;
  bg: string;
  /** Large-text rules apply — headings and display numbers, not body copy. */
  large?: boolean;
}

function Badge({ result, large }: { result: ContrastResult; large?: boolean }) {
  // A heading only has to clear 3:1, so judging it against the body-text bar
  // would report a failure that isn't one.
  const level = large
    ? result.aaLarge
      ? result.aa
        ? "aaa"
        : "aa"
      : "fail"
    : levelOf(result);
  return (
    <span className="flex items-center gap-2 shrink-0">
      <span
        className="text-[11px] tabular-nums"
        style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-muted)" }}
      >
        {formatRatio(result.ratio)}
      </span>
      <span
        className="text-[10px] font-semibold px-2 py-[3px] rounded-full whitespace-nowrap"
        style={{ background: "var(--surface-2)", color: LEVEL_COLOR[level] }}
      >
        {large && level !== "fail" ? "AA large" : LEVEL_LABEL[level]}
      </span>
    </span>
  );
}

/*
 * Rows wrap; they never truncate.
 *
 * This report lives in the builder's tools panel, which is ~206px wide. With a
 * swatch, a fixed-width badge and two gaps taken out of that, a truncating
 * label had 32px left and rendered "Body text on the site ground" as "Bo…" —
 * every row in the panel reduced to two characters and a ratio, with no title
 * to recover the rest from. A contrast report that cannot be read is worse than
 * no contrast report, because it still occupies the space where one would go.
 *
 * So the label wraps, and `flex-wrap` plus a minimum on the label column sends
 * the badge to its own line when the panel is too narrow to hold both. Wide
 * call sites are unchanged: there the row still fits on one line and the badge
 * still sits at the end.
 */
function ContrastRow({ row }: { row: Row }) {
  const result = checkContrast(row.fg, row.bg);
  if (!result) return null;
  return (
    <div
      className="flex items-start gap-3 gap-y-1.5 py-2.5 flex-wrap"
      style={{ boxShadow: "inset 0 -1px 0 var(--hairline)" }}
    >
      <span
        className="w-9 h-9 rounded-lg grid place-items-center shrink-0 text-[13px] font-semibold"
        style={{ background: row.bg, color: row.fg, boxShadow: "inset 0 0 0 1px rgba(127,127,127,.25)" }}
        aria-hidden
      >
        Aa
      </span>
      <span className="flex-1 min-w-[7.5rem]">
        <span className="block text-[12.5px] font-medium leading-[1.35]">{row.label}</span>
        {row.hint && (
          <span className="block text-[11px] leading-[1.4] break-all" style={{ color: "var(--text-faint)" }}>
            {row.hint}
          </span>
        )}
      </span>
      <span className="shrink-0 ms-auto">
        <Badge result={result} large={row.large} />
      </span>
    </div>
  );
}

export function ContrastReport({ ws, isAr, compact = false }: { ws: Workspace; isAr: boolean; compact?: boolean }) {
  const theme = getBrandTheme(ws);

  const rows: Row[] = [
    {
      label: isAr ? "نص المتن على أرضية الموقع" : "Body text on the site ground",
      hint: `${theme.text} on ${theme.canvas}`,
      fg: theme.text,
      bg: theme.canvas,
    },
    {
      label: isAr ? "النص الثانوي على الأرضية" : "Secondary text on the ground",
      hint: `${theme.textMuted} on ${theme.canvas}`,
      fg: theme.textMuted,
      bg: theme.canvas,
    },
    {
      label: isAr ? "النص الخافت على الأرضية" : "Faint text on the ground",
      hint: isAr ? "التسميات والبيانات الوصفية" : "Captions and metadata",
      fg: theme.textFaint,
      bg: theme.canvas,
    },
    {
      label: isAr ? "اللون المميز على الأرضية" : "Accent on the ground",
      hint: isAr ? "الروابط وأرقام الأقسام" : "Links and section numbers",
      fg: theme.accent,
      bg: theme.canvas,
    },
    {
      label: isAr ? "نص على البطاقات" : "Text on cards",
      hint: `${theme.text} on ${theme.surface1}`,
      fg: theme.text,
      bg: theme.surface1,
    },
  ];

  // The accent band is the one place the guideline puts large type on a solid
  // brand colour, so it is checked against the large-text bar it actually has
  // to clear rather than the body-text one.
  const bandInk = bestInkOn(theme.accent);

  const failures = rows.filter((r) => {
    const c = checkContrast(r.fg, r.bg);
    if (!c) return false;
    return r.large ? !c.aaLarge : !c.aa;
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Wraps for the same reason the rows do — the heading and the verdict
          pill do not both fit across a 206px panel. */}
      <div className="flex items-start gap-2.5 gap-y-1.5 flex-wrap">
        <Icon name="universal-access" size={15} style={{ color: "var(--accent-text)", marginTop: 1, flexShrink: 0 }} />
        <div className="flex-1 min-w-[9rem]">
          <span className="text-[13px] font-semibold block">
            {isAr ? "تباين الألوان على موقع الدليل" : "Contrast on the guideline site"}
          </span>
          <span className="text-[11.5px] block" style={{ color: "var(--text-faint)" }}>
            {isAr
              ? "معيار WCAG 2.1 — يُقاس على الألوان التي يُعرض بها الموقع فعليًا."
              : "WCAG 2.1, measured on the colours the site actually renders in."}
          </span>
        </div>
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ms-auto"
          style={{
            background: "var(--surface-2)",
            color: failures.length === 0 ? "var(--success)" : "var(--warning)",
          }}
        >
          {failures.length === 0
            ? isAr
              ? "كل الفحوص ناجحة"
              : "All pass"
            : isAr
              ? `${failures.length} تحذير`
              : `${failures.length} to fix`}
        </span>
      </div>

      <div className="flex flex-col">
        {rows.map((row) => (
          <ContrastRow key={row.label} row={row} />
        ))}
        {bandInk && (
          <ContrastRow
            row={{
              label: isAr ? "عبارة الافتتاح على شريط اللون المميز" : "Statement band on the accent",
              hint: isAr
                ? `أفضل حبر: ${bandInk.ink === "#ffffff" ? "أبيض" : "أسود"}`
                : `Best ink: ${bandInk.ink === "#ffffff" ? "white" : "black"}`,
              fg: bandInk.ink,
              bg: theme.accent,
              large: true,
            }}
          />
        )}
      </div>

      {!compact && <LogoContrast ws={ws} isAr={isAr} theme={theme} />}

      {failures.length > 0 && (
        <p className="text-[11.5px] leading-[1.6] animate-fade-in" style={{ color: "var(--text-muted)" }}>
          {isAr
            ? "الإصلاح يكون بتعديل اللون في لوحة الألوان أو بتغيير أرضية الموقع — ليس بتكبير النص فقط."
            : "Fix these by adjusting the swatch in your palette or switching the site ground, not by making the type bigger — the ratio is what a screen reader user's low-vision setting can't work around."}
        </p>
      )}
    </div>
  );
}

/**
 * Whether the logo has artwork for the ground the site is actually on.
 *
 * This is a real contrast failure that a ratio can't express: a single-tone
 * dark mark on a dark ground disappears entirely. The app already supports a
 * reversed variant per lockup — this says whether one exists where it is
 * needed, rather than leaving it to be noticed after publishing.
 */
function LogoContrast({
  ws,
  isAr,
  theme,
}: {
  ws: Workspace;
  isAr: boolean;
  theme: ReturnType<typeof getBrandTheme>;
}) {
  const slots = (Object.keys(ws.logo) as SlotKind[]).filter((k) => ws.logo[k].phase === "attached");
  if (slots.length === 0) return null;

  const onDark = !theme.isLight;
  const NAMES: Record<SlotKind, [string, string]> = {
    latin: ["Latin lockup", "الشعار اللاتيني"],
    arabic: ["Arabic lockup", "الشعار العربي"],
    symbol: ["Symbol", "الرمز"],
  };

  return (
    <div className="flex flex-col gap-2 pt-3" style={{ boxShadow: "inset 0 1px 0 var(--hairline)" }}>
      <span className="text-[12px] font-semibold">{isAr ? "الشعار على أرضية الموقع" : "Logo on the site ground"}</span>
      <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
        {isAr
          ? `الموقع يُعرض على أرضية ${theme.isLight ? "فاتحة" : "داكنة"}.`
          : `The site renders on a ${theme.isLight ? "light" : "dark"} ground.`}
      </span>
      {slots.map((kind) => {
        const slot = ws.logo[kind];
        const hasReversed = !!slot.lightUrl;
        // A reversed file is only *needed* on a dark ground; on light, the
        // original artwork is the right one and its absence is not a problem.
        const ok = !onDark || hasReversed;
        return (
          <div key={kind} className="flex items-start gap-2.5 gap-y-0.5 text-[12px] py-1 flex-wrap">
            <Icon
              name={ok ? "check-circle" : "exclamation-circle"}
              size={13}
              style={{ color: ok ? "var(--success)" : "var(--warning)", flexShrink: 0, marginTop: 2 }}
            />
            <span className="flex-1 min-w-[6rem]">{isAr ? NAMES[kind][1] : NAMES[kind][0]}</span>
            <span className="text-[11px] ms-auto" style={{ color: "var(--text-faint)" }}>
              {ok
                ? hasReversed
                  ? isAr
                    ? "نسخة معكوسة متوفرة"
                    : "Reversed artwork supplied"
                  : isAr
                    ? "الأرضية فاتحة — لا حاجة لنسخة معكوسة"
                    : "Light ground — original artwork is correct"
                : isAr
                  ? "لا توجد نسخة فاتحة — قد يختفي على الداكن"
                  : "No light variant — may disappear on dark"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
