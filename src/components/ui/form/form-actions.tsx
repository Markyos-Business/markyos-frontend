"use client";

import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "../button/button";
import { Icon } from "../icon";
import { useFormMeta } from "./form-context";

type FormActionsProps = {
  /** The primary action, verb first: "Save changes", "Create campaign". Default "Save changes". */
  submitLabel?: string;
  /** Wait for a change before saving: an edit form. Default false (a new record). */
  requireChanges?: boolean;
  /** The secondary action. Without `onCancel`, a form that started in view mode goes back to it. */
  cancelLabel?: string;
  onCancel?: () => void;
  /** A destructive action on the start side, apart from the rest: "Delete workspace". */
  destructive?: { label: string; onClick: () => void; icon?: string };
  /** Where the primary and secondary sit. Default end. */
  align?: "start" | "end";
  /** Stick to the bottom of the scrolling area, over a hairline. */
  sticky?: boolean;
  /** More buttons, after the secondary. */
  children?: ReactNode;
};

/**
 * A form's buttons: the primary (submit) first, then the secondary, with a
 * destructive one held apart at the start. The primary spins while saving
 * and waits for a change when `requireChanges`. Hidden in view mode, where
 * the Form's Edit button is the action.
 */
const FormActions = ({ submitLabel, requireChanges = false, cancelLabel, onCancel, destructive, align = "end", sticky = false, children }: FormActionsProps) => {
  const meta = useFormMeta();
  const { formState } = useFormContext();
  if (meta.view || meta.locked) return null;
  const cancel = onCancel ?? (meta.view === false && cancelLabel ? meta.cancelEdit : undefined);

  return (
    <div className={`flex flex-wrap items-center gap-space-3 ${sticky ? "sticky bottom-0 z-sticky -mx-space-2 bg-surface-1 px-space-2 py-space-5 shadow-rule-t" : ""}`}>
      {destructive && (
        <Button type="button" variant="danger-soft" icon={destructive.icon ? <Icon name={destructive.icon} size={18} /> : undefined} onClick={destructive.onClick}>
          {destructive.label}
        </Button>
      )}
      <div className={`flex flex-wrap items-center gap-space-3 ${align === "end" ? "ms-auto" : destructive ? "ms-space-8" : ""}`}>
        <Button type="submit" variant="primary" loading={meta.submitting} loadingText={meta.strings.submitting} disabled={meta.submitting || (requireChanges && !formState.isDirty)}>
          {submitLabel ?? meta.strings.saveChanges}
        </Button>
        {cancel && (
          <Button type="button" variant="outline" onClick={cancel}>
            {cancelLabel}
          </Button>
        )}
        {children}
      </div>
    </div>
  );
};

export { FormActions };
export type { FormActionsProps };
