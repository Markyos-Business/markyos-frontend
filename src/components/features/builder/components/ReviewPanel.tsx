"use client";

import { Icon, Popover } from "@/components/ui";
import type { ReviewFinding, ReviewReport } from "@/components/features/builder/model/pageReview";

/**
 * The review of the page being edited, shown beside the button it gates.
 *
 * It sits next to Publish rather than on a tab of its own on purpose. The
 * findings are only ever read at one moment — before sending the page to a
 * client — and the Framer teardown's own UX note is to put the consequences of
 * an action under the control that causes them, which is already how the
 * contrast report sits under the site-ground switcher in this same builder.
 *
 * Clicking a finding selects the section it is about, so the panel puts you on
 * the problem instead of describing where it is.
 */

/** One row, or a counted row standing for a group of identical ones. */
type Row =
  | { kind: "one"; finding: ReviewFinding }
  | { kind: "group"; count: number; first: ReviewFinding };

function rowsOf(findings: ReviewFinding[]): Row[] {
  const grouped = findings.filter((f) => f.group === "ar-missing");
  const rows: Row[] = findings.filter((f) => !f.group).map((finding) => ({ kind: "one", finding }));
  // Errors first: a page with a gap in it and a page that is merely
  // untranslated are not the same kind of not-ready.
  rows.sort((a, b) => {
    const sev = (r: Row) => (r.kind === "one" && r.finding.severity === "error" ? 0 : 1);
    return sev(a) - sev(b);
  });
  if (grouped.length > 0) rows.push({ kind: "group", count: grouped.length, first: grouped[0] });
  return rows;
}

export function ReviewChip({
  report,
  isAr,
  onSelect,
}: {
  report: ReviewReport;
  isAr: boolean;
  /** Selects a flow id on the canvas. */
  onSelect: (flowId: string) => void;
}) {
  const { errors, warnings, checked } = report;
  const total = errors + warnings;

  // Colour carries the severity; the glyph only has to tell the two apart, which
  // is why an error is the exclamation and a warning the quieter info mark rather
  // than both being some shade of alarm.
  const tone =
    errors > 0
      ? { fg: "text-danger", icon: "exclamation-circle" }
      : warnings > 0
        ? { fg: "text-warning", icon: "info-circle" }
        : { fg: "text-success", icon: "check-circle" };

  const summary =
    errors > 0
      ? isAr
        ? `${errors} للإصلاح`
        : `${errors} to fix`
      : warnings > 0
        ? isAr
          ? `${warnings} للمراجعة`
          : `${warnings} to review`
        : isAr
          ? "لا مشاكل"
          : "All clear";

  const rows = rowsOf(report.findings);

  return (
    <Popover
      label={isAr ? "مراجعة الصفحة" : "Review this page"}
      width={330}
      trigger="pill"
      button={
        // `contents`, so the icon and summary stay the trigger's own flex
        // items while taking the severity colour.
        <span className={`contents ${tone.fg}`}>
          <Icon name={tone.icon} size={16} />
          {summary}
        </span>
      }
    >
      {(close) => (
        <div dir={isAr ? "rtl" : "ltr"} className="flex flex-col max-h-[min(70vh,440px)]">
          <div className="px-3.5 pt-3 pb-2.5 shrink-0" style={{ boxShadow: "inset 0 -1px 0 var(--hairline)" }}>
            <div className="text-[12.5px] font-semibold">{isAr ? "مراجعة الصفحة" : "Page review"}</div>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>
              {total === 0
                ? isAr
                  ? `تم فحص ${checked} قسمًا — لا شيء يحتاج إصلاحًا.`
                  : `${checked} section${checked === 1 ? "" : "s"} checked — nothing to fix.`
                : isAr
                  ? "اضغط على أي نتيجة للانتقال إلى القسم."
                  : "Click a finding to jump to the section."}
            </p>
          </div>

          {total === 0 ? (
            <div className="px-3.5 py-4 flex items-center gap-2 text-[12px]" style={{ color: "var(--text-muted)" }}>
              <Icon name="check" size={13} style={{ color: "var(--success)" }} />
              {isAr
                ? "لا أقسام فارغة، ولا روابط معطّلة، ولا فراغات في اللغة."
                : "No empty sections, no dead links, no language gaps."}
            </div>
          ) : (
            <div className="overflow-y-auto py-1">
              {rows.map((row) => {
                const f = row.kind === "one" ? row.finding : row.first;
                const isError = row.kind === "one" && f.severity === "error";
                return (
                  <button
                    key={row.kind === "one" ? f.id : "group:ar-missing"}
                    type="button"
                    // `mk-nav-item` is only the hover treatment, which the
                    // sidebar also uses; the attribute is what identifies a
                    // finding row, so a probe counting findings can't
                    // accidentally count navigation.
                    data-review-row={f.severity}
                    onClick={() => {
                      onSelect(f.flowId);
                      close();
                    }}
                    className="mk-nav-item w-full flex items-start gap-2.5 px-3.5 py-2 text-start cursor-pointer"
                  >
                    <Icon
                      name={isError ? "exclamation-circle" : "info-circle"}
                      size={11}
                      style={{ color: isError ? "var(--danger)" : "var(--warning)", marginTop: 3, flexShrink: 0 }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11.5px] font-medium">
                        {row.kind === "group"
                          ? isAr
                            ? `${row.count} حقلًا بلا نص عربي`
                            : `${row.count} field${row.count === 1 ? "" : "s"} with no Arabic yet`
                          : isAr
                            ? f.arLabel
                            : f.label}
                      </span>
                      <span className="block text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>
                        {row.kind === "group"
                          ? isAr
                            ? "سيظهر النص الإنجليزي في الموقع العربي."
                            : "The Arabic site will show the English text."
                          : isAr
                            ? f.arMessage
                            : f.message}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Popover>
  );
}
