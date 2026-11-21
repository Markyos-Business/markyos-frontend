"use client";

import { useState } from "react";
import { FormDialog, InputField, SelectField, TextareaField } from "@/components/ui";
import { LabelledChoice } from "../shared/labelled-choice";
import { saveHelpCategory } from "../../api/help.api";
import { CATEGORY_ICONS } from "../../copy";
import { useHelpCopy } from "../../hooks/use-help-copy";
import type { HelpCategory, HelpCategoryInput, HelpCategoryStatus, HelpVisibility } from "../../types";
import { categoryError } from "./category-error";

type CategoryDialogProps = {
  /** An existing category, or the starting values of a new one (e.g. its parent). */
  category: HelpCategoryInput;
  all: HelpCategory[];
  onClose: () => void;
  onSaved: () => void;
};

const toSlug = (text: string) => text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Add or edit a category: titles, slugs and descriptions per language, icon, parent, visibility, status. */
export function CategoryDialog({ category, all, onClose, onSaved }: CategoryDialogProps) {
  const { h, lang } = useHelpCopy();
  const t = h.categories;
  const editing = category.id !== undefined;
  const [draft, setDraft] = useState<HelpCategoryInput>({ visibility: "public", status: "active", parent: null, icon: "", ...category });
  const set = (patch: HelpCategoryInput) => setDraft((d) => ({ ...d, ...patch }));
  const hasChildren = editing && all.some((c) => c.parent === category.id);
  // Only top-level categories can be parents, and never the category itself.
  const parents = all.filter((c) => c.parent === null && c.id !== category.id);
  const name = (c: HelpCategory) => (lang === "ar" ? c.titleAr || c.titleEn : c.titleEn || c.titleAr) || t.untitled;

  return (
    <FormDialog
      open
      title={editing ? t.form.editTitle : category.parent ? t.form.addSubTitle : t.form.addTitle}
      submitLabel={t.form.save}
      onClose={onClose}
      onSubmit={async () => {
        try {
          // A new English title gets a slug from it unless one was typed.
          const slugEn = draft.slugEn || (draft.titleEn ? toSlug(draft.titleEn) : null);
          await saveHelpCategory({ ...draft, slugEn: slugEn || null, slugAr: draft.slugAr || null });
          onSaved();
        } catch (e: unknown) {
          return categoryError(e, h, lang);
        }
      }}
    >
      <InputField label={t.form.titleEn} value={draft.titleEn ?? ""} dir="ltr" maxLength={120} onChange={(e) => set({ titleEn: e.target.value })} />
      <InputField label={t.form.titleAr} value={draft.titleAr ?? ""} dir="rtl" maxLength={120} onChange={(e) => set({ titleAr: e.target.value })} />
      <InputField label={t.form.slugEn} hint={t.form.slugHint} value={draft.slugEn ?? ""} dir="ltr" maxLength={80} onChange={(e) => set({ slugEn: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} />
      <InputField label={t.form.slugAr} value={draft.slugAr ?? ""} dir="rtl" maxLength={80} onChange={(e) => set({ slugAr: e.target.value.replace(/\s+/g, "-") })} />
      <TextareaField label={t.form.descriptionEn} value={draft.descriptionEn ?? ""} dir="ltr" maxLength={300} rows={2} onChange={(e) => set({ descriptionEn: e.target.value })} />
      <TextareaField label={t.form.descriptionAr} value={draft.descriptionAr ?? ""} dir="rtl" maxLength={300} rows={2} onChange={(e) => set({ descriptionAr: e.target.value })} />
      <SelectField
        label={t.form.icon}
        value={draft.icon ?? ""}
        onChange={(icon) => set({ icon })}
        options={[{ value: "", label: t.form.iconNone }, ...CATEGORY_ICONS.map((icon) => ({ value: icon, label: icon, icon }))]}
      />
      <SelectField
        label={t.form.parent}
        hint={hasChildren ? t.form.parentLocked : undefined}
        disabled={hasChildren}
        value={draft.parent ? String(draft.parent) : ""}
        onChange={(value) => set({ parent: value ? Number(value) : null })}
        options={[{ value: "", label: t.form.parentNone }, ...parents.map((c) => ({ value: String(c.id), label: name(c) }))]}
      />
      <LabelledChoice<HelpVisibility>
        label={t.form.visibility}
        value={draft.visibility ?? "public"}
        onChange={(visibility) => set({ visibility })}
        options={[{ value: "public", label: t.visibility.public }, { value: "signed_in", label: t.visibility.signed_in }]}
      />
      <LabelledChoice<HelpCategoryStatus>
        label={t.form.status}
        value={draft.status ?? "active"}
        onChange={(status) => set({ status })}
        options={[{ value: "active", label: t.status.active }, { value: "hidden", label: t.status.hidden }]}
      />
    </FormDialog>
  );
}
