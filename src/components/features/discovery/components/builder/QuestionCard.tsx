"use client";

import type { DragEvent } from "react";
import { Badge, Icon, IconButton } from "@/components/ui";
import { TYPE_META } from "../../constants";
import type { FormQuestion, QuestionDraft } from "../../types";
import { LocalizedInput, type EditMode } from "./LocalizedInput";
import { TYPE_EDITORS } from "./typeEditors";

type QuestionCardProps = {
  question: FormQuestion;
  number: number;
  selected: boolean;
  onSelect: () => void;
  onPatch: (draft: QuestionDraft) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: (step: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  dragProps: { draggable: boolean; onDragStart: (e: DragEvent) => void; onDragEnd: () => void };
  dropProps: { onDragOver: (e: DragEvent) => void; onDrop: (e: DragEvent) => void };
  mode: EditMode;
  languages: ("en" | "ar")[];
  /** Sent: only wording can change; structure controls are off. */
  locked: boolean;
  isAr: boolean;
};

/**
 * One question in the builder: its wording in both languages, its type's own
 * fields, and the controls to move, copy or remove it. Selecting it opens its
 * settings beside the list.
 */
export function QuestionCard(props: QuestionCardProps) {
  const { question, number, selected, onSelect, onPatch, mode, languages, locked, isAr } = props;
  const type = TYPE_META[question.type];
  const Editor = TYPE_EDITORS[question.type];
  const conditional = !!question.visibility?.conditions.length;

  return (
    <article
      {...props.dropProps}
      onFocusCapture={onSelect}
      onClick={onSelect}
      aria-label={isAr ? `السؤال ${number}` : `Question ${number}`}
      className={`flex flex-col gap-space-6 rounded-card bg-surface-1 p-space-8 transition-shadow ${selected ? "shadow-edge-primary" : "shadow-edge"}`}
    >
      <div className="flex items-center gap-space-4">
        <button
          type="button"
          {...props.dragProps}
          aria-label={isAr ? "اسحب لإعادة الترتيب" : "Drag to reorder"}
          disabled={locked}
          className="grid size-7 cursor-grab place-items-center rounded-md text-text-muted active:cursor-grabbing disabled:cursor-not-allowed disabled:text-text-disabled"
        >
          <Icon name="grip-vertical" size={16} />
        </button>
        <span className="text-caption font-medium tabular-nums text-text-muted">{number}</span>
        <span className="inline-flex items-center gap-space-2 text-caption text-text-muted">
          <Icon name={type.icon} size={16} />
          {type[isAr ? "ar" : "en"]}
        </span>
        {question.required && <Badge tone="accent">{isAr ? "مطلوب" : "Required"}</Badge>}
        {conditional && <Badge tone="info">{isAr ? "مشروط" : "Conditional"}</Badge>}
        <div className="ms-auto flex items-center gap-space-1">
          {/* Keyboard twins of dragging. */}
          <IconButton icon="angle-up" label={isAr ? "تحريك للأعلى" : "Move up"} disabled={locked || !props.canMoveUp} onClick={() => props.onMove(-1)} className="text-text-muted disabled:text-text-disabled" />
          <IconButton icon="angle-down" label={isAr ? "تحريك للأسفل" : "Move down"} disabled={locked || !props.canMoveDown} onClick={() => props.onMove(1)} className="text-text-muted disabled:text-text-disabled" />
          <IconButton icon="copy" label={isAr ? "تكرار السؤال" : "Duplicate question"} onClick={props.onDuplicate} className="text-text-muted" />
          <IconButton icon="trash" label={isAr ? "حذف السؤال" : "Delete question"} disabled={locked} onClick={props.onDelete} className="text-text-muted hover:text-danger disabled:text-text-disabled" />
        </div>
      </div>

      <LocalizedInput
        label={{ en: "Question", ar: "السؤال" }}
        value={question.title}
        onCommit={(title) => onPatch({ title })}
        mode={mode}
        languages={languages}
        isAr={isAr}
      />
      <LocalizedInput
        label={{ en: "Help text", ar: "نص توضيحي" }}
        value={question.help}
        onCommit={(help) => onPatch({ help })}
        mode={mode}
        languages={languages}
        placeholder={{ en: "What a good answer looks like (optional)", ar: "كيف تبدو الإجابة الجيدة (اختياري)" }}
        isAr={isAr}
      />
      <Editor question={question} onConfig={(config) => onPatch({ config })} mode={mode} languages={languages} locked={locked} isAr={isAr} />
    </article>
  );
}
