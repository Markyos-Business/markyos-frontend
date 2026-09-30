"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { EmptyHint } from "@/components/workspace/SectionUI";
import { LintFinding, LintSeverity, lintCopy, lintParity } from "@/lib/copyLint";
import { Workspace } from "@/lib/types";

const SEVERITY_TONE: Record<LintSeverity, { bg: string; fg: string; label: string; arLabel: string }> = {
  error: { bg: "rgba(255,128,139,.14)", fg: "var(--danger)", label: "Fix", arLabel: "خطأ" },
  warning: { bg: "rgba(244,190,94,.14)", fg: "var(--warning)", label: "Check", arLabel: "تحقّق" },
  suggestion: { bg: "var(--surface-2)", fg: "var(--text-muted)", label: "Consider", arLabel: "اقتراح" },
};

export function CopyLinterContent({ ws }: { ws: Workspace }) {
  const isAr = ws.lang === "ar";
  const [en, setEn] = useState("");
  const [ar, setAr] = useState("");

  const enFindings = useMemo(() => lintCopy(en, ws.strategy.voiceTraits, "latin"), [en, ws.strategy.voiceTraits]);
  const arFindings = useMemo(() => lintCopy(ar, ws.strategy.voiceTraits, "arabic"), [ar, ws.strategy.voiceTraits]);
  const parity = useMemo(() => lintParity(en, ar), [en, ar]);

  const touched = en.trim().length > 0 || ar.trim().length > 0;
  const total = enFindings.length + arFindings.length + parity.length;

  /** Applies a finding's replacement in place, so a fix is one click. */
  function applyFix(lang: "en" | "ar", f: LintFinding) {
    if (f.replacement === undefined) return;
    const setter = lang === "en" ? setEn : setAr;
    const value = lang === "en" ? en : ar;
    setter(value.slice(0, f.start) + f.replacement + value.slice(f.end));
  }

  return (
    <div className="flex-1 min-h-0 px-7 py-6.5 flex flex-col gap-5 overflow-auto">
      <div>
        <h1 className="text-[30px] font-semibold tracking-tight mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
          {isAr ? "مدقّق النصوص" : "Copy linter"}
        </h1>
        <p className="text-[14px] max-w-[70ch]" style={{ color: "var(--text-muted)" }}>
          {isAr
            ? "الصق النسختين الإنجليزية والعربية قبل النشر. يفحص المدقّق النص مقابل مصفوفة النبرة الخاصة بهذه الهوية، ثم يفحص الأخطاء التي لا يراها مدقّق لاتيني: الترقيم العربي، التطويل، خلط الأرقام، وترتيب الاتجاهين."
            : "Paste the English and Arabic before it ships. Every line is checked against this brand's own voice matrix, then against the mistakes a Latin-only linter can't see — Arabic punctuation, tatweel, mixed digits, and bidi ordering."}
        </p>
      </div>

      {ws.strategy.voiceTraits.length === 0 ? (
        <div
          className="rounded-xl px-4 py-3.5 flex items-start gap-3 text-[13px]"
          style={{ background: "var(--surface-1)", color: "var(--text-secondary)" }}
        >
          <Icon name="info-circle" size={16} style={{ color: "var(--warning)", flexShrink: 0, marginTop: 1 }} />
          <span>
            {isAr
              ? "لم تُضف سمات نبرة بعد — يعمل المدقّق بالقواعد العامة فقط. أضف سمات في الاستراتيجية ← الشخصية والنبرة ليفحص صوت هذه الهوية تحديدًا."
              : "No voice traits defined yet, so only the general rules are running. Add them under Strategy → Personality & tone to have this brand's own voice checked."}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          <span style={{ color: "var(--text-faint)" }}>{isAr ? "يفحص مقابل:" : "Checking against:"}</span>
          {ws.strategy.voiceTraits.map((t) => (
            <span
              key={t.id}
              className="px-2.5 py-1 rounded-full font-medium"
              style={{ background: "var(--accent-soft)", color: "var(--accent-on-soft)" }}
              title={`Do: ${t.doExample}\nDon't: ${t.dontExample}`}
            >
              {t.trait}
            </span>
          ))}
        </div>
      )}

      {parity.length > 0 && (
        <div className="flex flex-col gap-2">
          {parity.map((p, i) => {
            const tone = SEVERITY_TONE[p.severity];
            return (
              <div
                key={i}
                className="rounded-xl px-4 py-3 flex items-start gap-3 text-[13px]"
                style={{ background: tone.bg, color: "var(--text-secondary)" }}
              >
                <Icon name="exclamation-circle" size={16} style={{ color: tone.fg, flexShrink: 0, marginTop: 1 }} />
                <span>{isAr ? p.arMessage : p.message}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <DraftPanel
          label="English"
          arLabel="الإنجليزية"
          dir="ltr"
          isAr={isAr}
          value={en}
          onChange={setEn}
          placeholder="Paste the English draft — a headline, a caption, a product line."
          findings={enFindings}
          onFix={(f) => applyFix("en", f)}
        />
        <DraftPanel
          label="Arabic"
          arLabel="العربية"
          dir="rtl"
          isAr={isAr}
          value={ar}
          onChange={setAr}
          placeholder="الصق النسخة العربية هنا."
          findings={arFindings}
          onFix={(f) => applyFix("ar", f)}
        />
      </div>

      {touched && total === 0 && (
        <div
          className="rounded-xl px-4 py-3.5 flex items-center gap-3 text-[13px]"
          style={{ background: "rgba(124,231,172,.12)", color: "var(--success)" }}
        >
          <Icon name="check-circle" size={16} />
          {isAr ? "لا ملاحظات. النص مطابق لقواعد هذه الهوية." : "Nothing flagged. This copy is on brand."}
        </div>
      )}

      <p className="text-[11.5px] max-w-[70ch]" style={{ color: "var(--text-faint)" }}>
        {isAr
          ? "كل قاعدة هنا حرفية وقابلة للتفسير — تطابقت عبارة أو لم تتطابق. لا يُرسل النص إلى أي خادم أو نموذج؛ الفحص يجري في متصفحك، وما تكتبه هنا لا يُحفظ."
          : "Every rule here is literal and explainable — a phrase matched or it didn't. Nothing is sent to a server or a model; the check runs in your browser, and what you type here isn't saved."}
      </p>
    </div>
  );
}

function DraftPanel({
  label,
  arLabel,
  dir,
  isAr,
  value,
  onChange,
  placeholder,
  findings,
  onFix,
}: {
  label: string;
  arLabel: string;
  dir: "ltr" | "rtl";
  isAr: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  findings: LintFinding[];
  onFix: (f: LintFinding) => void;
}) {
  const counts = findings.reduce<Record<string, number>>((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3.5" style={{ background: "var(--surface-1)" }}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-[13px]">{isAr ? arLabel : label}</span>
        <div className="flex items-center gap-1.5">
          {(["error", "warning", "suggestion"] as LintSeverity[]).map((s) =>
            counts[s] ? (
              <span
                key={s}
                className="text-[10.5px] font-semibold px-2 py-1 rounded-full"
                style={{ background: SEVERITY_TONE[s].bg, color: SEVERITY_TONE[s].fg }}
              >
                {counts[s]} {isAr ? SEVERITY_TONE[s].arLabel : SEVERITY_TONE[s].label}
              </span>
            ) : null
          )}
        </div>
      </div>

      <textarea
        dir={dir}
        // The panel heading names the language; the box itself was anonymous,
        // and the placeholder that stood in for a name disappears on the first
        // keystroke.
        aria-label={isAr ? `مسودة ${arLabel}` : `${label} draft`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={7}
        placeholder={placeholder}
        className="w-full rounded-[12px] p-4 outline-none resize-y text-[14px]"
        style={{
          background: "var(--surface-2)",
          color: "var(--text)",
          lineHeight: dir === "rtl" ? 1.85 : 1.6,
          fontFamily: dir === "rtl" ? "var(--font-arabic)" : "var(--font-sans)",
        }}
      />

      {value.trim() && findings.length === 0 && (
        <EmptyHint>{isAr ? "لا ملاحظات على هذه النسخة." : "Nothing flagged in this version."}</EmptyHint>
      )}

      <div className="flex flex-col gap-2">
        {findings.map((f) => {
          const tone = SEVERITY_TONE[f.severity];
          return (
            <div key={f.id} className="rounded-xl p-3 flex flex-col gap-1.5" style={{ background: "var(--surface-2)" }}>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-semibold px-2 py-[3px] rounded-full shrink-0"
                  style={{ background: tone.bg, color: tone.fg, letterSpacing: ".04em" }}
                >
                  {isAr ? f.arRule : f.rule}
                </span>
                <span
                  dir={dir}
                  className="text-[11.5px] truncate"
                  style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-faint)" }}
                >
                  {f.excerpt}
                </span>
                {f.replacement !== undefined && (
                  <button
                    type="button"
                    onClick={() => onFix(f)}
                    className="ms-auto shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer"
                    style={{ background: "var(--accent-soft)", color: "var(--accent-on-soft)" }}
                  >
                    {isAr ? "أصلحها" : "Fix"}
                  </button>
                )}
              </div>
              <p className="text-[12.5px] leading-[1.5]" style={{ color: "var(--text-secondary)" }}>
                {isAr ? f.arMessage : f.message}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
