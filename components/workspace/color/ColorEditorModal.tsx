"use client";

import { FormEvent, useState } from "react";
import { Icon } from "@/components/Icon";
import { TextField } from "@/components/TextField";
import { PillButton } from "@/components/PillButton";
import { isValidHex } from "@/lib/utils";
import { useModalDismiss } from "@/lib/useModalDismiss";

export function ColorEditorModal({
  mode,
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
  const [hex, setHex] = useState(initialHex);
  const [error, setError] = useState<string | undefined>();

  const normalizedHex = hex.startsWith("#") ? hex : `#${hex}`;
  const previewValid = isValidHex(normalizedHex);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValidHex(normalizedHex)) {
      setError("Enter a valid hex color, like #0099FF.");
      return;
    }
    onSave({ name: name.trim() || "Untitled", hex: normalizedHex });
  }

  useModalDismiss(onCancel);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      style={{ background: "var(--scrim)" }}
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[380px] rounded-[20px] p-6 flex flex-col gap-4"
        style={{ background: "var(--canvas)", boxShadow: "0 0 0 1px var(--hairline-strong)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            {mode === "add" ? "Add color" : "Edit color"}
          </h2>
          <button type="button" onClick={onCancel} aria-label="Close" className="mk-icon-btn cursor-pointer">
            <Icon name="times" size={18} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        <div
          className="h-[88px] rounded-[14px]"
          style={{
            background: previewValid ? normalizedHex : "var(--surface-2)",
            boxShadow: "inset 0 0 0 1px var(--hairline-strong)",
          }}
        />

        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Accent"
          autoFocus
        />
        <TextField
          label="Hex"
          value={hex}
          onChange={(e) => {
            setHex(e.target.value);
            setError(undefined);
          }}
          placeholder="#0099FF"
          error={error}
        />

        {mode === "edit" && (
          <button
            type="button"
            onClick={onSetPrimary}
            disabled={isPrimary}
            className="h-10 rounded-full text-[12.5px] font-semibold cursor-pointer flex items-center justify-center gap-2 disabled:cursor-default"
            style={{
              background: isPrimary ? "var(--accent-soft)" : "var(--surface-2)",
              color: isPrimary ? "var(--accent)" : "var(--text)",
            }}
          >
            <Icon name={isPrimary ? "check-circle" : "palette"} size={13} />
            {isPrimary ? "This is the primary colour" : "Set as primary"}
          </button>
        )}

        {/* Says what deleting actually changes, instead of hiding the button
            and leaving the reason to be guessed at. */}
        {consequence && (
          <p className="text-[11.5px] leading-[1.55]" style={{ color: "var(--text-faint)" }}>
            {consequence}
          </p>
        )}

        <div className="flex items-center gap-2.5 mt-1">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="h-11 px-4 rounded-full text-[13px] font-semibold cursor-pointer me-auto"
              style={{ color: "var(--danger)" }}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="h-11 px-5 rounded-full text-[13px] font-semibold cursor-pointer"
            style={{ background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--hairline)" }}
          >
            Cancel
          </button>
          <PillButton type="submit" variant="primary" size="md">
            {mode === "add" ? "Add color" : "Save"}
          </PillButton>
        </div>
      </form>
    </div>
  );
}
