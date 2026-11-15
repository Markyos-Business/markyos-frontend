"use client";

import type { FormSchema } from "./form";
import { OverlayForm, type DialogFormProps } from "./dialog-form";

type AnySchema = FormSchema;
type DrawerFormProps<S extends AnySchema> = DialogFormProps<S>;

/**
 * DialogForm as a full-height drawer from the end edge (the left in Arabic):
 * a record's details beside the list it came from. Same guards: unsaved
 * changes ask before closing, the footer stays pinned while the fields scroll.
 */
function DrawerForm<S extends AnySchema>(props: DrawerFormProps<S>) {
  return <OverlayForm {...props} variant="sheet" />;
}

export { DrawerForm };
export type { DrawerFormProps };
