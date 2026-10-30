"use client";

import { AlertBanner, Button, Icon, IconButton } from "@/components/ui";
import { InputField, SelectField, TextareaField } from "@/components/form";
import { FIELD_CHOICES, FIELD_LABELS } from "../../constants";
import type { SectionEditorState } from "../../hooks/report/useSectionEditor";
import { blankLike, isChoice, isScale, shownKeys } from "../../utils/editor";
import type { Path } from "../../utils/editor";

// One line is enough for these; everything else gets room to write.
const SHORT = new Set(["name", "label", "trait", "routeName", "city", "ageRange", "job", "left", "right", "client", "projectType"]);

type FieldProps = { name: string; value: unknown; path: Path; isAr: boolean; set: SectionEditorState["set"] };

const labelOf = (name: string, isAr: boolean) => FIELD_LABELS[name]?.[isAr ? "ar" : "en"] ?? name;

/** One field of the draft, by its kind: text, a choice, a score, a list, or a group. */
function Field({ name, value, path, isAr, set }: FieldProps) {
  const label = labelOf(name, isAr);
  const t = (en: string, ar: string) => (isAr ? ar : en);

  if (isChoice(name) && typeof value === "string") {
    return (
      <SelectField
        label={label}
        value={value}
        onChange={(e) => set(path, e.target.value)}
        options={Object.entries(FIELD_CHOICES[name]).map(([v, l]) => ({ value: v, label: isAr ? l.ar : l.en }))}
      />
    );
  }
  if (isScale(name, value)) {
    return (
      <SelectField
        label={label}
        value={String(value)}
        onChange={(e) => set(path, Number(e.target.value))}
        options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))}
      />
    );
  }
  if (typeof value === "string" || value === null) {
    const text = value ?? "";
    return SHORT.has(name) ? (
      <InputField label={label} dir="auto" value={text} onChange={(e) => set(path, e.target.value)} />
    ) : (
      <TextareaField label={label} dir="auto" rows={2} value={text} onChange={(e) => set(path, e.target.value)} />
    );
  }
  if (Array.isArray(value)) {
    const objects = value.length > 0 && typeof value[0] === "object";
    return (
      <fieldset className="flex flex-col gap-space-4">
        <legend className="mb-space-3 text-caption font-medium text-text-muted">{label}</legend>
        {value.map((item, i) =>
          objects ? (
            <div key={i} className="flex flex-col gap-space-4 rounded-widget bg-surface-2 p-space-6">
              <div className="flex justify-end">
                <IconButton icon="times" iconSize={16} label={t(`Remove ${label} ${i + 1}`, `حذف ${label} ${i + 1}`)} onClick={() => set(path, value.filter((_, j) => j !== i))} />
              </div>
              <Group value={item} path={[...path, i]} isAr={isAr} set={set} />
            </div>
          ) : (
            <div key={i} className="flex items-end gap-space-3">
              <div className="flex-1">
                <InputField label={`${label} ${i + 1}`} dir="auto" value={String(item ?? "")} onChange={(e) => set([...path, i], e.target.value)} />
              </div>
              <IconButton icon="times" iconSize={16} label={t(`Remove ${label} ${i + 1}`, `حذف ${label} ${i + 1}`)} onClick={() => set(path, value.filter((_, j) => j !== i))} />
            </div>
          )
        )}
        {/* A new item copies the shape of the first; an empty list of strings just takes a line. */}
        {(value.length > 0 || !objects) && (
          <Button
            type="button"
            variant="link"
            className="self-start"
            icon={<Icon name="plus" size={16} />}
            onClick={() => set(path, [...value, value.length ? blankLike(value[0]) : ""])}
          >
            {t(`Add to ${label}`, `إضافة إلى ${label}`)}
          </Button>
        )}
      </fieldset>
    );
  }
  if (value && typeof value === "object") {
    return (
      <fieldset className="flex flex-col gap-space-4">
        <legend className="mb-space-3 text-caption font-medium text-text-muted">{label}</legend>
        <Group value={value} path={path} isAr={isAr} set={set} />
      </fieldset>
    );
  }
  return null;
}

function Group({ value, path, isAr, set }: Omit<FieldProps, "name">) {
  const obj = value as Record<string, unknown>;
  return (
    <>
      {shownKeys(obj).map((k) => (
        <Field key={k} name={k} value={obj[k]} path={[...path, k]} isAr={isAr} set={set} />
      ))}
    </>
  );
}

/** The open section's draft, field by field, with Save and Cancel. */
export function SectionEditor({ editor, isAr }: { editor: SectionEditorState; isAr: boolean }) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  return (
    <form
      className="flex flex-col gap-space-6"
      onSubmit={(e) => {
        e.preventDefault();
        void editor.save();
      }}
    >
      <AlertBanner message={editor.error} />
      <Group value={editor.draft} path={[]} isAr={isAr} set={editor.set} />
      <div className="flex gap-space-4">
        <Button type="submit" variant="primary" size="sm" disabled={editor.saving}>
          {editor.saving ? t("Saving…", "جارٍ الحفظ…") : t("Save section", "حفظ القسم")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={editor.cancel} disabled={editor.saving}>
          {t("Cancel", "إلغاء")}
        </Button>
      </div>
    </form>
  );
}
