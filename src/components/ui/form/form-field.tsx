"use client";

import { useEffect } from "react";
import type { ReactElement } from "react";
import { useController, type ControllerRenderProps, type FieldPath, type FieldValues } from "react-hook-form";
import { useFormMeta } from "./form-context";

type FormFieldRender<V extends FieldValues, N extends FieldPath<V>> = {
  /** value, onChange, onBlur, name, ref (and disabled): spread onto the kit field. */
  field: ControllerRenderProps<V, N>;
  /** The id to give the field's control, so the error summary can link to it. */
  id: string;
  /** The field's message, client or server. */
  error?: string;
};

type FormFieldProps<V extends FieldValues, N extends FieldPath<V>> = {
  name: N;
  /** How the error summary names this field: "Workspace name". */
  label?: string;
  render: (props: FormFieldRender<V, N>) => ReactElement;
};

/**
 * One field bound to the Form: react-hook-form's Controller with the kit's
 * wiring. It hands the field its value and handlers, an id for the summary's
 * link, and its error message; and tells the summary the field's label.
 *
 *   <FormField name="name" label="Workspace name" render={({ field, id, error }) => (
 *     <InputField label="Workspace name" id={id} {...field} error={error} />
 *   )} />
 */
function FormField<V extends FieldValues = FieldValues, N extends FieldPath<V> = FieldPath<V>>({ name, label, render }: FormFieldProps<V, N>) {
  const meta = useFormMeta();
  const { field, fieldState } = useController<V, N>({ name });
  useEffect(() => {
    if (label) meta.labels.set(name, label);
  }, [meta.labels, name, label]);
  return render({ field, id: meta.fieldId(name), error: fieldState.error?.message });
}

export { FormField };
export type { FormFieldProps, FormFieldRender };
