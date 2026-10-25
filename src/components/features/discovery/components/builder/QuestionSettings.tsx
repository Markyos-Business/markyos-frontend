"use client";

import type { ReactNode } from "react";
import { Row, Switch } from "@/components/ui";
import { SelectField, SelectInput } from "@/components/form";
import { ANALYSIS_TARGETS, TYPE_META, TYPE_ORDER } from "../../constants";
import { defaultConfig } from "../../model/defaults";
import type { AnalysisTarget, FormQuestion, QuestionConfig, QuestionDraft, QuestionType } from "../../types";
import { ConditionEditor } from "./ConditionEditor";

type QuestionSettingsProps = {
  question: FormQuestion;
  earlier: { question: FormQuestion; number: number }[];
  onPatch: (draft: QuestionDraft) => void;
  /** Sent: structure can't change, so these controls are off. */
  locked: boolean;
  isAr: boolean;
};

const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-space-5 pt-space-6 shadow-rule-t first:pt-0 first:shadow-none">
    <h3 className="text-caption text-text-muted">{title}</h3>
    {children}
  </section>
);

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

// No SVG: a client's upload is served from the studio's domain, and an SVG
// can carry script.
const FILE_TYPES = [
  { key: "image/png,image/jpeg,image/webp", en: "Images", ar: "صور" },
  { key: "application/pdf", en: "PDF", ar: "PDF" },
  { key: ".doc,.docx", en: "Word documents", ar: "مستندات وورد" },
  { key: ".ai,.eps", en: "Design files", ar: "ملفات تصميم" },
];

