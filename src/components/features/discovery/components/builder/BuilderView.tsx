"use client";

import { useMemo, useState, type DragEvent } from "react";
import { ActionsDropdown, AlertBanner, Badge, Button, EmptyState, Icon, IconButton, Skeleton, Tabs, useDialog } from "@/components/ui";
import { STATUS_META, TYPE_META, TYPE_ORDER } from "../../constants";
import { useFormEditor } from "../../hooks/builder/useFormEditor";
import { defaultConfig } from "../../model/defaults";
import { editRefusal } from "../../model/status";
import {
  addQuestion,
  addSection,
  deleteQuestion,
  deleteSection,
  duplicateQuestion,
  reorderQuestions,
  renameSection,
  updateQuestion,
} from "../../services/discoveryService";
import type { DiscoveryForm, FormQuestion, QuestionDraft, QuestionType } from "../../types";
import { SaveStatus } from "../SaveStatus";
import { LibraryPanel } from "./LibraryPanel";
import { LocalizedInput, type EditMode } from "./LocalizedInput";
import { QuestionCard } from "./QuestionCard";
import { QuestionSettings } from "./QuestionSettings";

type BuilderViewProps = {
  formId: string;
  /** Where "Theme and send" goes. */
  sendHref: string;
  isAr: boolean;
};

type Placed = { question: FormQuestion; sectionId: string; number: number };

/** Every question in display order, numbered across the form. */
const flatten = (form: DiscoveryForm): Placed[] => {
  let n = 0;
  return form.sections.flatMap((s) => s.questions.map((question) => ({ question, sectionId: s.id, number: ++n })));
};

/**
 * The form builder: the library on one side, the questions in the middle,
 * the selected question's settings on the other. Every change saves as it's
 * made. Once the form is sent, only wording and new optional questions can
 * change, and the builder says so instead of offering what the server would
 * refuse.
 */
