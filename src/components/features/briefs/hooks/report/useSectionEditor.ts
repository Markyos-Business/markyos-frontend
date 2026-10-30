"use client";

import { useState } from "react";
import { useDialog, useToast } from "@/components/ui";
import { editSection, resetSection } from "../../services/briefsService";
import type { BriefAnalysis, Section, SectionKey } from "../../types";
import { setAt } from "../../utils/editor";
import type { Path } from "../../utils/editor";

/**
 * Editing one section at a time: a draft of its current content, saved as the
 * studio's version (the AI's stays, and Reset brings it back).
 */
export function useSectionEditor(analysis: BriefAnalysis, onSection: (s: Section) => void) {
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const [key, setKey] = useState<SectionKey | null>(null);
  const [draft, setDraft] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isAr = analysis.language === "ar";

  function start(section: Section) {
    setKey(section.key);
    setDraft(structuredClone(section.current ?? {}));
    setError(null);
  }

  function cancel() {
    setKey(null);
    setDraft(null);
    setError(null);
  }

  async function save() {
    if (!key) return;
    setSaving(true);
    setError(null);
    try {
      onSection(await editSection(analysis.id, key, draft));
      showToast(isAr ? "حُفظ القسم." : "Section saved.", "success");
      cancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  /** Throw the studio's edit away and go back to what the analysis wrote. */
  async function reset(section: Section) {
    const ok = await confirm({
      title: isAr ? "العودة إلى نسخة التحليل؟" : "Go back to the analysis's version?",
      body: isAr ? "تُحذف تعديلاتك على هذا القسم." : "Your edits to this section are thrown away.",
      confirmLabel: isAr ? "العودة" : "Go back",
      tone: "danger",
      isAr,
    });
    if (!ok) return;
    try {
      onSection(await resetSection(analysis.id, section.key));
      showToast(isAr ? "عاد القسم إلى نسخة التحليل." : "Back to the analysis's version.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err), "danger");
    }
  }

  return {
    editing: key,
    reset,
    draft,
    error,
    saving,
    start,
    cancel,
    save,
    set: (path: Path, value: unknown) => setDraft((d: unknown) => setAt(d, path, value)),
  };
}

export type SectionEditorState = ReturnType<typeof useSectionEditor>;
