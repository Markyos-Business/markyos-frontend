"use client";

import { useState } from "react";
import { Button, Icon } from "@/components/ui";
import { SelectField } from "@/components/form";
import { WARNING_META } from "../constants";
import type { Overview } from "../types";

type RunPanelProps = {
  overview: Overview;
  isAr: boolean;
  running: boolean;
  onRun: (language: "en" | "ar") => void;
};

/**
 * Before the first analysis: what it would read, whether that looks thin,
 * and what it costs.
 */
export function RunPanel({ overview, isAr, running, onRun }: RunPanelProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [language, setLanguage] = useState<"en" | "ar">(isAr ? "ar" : "en");
  const { sources, quote } = overview;
  const nothing = !sources.answers && !sources.calls;

  return (
    <section className="mk-surface flex flex-col items-center gap-space-6 rounded-card bg-surface-1 px-space-10 py-space-11 text-center">
      <span className="grid size-control place-items-center rounded-lg bg-accent-soft text-accent-on-soft">
        <Icon name="chart-line" size={22} />
      </span>
      <div className="flex flex-col gap-space-2">
        <h2 className="text-h4 font-medium">{t("No analysis yet.", "لا يوجد تحليل بعد.")}</h2>
        <p className="tabular-nums text-body text-text-muted">
          {sources.answers} {t("answers", "إجابة")} · {sources.calls} {t(sources.calls === 1 ? "call" : "calls", "مكالمة")} ·{" "}
          {sources.words.toLocaleString("en")} {t("words", "كلمة")}
        </p>
      </div>
      {sources.warnings.length > 0 && (
        <ul className="flex max-w-120 flex-col gap-space-2 rounded-lg bg-warning-soft px-space-6 py-space-4 text-start text-body text-warning">
          {sources.warnings.map((w) => (
            <li key={w}>{WARNING_META[w][isAr ? "ar" : "en"]}</li>
          ))}
        </ul>
      )}
      {!overview.configured ? (
        <p className="text-caption text-text-muted">{t("The analysis isn't set up on this server.", "التحليل غير مُعدّ على هذا الخادم.")}</p>
      ) : (
        overview.canEdit && (
          <div className="flex flex-wrap items-end justify-center gap-space-4">
            <div className="w-44 text-start">
              <SelectField
                label={t("Write it in", "اكتبه بـ")}
                value={language}
                onChange={(e) => setLanguage(e.target.value as "en" | "ar")}
                options={[
                  { value: "en", label: "English" },
                  { value: "ar", label: "العربية" },
                ]}
              />
            </div>
            <Button variant="primary" onClick={() => onRun(language)} disabled={running || nothing} icon={<Icon name="chart-line" size={18} />}>
              {t("Run analysis", "تشغيل التحليل")}
            </Button>
          </div>
        )
      )}
      {overview.configured && (
        <p className="text-caption text-text-muted">
          {quote.free
            ? t("First analysis free", "التحليل الأول مجاني")
            : t(`${quote.credits} credits`, `${quote.credits} رصيد`)}
        </p>
      )}
    </section>
  );
}