export function BuilderView({ formId, sendHref, isAr }: BuilderViewProps) {
  const editor = useFormEditor(formId);
  const { form, run } = editor;
  const { confirm } = useDialog();
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modeChoice, setModeChoice] = useState<EditMode | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const t = (en: string, ar: string) => (isAr ? ar : en);

  const placed = useMemo(() => (form ? flatten(form) : []), [form]);

  if (editor.loadError) return <EmptyState icon="exclamation-circle" title={t("Couldn't open this form", "تعذّر فتح النموذج")} description={editor.loadError} />;
  if (!form) return <Skeleton className="h-96 w-full rounded-card" />;

  const languages = form.languages;
  const both = languages.length === 2;
  const mode: EditMode = both ? (modeChoice ?? "both") : languages[0];
  const section = form.sections.find((s) => s.id === sectionId) ?? form.sections[0];
  const selected = placed.find((p) => p.question.id === selectedId) ?? null;
  const locked = editRefusal(form.status, "structure") !== null;
  const readOnly = editRefusal(form.status, "wording") !== null;
  const canAdd = editRefusal(form.status, "add_optional_question") === null;
  const added = new Set(placed.map((p) => p.question.sourceLibraryQuestionId).filter((id): id is string => !!id));
  const status = STATUS_META[form.status];

  /** The id of the question a change added, so it can be selected. */
  const newest = (before: DiscoveryForm, after: DiscoveryForm) => {
    const old = new Set(flatten(before).map((p) => p.question.id));
    return flatten(after).find((p) => !old.has(p.question.id))?.question.id ?? null;
  };

  const add = (draft: QuestionDraft) =>
    run(async () => {
      const next = await addQuestion(form.id, { sectionId: section.id, ...draft });
      setSelectedId(newest(form, next));
      return next;
    });

  const addBlank = (type: QuestionType) =>
    add({
      type,
      title: { en: languages.includes("en") ? "New question" : null, ar: languages.includes("ar") ? "سؤال جديد" : null },
      config: defaultConfig(type),
    });

  const patch = (question: FormQuestion, draft: QuestionDraft) => run(() => updateQuestion(form.id, question.id, draft));

  const remove = async (question: FormQuestion) => {
    const ok = await confirm({
      title: t("Delete this question?", "حذف هذا السؤال؟"),
      body: t("It's removed from the form. The library keeps its own copy.", "سيُحذف من النموذج، وتبقى نسخته في المكتبة."),
      confirmLabel: t("Delete", "حذف"),
      tone: "danger",
      isAr,
    });
    if (ok) await run(() => deleteQuestion(form.id, question.id));
  };

  /** The whole order with `id` moved to sit before `beforeId` (or at the end of `toSection`). */
  const reorder = (id: string, toSection: string, beforeId: string | null) => {
    const items = placed.filter((p) => p.question.id !== id).map((p) => ({ id: p.question.id, sectionId: p.sectionId }));
    const at = beforeId ? items.findIndex((i) => i.id === beforeId) : -1;
    const endOfSection = items.reduce((last, item, i) => (item.sectionId === toSection ? i + 1 : last), items.findIndex((i) => i.sectionId === toSection));
    const index = at >= 0 ? at : endOfSection >= 0 ? endOfSection : items.length;
    items.splice(index, 0, { id, sectionId: toSection });
    return run(() => reorderQuestions(form.id, items));
  };

  const move = (question: FormQuestion, step: -1 | 1) => {
    const inSection = section.questions;
    const i = inSection.findIndex((q) => q.id === question.id);
    const target = inSection[i + step];
    if (!target) return;
    // Moving down is moving the next one above this.
    if (step === -1) reorder(question.id, section.id, target.id);
    else reorder(target.id, section.id, question.id);
  };

  const dragProps = (question: FormQuestion) => ({
    draggable: !locked,
    onDragStart: (e: DragEvent) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", question.id);
      setDragging(question.id);
    },
    onDragEnd: () => setDragging(null),
  });

  const dropProps = (beforeId: string | null, toSection: string) => ({
    onDragOver: (e: DragEvent) => {
      if (dragging) e.preventDefault();
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain");
      setDragging(null);
      if (id && id !== beforeId) reorder(id, toSection, beforeId);
    },
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-space-5">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-h3 font-medium">{form.name}</h1>
          <div className="flex flex-wrap items-center gap-space-4">
            <Badge tone={status.tone} dot>
              {status[isAr ? "ar" : "en"]}
            </Badge>
            <SaveStatus saving={editor.saving} savedAt={editor.savedAt} error={editor.error} isAr={isAr} />
          </div>
        </div>
        {both && (
          <Tabs
            label={t("Edit in", "التحرير بـ")}
            tabs={[
              { key: "en", label: "English" },
              { key: "ar", label: "العربية" },
              { key: "both", label: t("Both", "كلتاهما") },
            ]}
            active={mode}
            onChange={setModeChoice}
          />
        )}
        <Button variant="primary" href={sendHref} icon={<Icon name="arrow-right" size={18} className="rtl:-scale-x-100" />}>
          {form.status === "draft" ? t("Theme and send", "التصميم والإرسال") : t("Theme and link", "التصميم والرابط")}
        </Button>
      </div>

      <AlertBanner message={editor.error} />
      {readOnly ? (
        <AlertBanner message={t("This form was submitted. Reopen it from its answers to change questions.", "سُلِّم هذا النموذج. أعد فتحه من صفحة الإجابات لتعديل الأسئلة.")} />
      ) : (
        locked && (
          <p className="rounded-lg bg-warning-soft px-space-6 py-space-5 text-body text-warning shadow-edge">
            {t(
              "This form has been sent. Wording, help text and new optional questions can still change; anything that could break an answer is locked.",
              "أُرسل هذا النموذج. ما زال بالإمكان تعديل الصياغة والنص التوضيحي وإضافة أسئلة اختيارية؛ وكل ما قد يُفسد إجابة مقفل."
            )}
          </p>
        )
      )}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
        <div className="xl:sticky xl:top-0 xl:max-h-[calc(100vh-180px)] xl:min-h-0 xl:[&>aside]:max-h-[calc(100vh-180px)]">
          <LibraryPanel added={added} onAdd={(id) => add({ libraryQuestionId: id })} disabled={!canAdd} isAr={isAr} />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div role="tablist" aria-label={t("Sections", "الأقسام")} className="flex flex-wrap items-center gap-space-3">
            {form.sections.map((s, i) => {
              const on = s.id === section.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setSectionId(s.id)}
                  {...dropProps(null, s.id)}
                  className={`flex h-control-sm items-center gap-space-3 rounded-lg px-space-5 text-body font-medium transition-[background-color,color,box-shadow] ${
                    on ? "bg-surface-2 text-text shadow-edge" : "text-text-muted hover:text-text"
                  }`}
                >
                  <span className="max-w-48 truncate" dir="auto">
                    {(isAr ? s.title.ar || s.title.en : s.title.en || s.title.ar) || t(`Section ${i + 1}`, `القسم ${i + 1}`)}
                  </span>
                  <span className="text-caption tabular-nums text-text-muted">{s.questions.length}</span>
                </button>
              );
            })}
            <Button
              variant="link"
              disabled={!canAdd}
              onClick={() =>
                run(async () => {
                  const next = await addSection(form.id, {
                    en: languages.includes("en") ? "New section" : null,
                    ar: languages.includes("ar") ? "قسم جديد" : null,
                  });
                  setSectionId(next.sections[next.sections.length - 1].id);
                  return next;
                })
              }
            >
              <Icon name="plus" size={16} />
              {t("Section", "قسم")}
            </Button>
          </div>

          <div className="flex items-end gap-space-4 rounded-card bg-surface-sunken p-space-6 shadow-edge-soft">
            <div className="min-w-0 flex-1">
              <LocalizedInput
                label={{ en: "Section title", ar: "عنوان القسم" }}
                value={section.title}
                onCommit={(title) => run(() => renameSection(form.id, section.id, title))}
                mode={mode}
                languages={languages}
                disabled={readOnly}
                isAr={isAr}
              />
            </div>
            <IconButton
              icon="trash"
              label={t("Delete section", "حذف القسم")}
              disabled={locked || form.sections.length <= 1}
              onClick={async () => {
                const ok = await confirm({
                  title: t("Delete this section?", "حذف هذا القسم؟"),
                  consequences: [t(`Its ${section.questions.length} questions go with it`, `ستُحذف أسئلته الـ${section.questions.length} معه`)],
                  confirmLabel: t("Delete section", "حذف القسم"),
                  tone: "danger",
                  isAr,
                });
                if (ok) {
                  setSectionId(null);
                  await run(() => deleteSection(form.id, section.id));
                }
              }}
              className="text-text-muted hover:text-danger disabled:text-text-disabled"
            />
          </div>

          {section.questions.length === 0 && (
            <EmptyState
              icon="clipboard-list"
              title={t("No questions in this section", "لا أسئلة في هذا القسم")}
              description={t("Add one from the library, or write your own.", "أضف سؤالًا من المكتبة، أو اكتب سؤالك.")}
            />
          )}

          {section.questions.map((question, i) => {
            const at = placed.find((p) => p.question.id === question.id)!;
            return (
              <QuestionCard
                key={question.id}
                question={question}
                number={at.number}
                selected={question.id === selectedId}
                onSelect={() => setSelectedId(question.id)}
                onPatch={(draft) => patch(question, draft)}
                onDuplicate={() => run(() => duplicateQuestion(form.id, question.id))}
                onDelete={() => void remove(question)}
                onMove={(step) => move(question, step)}
                canMoveUp={i > 0}
                canMoveDown={i < section.questions.length - 1}
                dragProps={dragProps(question)}
                dropProps={dropProps(question.id, section.id)}
                mode={mode}
                languages={languages}
                locked={locked}
                isAr={isAr}
              />
            );
          })}

          {canAdd && (
            <div>
              <ActionsDropdown
                label={t("Write a question", "اكتب سؤالًا")}
                align="start"
                items={TYPE_ORDER.map((type) => ({
                  label: TYPE_META[type][isAr ? "ar" : "en"],
                  icon: TYPE_META[type].icon,
                  onSelect: () => void addBlank(type),
                }))}
              />
            </div>
          )}
        </div>

        <aside aria-label={t("Question settings", "إعدادات السؤال")} className="mk-surface rounded-card bg-surface-1 p-space-8 xl:sticky xl:top-0">
          {selected ? (
            <QuestionSettings
              key={selected.question.id}
              question={selected.question}
              earlier={placed.filter((p) => p.number < selected.number).map(({ question, number }) => ({ question, number }))}
              onPatch={(draft) => patch(selected.question, draft)}
              locked={locked}
              isAr={isAr}
            />
          ) : (
            <p className="text-body text-text-muted">{t("Select a question to see its settings.", "اختر سؤالًا لعرض إعداداته.")}</p>
          )}
        </aside>
      </div>
    </div>
  );
}
