"use client";

import { useState } from "react";
import { Button, FormDialog, Icon } from "@/components/ui";
import { ColorPicker, InputField } from "@/components/ui";
import { normalizeHex } from "@/lib/color";

/** A new swatch starts on a mid grey: a neutral place to move from. */
const NEW_SWATCH = "#808080";

/**
 * Adds or edits one brand colour: its name, and the colour itself chosen by
 * eye or typed in HEX, RGB, HSL or CMYK (the kit's picker). Editing also
 * offers "Set as primary" and "Delete", with what deleting will change.
 */
export function ColorEditorModal({
  mode,
  isAr,
  initialName,
  initialHex,
  isPrimary,
  consequence,
  onCancel,
  onSave,
  onDelete,
  onSetPrimary,
}: {
  mode: "add" | "edit";
  isAr: boolean;
  initialName: string;
  initialHex: string;
  /** Whether this swatch currently drives the guideline site's accent. */
  isPrimary?: boolean;
  /** What deleting this swatch will actually change, when it changes anything. */
  consequence?: string;
  onCancel: () => void;
  onSave: (data: { name: string; hex: string }) => void;
  onDelete?: () => void;
  onSetPrimary?: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [hex, setHex] = useState(normalizeHex(initialHex) ?? NEW_SWATCH);

  return (
    <FormDialog
      open
      title={mode === "add" ? (isAr ? "أضف لونًا" : "Add colour") : isAr ? "عدّل اللون" : "Edit colour"}
      submitLabel={mode === "add" ? (isAr ? "أضف اللون" : "Add colour") : isAr ? "حفظ" : "Save"}
      onClose={onCancel}
      onSubmit={() => onSave({ name: name.trim() || (isAr ? "بدون اسم" : "Untitled"), hex })}
    >
      <InputField
        label={isAr ? "الاسم" : "Name"}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={isAr ? "مثل: التمييز" : "e.g. Accent"}
        dir="auto"
      />
      <ColorPicker value={hex} onChange={setHex} />

      {mode === "edit" && (
        <div className="flex flex-col gap-space-3">
          <div className="flex flex-wrap items-center gap-space-3">
            <Button
              type="button"
              variant={isPrimary ? "ghost" : "outline"}
              size="sm"
              icon={<Icon name={isPrimary ? "check-circle" : "palette"} size={18} />}
              onClick={onSetPrimary}
              disabled={isPrimary}
            >
              {isPrimary ? (isAr ? "هذا هو اللون الأساسي" : "This is the primary colour") : isAr ? "اجعله أساسيًا" : "Set as primary"}
            </Button>
            {onDelete && (
              <Button type="button" variant="danger-soft" size="sm" icon={<Icon name="trash" size={18} />} onClick={onDelete} className="ms-auto">
                {isAr ? "احذف" : "Delete"}
              </Button>
            )}
          </div>
          {/* Says what deleting actually changes, instead of hiding the
              button and leaving the reason to be guessed at. */}
          {consequence && <p className="text-caption text-text-faint">{consequence}</p>}
        </div>
      )}
    </FormDialog>
  );
}
