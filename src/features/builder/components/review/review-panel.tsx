"use client";

import { Icon, Popover } from "@/components/ui";
import { plural } from "@/lib/i18n/plural";
import type { SiteFinding, SiteReport } from "../../utils/site-review";

/**
 * The pre-publish review of the whole guideline, shown beside the button it
 * gates.
 *
 * It sits next to Publish rather than on a tab of its own on purpose: the
 * findings are read at one moment, before sending the guideline out, so the
 * consequences sit under the control that causes them.
 *
 * Two lists: what must be fixed (sections that would publish empty or broken,
 * a missing logo or palette) and what is worth checking (translations, copy,
 * optional setup). Clicking a finding opens the page or setup screen it is
 * about and selects the section.
 */

/** One row, or a counted row standing for a group of identical ones. */
type Row =
  | { kind: "one"; finding: SiteFinding }
  | { kind: "group"; count: number; first: SiteFinding };

function rowsOf(findings: SiteFinding[]): Row[] {
  const grouped = findings.filter((f) => f.group === "ar-missing");
  const rows: Row[] = findings.filter((f) => !f.group).map((finding) => ({ kind: "one", finding }));
  if (grouped.length > 0) rows.push({ kind: "group", count: grouped.length, first: grouped[0] });
  return rows;
}

const count = (isAr: boolean, n: number, en: { one: string; other: string }, ar: Parameters<typeof plural>[2]) =>
  isAr ? plural("ar", n, ar) : plural("en", n, en);

export function ReviewChip({
  report,
  isAr,
  onSelect,
  compact = false,
  upToDate = false,
}: {
  report: SiteReport;
  isAr: boolean;
  onSelect: (finding: SiteFinding) => void;
  /** Icon and count only (a phone's top bar); the words stay for screen readers. */
  compact?: boolean;
  /** Live with nothing new to publish: a clean review then says so, not "Ready to publish". */
  upToDate?: boolean;
}) {
  const { errors, warnings, checked, pages } = report;
  const total = errors + warnings;

  // Colour carries the severity; the glyph only has to tell the two apart.
  const tone =
    errors > 0
      ? { fg: "text-danger", icon: "exclamation-circle" }
      : warnings > 0
        ? { fg: "text-warning", icon: "info-circle" }
        : { fg: "text-success", icon: "check-circle" };

  // Both languages say the same thing: how many must be fixed, how many to
  // check, or that the guideline is ready.
  const summary =
    errors > 0
      ? isAr ? `${errors} للإصلاح` : `${errors} to fix`
      : warnings > 0
        ? isAr ? `${warnings} للمراجعة` : `${warnings} to review`
        : upToDate
          ? isAr ? "لا ملاحظات" : "No issues"
          : isAr ? "جاهز للنشر" : "Ready to publish";

  const errorRows = rowsOf(report.findings.filter((f) => f.severity === "error"));
  const warningRows = rowsOf(report.findings.filter((f) => f.severity === "warning"));
  const showPage = pages > 1;

  const section = (title: string, rows: Row[], isError: boolean, close: () => void) =>
    rows.length > 0 && (
      <div className="py-1">
        <div className="px-3.5 pt-2 pb-1 text-[11px] font-medium" style={{ color: isError ? "var(--danger)" : "var(--text-muted)" }}>{title}</div>
        {rows.map((row) => {
          const f = row.kind === "one" ? row.finding : row.first;
          return (
            <button /* button-audit-ignore: a two-line finding row in the review list (mk-nav-item) */
              key={row.kind === "one" ? f.id : `group:ar-missing:${f.severity}`}
              type="button"
              data-review-row={f.severity}
              onClick={() => {
                onSelect(f);
                close();
              }}
              className="mk-nav-item w-full flex items-start gap-2.5 px-3.5 py-2 text-start cursor-pointer"
            >
              <Icon
                name={isError ? "exclamation-circle" : "info-circle"}
                size={16}
                style={{ color: isError ? "var(--danger)" : "var(--warning)", marginTop: 1, flexShrink: 0 }}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[11.5px] font-medium">
                  {row.kind === "group"
                    ? count(isAr, row.count, { one: "{n} field with no Arabic yet", other: "{n} fields with no Arabic yet" }, { one: "حقل واحد بلا نص عربي", two: "حقلان بلا نص عربي", few: "{n} حقول بلا نص عربي", many: "{n} حقلًا بلا نص عربي", other: "{n} حقل بلا نص عربي" })
                    : isAr ? f.arLabel : f.label}
                  {showPage && row.kind === "one" && (
                    <span className="font-normal" style={{ color: "var(--text-faint)" }}> · <bdi>{isAr ? f.arPageName : f.pageName}</bdi></span>
                  )}
                </span>
                <span className="block text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>
                  {row.kind === "group"
                    ? isAr ? "سيظهر النص الإنجليزي في الموقع العربي." : "The Arabic site will show the English text."
                    : isAr ? f.arMessage : f.message}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    );

  return (
    <Popover
      label={isAr ? "مراجعة الدليل قبل النشر" : "Review before publishing"}
      width={340}
      trigger="pill"
      button={
        <span className={`contents ${tone.fg}`}>
          <Icon name={tone.icon} size={16} />
          {compact ? (
            <>
              {total > 0 && <span className="tabular-nums">{total}</span>}
              <span className="sr-only">{summary}</span>
            </>
          ) : (
            summary
          )}
        </span>
      }
    >
      {(close) => (
        <div dir={isAr ? "rtl" : "ltr"} className="flex flex-col max-h-[min(70vh,460px)]">
          <div className="px-3.5 pt-3 pb-2.5 shrink-0" style={{ boxShadow: "inset 0 -1px 0 var(--hairline)" }}>
            <div className="text-[12.5px] font-semibold">{isAr ? "مراجعة قبل النشر" : "Before you publish"}</div>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>
              {isAr
                ? `فُحصت ${plural("ar", pages, { one: "صفحة واحدة", two: "صفحتان", few: "{n} صفحات", many: "{n} صفحة", other: "{n} صفحة" })} و${plural("ar", checked, { zero: "لا أقسام", one: "قسم واحد", two: "قسمان", few: "{n} أقسام", many: "{n} قسمًا", other: "{n} قسم" })}.`
                : `Checked ${plural("en", pages, { one: "{n} page", other: "{n} pages" })} and ${plural("en", checked, { one: "{n} section", other: "{n} sections" })}.`}
              {total > 0 && (isAr ? " اضغط على أي بند لفتحه." : " Select an item to open it.")}
            </p>
          </div>

          {total === 0 ? (
            <div className="px-3.5 py-4 flex items-center gap-2 text-[12px]" style={{ color: "var(--text-muted)" }}>
              <Icon name="check" size={16} style={{ color: "var(--success)" }} />
              {isAr
                ? "الأساسيات مكتملة، ولا أقسام فارغة أو روابط معطّلة أو نصوص ناقصة الترجمة."
                : "Brand essentials are in place, with no empty sections, dead links or missing translations."}
            </div>
          ) : (
            <div className="overflow-y-auto">
              {section(isAr ? "يجب إصلاحه" : "Must fix", errorRows, true, close)}
              {section(isAr ? "يستحق المراجعة" : "Worth checking", warningRows, false, close)}
            </div>
          )}
        </div>
      )}
    </Popover>
  );
}