/** The selected question's settings: type, required, picks, limits, show/hide, analysis. */
export function QuestionSettings({ question, earlier, onPatch, locked, isAr }: QuestionSettingsProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const config = question.config;
  const setConfig = (patch: Partial<QuestionConfig>) => onPatch({ config: { ...config, ...patch } });
  const options = config.options?.length ?? 0;

  return (
    <div className="flex flex-col gap-space-6">
      <Group title={t("Question", "السؤال")}>
        <SelectField
          label={t("Type", "النوع")}
          value={question.type}
          disabled={locked}
          onChange={(e) => {
            const type = e.target.value as QuestionType;
            // A new type starts from its own defaults; the old options don't fit.
            onPatch({ type, config: defaultConfig(type) });
          }}
          options={TYPE_ORDER.map((type) => ({ value: type, label: TYPE_META[type][isAr ? "ar" : "en"] }))}
        />
        <Row
          label={t("Required", "إلزامي")}
          hint={t("The client can't submit without it, unless it's hidden.", "لا يمكن الإرسال دونه، إلا إذا كان مخفيًا.")}
          right={<Switch label={t("Required", "إلزامي")} checked={question.required} onToggle={() => !locked && onPatch({ required: !question.required })} />}
        />
      </Group>

      {question.type === "text" && (
        <Group title={t("Answer", "الإجابة")}>
          <Row
            label={t("Long answer", "إجابة طويلة")}
            right={<Switch label={t("Long answer", "إجابة طويلة")} checked={!!config.multiline} onToggle={() => !locked && setConfig({ multiline: !config.multiline })} />}
          />
        </Group>
      )}

      {question.type === "choice" && (
        <Group title={t("Choices", "الخيارات")}>
          <Row
            label={t("Several answers", "أكثر من إجابة")}
            right={
              <Switch
                label={t("Several answers", "أكثر من إجابة")}
                checked={!!config.multiple}
                onToggle={() => !locked && setConfig({ multiple: !config.multiple, maxPicks: undefined })}
              />
            }
          />
          <Row
            label={t("“Something else”", "«شيء آخر»")}
            hint={t("Lets the client write their own answer.", "يتيح للعميل كتابة إجابته الخاصة.")}
            right={<Switch label={t("Something else", "شيء آخر")} checked={!!config.allowOther} onToggle={() => !locked && setConfig({ allowOther: !config.allowOther })} />}
          />
          {config.multiple && (
            <SelectField
              label={t("At most", "بحد أقصى")}
              value={config.maxPicks ? String(config.maxPicks) : ""}
              placeholder={t("No limit", "بلا حد")}
              disabled={locked}
              onChange={(e) => setConfig({ maxPicks: e.target.value ? Number(e.target.value) : undefined })}
              options={[{ value: "", label: t("No limit", "بلا حد") }, ...range(1, Math.max(options, 1)).map((n) => ({ value: String(n), label: String(n) }))]}
            />
          )}
        </Group>
      )}

      {question.type === "image_choice" && (
        <Group title={t("Picks", "الاختيارات")}>
          <div className="grid grid-cols-2 gap-space-5">
            {(["minPicks", "maxPicks"] as const).map((key) => (
              <SelectField
                key={key}
                label={key === "minPicks" ? t("At least", "على الأقل") : t("At most", "بحد أقصى")}
                value={String(config[key] ?? 1)}
                disabled={locked}
                onChange={(e) => setConfig({ [key]: Number(e.target.value) })}
                options={range(1, Math.max(options, 1)).map((n) => ({ value: String(n), label: String(n) }))}
              />
            ))}
          </div>
        </Group>
      )}

      {question.type === "scale" && (
        <Group title={t("Scale", "المقياس")}>
          <SelectField
            label={t("Points", "عدد النقاط")}
            value={String(config.max ?? 5)}
            disabled={locked}
            onChange={(e) => setConfig({ min: 1, max: Number(e.target.value) })}
            options={[
              { value: "5", label: "1–5" },
              { value: "10", label: "1–10" },
            ]}
          />
        </Group>
      )}

      {question.type === "upload" && (
        <Group title={t("Files", "الملفات")}>
          <div className="grid grid-cols-2 gap-space-5">
            <SelectField
              label={t("Files", "عدد الملفات")}
              value={String(config.maxFiles ?? 10)}
              disabled={locked}
              onChange={(e) => setConfig({ maxFiles: Number(e.target.value) })}
              options={[1, 3, 5, 10, 20].map((n) => ({ value: String(n), label: String(n) }))}
            />
            <SelectField
              label={t("Size each", "حجم كل ملف")}
              value={String(config.maxSizeMb ?? 20)}
              disabled={locked}
              onChange={(e) => setConfig({ maxSizeMb: Number(e.target.value) })}
              options={[5, 10, 20, 50].map((n) => ({ value: String(n), label: `${n} MB` }))}
            />
          </div>
          {FILE_TYPES.map((type) => {
            const on = (config.accept ?? []).includes(type.key);
            return (
              <Row
                key={type.key}
                label={isAr ? type.ar : type.en}
                right={
                  <Switch
                    label={isAr ? type.ar : type.en}
                    checked={on}
                    onToggle={() => {
                      if (locked) return;
                      const accept = on ? (config.accept ?? []).filter((a) => a !== type.key) : [...(config.accept ?? []), type.key];
                      if (accept.length) setConfig({ accept });
                    }}
                  />
                }
              />
            );
          })}
        </Group>
      )}

      {question.type === "link" && (
        <Group title={t("Links", "الروابط")}>
          <SelectField
            label={t("At most", "بحد أقصى")}
            value={String(config.maxCount ?? 5)}
            disabled={locked}
            onChange={(e) => setConfig({ maxCount: Number(e.target.value) })}
            options={range(1, 10).map((n) => ({ value: String(n), label: String(n) }))}
          />
        </Group>
      )}

      <Group title={t("Show or hide", "الإظهار والإخفاء")}>
        <ConditionEditor earlier={earlier} visibility={question.visibility} onChange={(visibility) => onPatch({ visibility })} disabled={locked} isAr={isAr} />
      </Group>

      <Group title={t("Feeds the analysis", "يغذّي التحليل")}>
        <SelectInput
          aria-label={t("Which analysis it feeds", "ما يغذّيه من التحليل")}
          value={question.analysisTarget}
          disabled={locked}
          onChange={(e) => onPatch({ analysisTarget: e.target.value as AnalysisTarget | "" })}
          options={[
            { value: "", label: t("Nothing, it's practical", "لا شيء، سؤال عملي") },
            ...(Object.keys(ANALYSIS_TARGETS) as AnalysisTarget[]).map((key) => ({ value: key, label: ANALYSIS_TARGETS[key][isAr ? "ar" : "en"] })),
          ]}
        />
      </Group>
    </div>
  );
}
