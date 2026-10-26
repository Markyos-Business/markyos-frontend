"use client";

import type { ReactNode } from "react";
import { Badge, Button, Icon, Skeleton, useDialog, useToast } from "@/components/ui";
import { formatDay } from "@/components/features/discovery";
import { SECTION_META } from "../constants";
import { regenerateSection } from "../services/briefsService";
import type { Section } from "../types";
import { costLine, withCostConfirm } from "../utils/cost";
import { SectionBody, type ItemAction } from "./sections/SectionBody";

type SectionCardProps = {
  analysisId: string;
  section: Section;
  canEdit: boolean;
  isAr: boolean;
  onChange: (section: Section) => void;
  /** Edit and Add to Strategy, beside Regenerate. */
  actions?: ReactNode;
  /** Replaces the read-only body (the section's editor). */
  body?: ReactNode;
  itemAction?: ItemAction;
};

/** Ready, Edited, Added, Failed: what state a section is in, at a glance. */
export function sectionTag(section: Section, isAr: boolean): { label: string; tone: "success" | "info" | "accent" | "danger" | "neutral" } {
  if (section.status === "failed") return { label: isAr ? "تعذّر" : "Failed", tone: "danger" };
  if (section.status === "regenerating") return { label: isAr ? "تُعاد كتابته" : "Rewriting", tone: "neutral" };
  if (section.status === "pending") return { label: isAr ? "قيد الكتابة" : "Writing", tone: "neutral" };
  if (section.addedToStrategyAt) return { label: isAr ? "أُضيف" : "Added", tone: "accent" };
  if (section.editedByUser) return { label: isAr ? "مُعدَّل" : "Edited", tone: "info" };
  return { label: isAr ? "جاهز" : "Ready", tone: "success" };
}

/** One section of the report, as a card: its content, status and actions. */
export function SectionCard({ analysisId, section, canEdit, isAr, onChange, actions, body, itemAction }: SectionCardProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const lang = isAr ? "ar" : "en";
  const meta = SECTION_META[section.key];
  const { prompt, confirm } = useDialog();
  const { showToast } = useToast();
  const tag = sectionTag(section, isAr);
  const content = section.current;
  const hasContent = !!content && Object.keys(content).length > 0;

  const regenerate = async () => {
    if (section.editedByUser) {
      const ok = await confirm({
        title: t("Replace your edits?", "استبدال تعديلاتك؟"),
        body: t("Regenerating writes a new AI version of this section; your edits to it are replaced.", "تكتب إعادة التوليد نسخة جديدة من هذا القسم، وتُستبدل تعديلاتك عليه."),
        confirmLabel: t("Continue", "متابعة"),
        isAr,
      });
      if (!ok) return;
    }
    const instruction = await prompt({
      title: t(`Regenerate ${meta.en.toLowerCase()}`, `إعادة توليد ${meta.ar}`),
      body: t("Say what to change, or leave it empty for a fresh take.", "اكتب ما تريد تغييره، أو اتركه فارغًا لقراءة جديدة."),
      label: t("Instruction (optional)", "تعليمات (اختيارية)"),
      placeholder: t("Focus on Gen Z…", "ركّز على الجيل الجديد…"),
      confirmLabel: t("Regenerate", "إعادة التوليد"),
      isAr,
    });
    if (instruction === null) return;
    try {
      const updated = await withCostConfirm(
        (confirmCost) => regenerateSection(analysisId, section.key, instruction, confirmCost),
        (quote) =>
          confirm({
            title: t("Regenerate this section?", "إعادة توليد هذا القسم؟"),
            body: costLine(quote, isAr),
            confirmLabel: t("Regenerate", "إعادة التوليد"),
            isAr,
          })
      );
      if (updated) onChange(updated);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("That didn't work.", "لم ينجح ذلك."), "danger");
    }
  };

  return (
    <section id={`section-${section.key}`} aria-labelledby={`title-${section.key}`} className="mk-surface flex scroll-mt-space-10 flex-col gap-space-6 rounded-card bg-surface-1 p-space-8 sm:p-space-10">
      <header className="flex flex-wrap items-start justify-between gap-space-4">
        <div className="flex min-w-0 items-start gap-space-4">
          <span className="grid size-control shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-on-soft">
            <Icon name={meta.icon} size={22} />
          </span>
          <div className="flex flex-col gap-space-1">
            <h2 id={`title-${section.key}`} className="text-h4 font-medium">
              {meta[lang]}
            </h2>
            <p className="text-caption text-text-muted">{meta.hint[lang]}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-space-3">
          <Badge tone={tag.tone} dot>
            {tag.label}
          </Badge>
          {section.addedToStrategyAt && (
            <span className="text-caption text-text-muted">
              {t("Added to Strategy", "أُضيف إلى الاستراتيجية")} · {formatDay(section.addedToStrategyAt, isAr)}
            </span>
          )}
          {actions}
          {canEdit && section.status !== "pending" && (
            <Button variant="outline" size="sm" onClick={() => void regenerate()} disabled={section.status === "regenerating"} icon={<Icon name="history" size={16} />}>
              {t("Regenerate", "إعادة التوليد")}
            </Button>
          )}
        </div>
      </header>

      {section.error && <p className="text-caption text-danger">{section.error}</p>}
      {section.status === "pending" || section.status === "regenerating" ? (
        <Skeleton className="h-40 w-full rounded-lg" />
      ) : body ? (
        body
      ) : hasContent ? (
        <SectionBody sectionKey={section.key} content={content} isAr={isAr} itemAction={itemAction} />
      ) : (
        <p className="text-body text-text-muted">{t("This section couldn't be written. Regenerate it to try again.", "تعذّرت كتابة هذا القسم. أعد توليده للمحاولة مجددًا.")}</p>
      )}
    </section>
  );
}
