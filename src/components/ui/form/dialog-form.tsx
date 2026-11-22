"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { EXIT } from "@/lib/motion";
import type { ReactNode } from "react";
import { useFormContext, type DefaultValues, type FieldValues } from "react-hook-form";
import { useDialog } from "../overlay/dialog";
import { PopupPortal } from "../popup/popup-portal";
import { Modal, type ModalSize } from "../overlay/modal";
import { useToast } from "../overlay/toast";
import { useUiStrings } from "../ui-strings";
import { ErrorSummary } from "./error-summary";
import { Form, type FormProps, type FormSchema } from "./form";
import { FormActions, type FormActionsProps } from "./form-actions";
import { FormAlert } from "./form-alert";
import { useFormMeta } from "./form-context";

type Shell = {
  open: boolean;
  /** Closing for any reason; with unsaved changes it asks first. */
  onClose: () => void;
  /** The heading, or a control (an InlineEdit) with `label` as the accessible name. */
  title: ReactNode;
  label?: string;
  description?: ReactNode;
  /** sm 440 · md 580 · lg 720. Default sm. */
  size?: ModalSize;
  /** "Invite teammate", "Save details". */
  submitLabel: string;
  cancelLabel?: string;
  destructive?: FormActionsProps["destructive"];
  /** The toast after a save. Default "Changes saved."; false for none. */
  successToast?: string | false;
  children: ReactNode;
};

type AnySchema = FormSchema;
type DialogFormProps<S extends AnySchema> = Omit<FormProps<S>, "children" | "chrome" | "label" | "successMessage"> & Shell;

/** The modal's inside: it reads the Form (dirty, saving) to guard closing and reset on opening. */
const Body = ({ open, onClose, title, label, description, size, submitLabel, cancelLabel, destructive, children, variant, defaults }: Shell & { variant: "center" | "sheet"; defaults?: DefaultValues<FieldValues> }) => {
  const { t } = useUiStrings();
  const meta = useFormMeta();
  const { formState, reset } = useFormContext();
  // Read during render: react-hook-form only keeps isDirty current for
  // components that read it while rendering, not in a later handler.
  const dirty = formState.isDirty;
  const { confirm } = useDialog();
  const asking = useRef(false);
  const wasOpen = useRef(open);
  // Who opened it, caught before the modal moves focus inside (a layout
  // effect runs before the modal's own effect does).
  const opener = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (open && !wasOpen.current) opener.current = document.activeElement as HTMLElement | null;
  }, [open]);

  // Every opening starts from the starting values, with no old banner.
  useEffect(() => {
    if (open && !wasOpen.current) {
      meta.cancelEdit();
      reset(defaults);
    }
    wasOpen.current = open;
  }, [open, meta, reset, defaults]);

  const close = async () => {
    if (meta.submitting || asking.current) return;
    if (dirty) {
      asking.current = true;
      const leave = await confirm({ title: meta.strings.discardTitle, body: meta.strings.discardBody, confirmLabel: meta.strings.discard, cancelLabel: meta.strings.keepEditing, tone: "danger" });
      asking.current = false;
      if (!leave) return;
    }
    onClose();
    // A confirm that closes after the modal sends focus back to its own
    // opener (inside the modal, now gone); bring it back to ours.
    window.setTimeout(() => {
      const at = document.activeElement;
      if (!at || at === document.body || !document.contains(at)) opener.current?.focus();
    }, EXIT.slow + 50);
  };

  return (
    <Modal
      portal={false}
      busy={meta.submitting}
      open={open}
      title={title}
      label={label}
      description={description}
      size={size}
      variant={variant}
      onClose={() => void close()}
      footer={
        <div className="w-full">
          <FormActions submitLabel={submitLabel} cancelLabel={cancelLabel ?? t.cancel} onCancel={() => void close()} destructive={destructive} />
        </div>
      }
    >
      <FormAlert />
      <ErrorSummary />
      {children}
    </Modal>
  );
};

function OverlayForm<S extends AnySchema>({ open, onClose, title, label, description, size = "sm", submitLabel, cancelLabel, destructive, successToast, children, onSubmit, variant, ...form }: DialogFormProps<S> & { variant: "center" | "sheet" }) {
  const { t } = useUiStrings();
  const { showToast } = useToast();
  return (
    <PopupPortal><Form
      {...form}
      label={label ?? (typeof title === "string" ? title : undefined)}
      chrome={false}
      successMessage={false}
      onSubmit={async (values, methods) => {
        const refused = await onSubmit(values, methods);
        if (refused && (refused.form || refused.fields || refused.silent)) return refused;
        // Saved: say so where the person will look next, and close without asking.
        if (successToast !== false) showToast(successToast ?? t.form.saved, "success");
        onClose();
      }}
    >
      <Body open={open} onClose={onClose} title={title} label={label} description={description} size={size} submitLabel={submitLabel} cancelLabel={cancelLabel} destructive={destructive} variant={variant} defaults={form.defaultValues as DefaultValues<FieldValues>}>
        {children}
      </Body>
    </Form></PopupPortal>
  );
}

/**
 * A Form in a centred dialog: title, fields, and the actions pinned in the
 * footer. Focus starts on the first field and stays inside. Escape, the
 * scrim, × and Cancel all close it, and with unsaved changes ask "Discard
 * changes?" first. The banner and error summary show inside the dialog; a
 * save closes it with a toast; every opening starts from `defaultValues`.
 */
function DialogForm<S extends AnySchema>(props: DialogFormProps<S>) {
  return <OverlayForm {...props} variant="center" />;
}

export { DialogForm, OverlayForm };
export type { DialogFormProps };
