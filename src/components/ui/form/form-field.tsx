"use client";

import { useEffect } from "react";
import type { ReactElement } from "react";
import { get, useController, useFormState, type ControllerRenderProps, type FieldError, type FieldErrors, type FieldPath, type FieldValues } from "react-hook-form";
import { useFormMeta } from "./form-context";

type FormFieldRender<V extends FieldValues, N extends FieldPath<V>> = {
  /** value, onChange, onBlur, name, ref (and disabled): spread onto the kit field. */
  field: ControllerRenderProps<V, N>;
  /** The id to give the field's control, so the error summary can link to it. */
  id: string;
  /** The field's message, client or server. */
  error?: string;
  /**
   * The errors under an object value, by key: a bilingual name's
   * `errors.en?.message` and `errors.ar?.message`.
   */
  errors?: Record<string, FieldError | undefined>;
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
  const { field } = useController<V, N>({ name });
  // Not the controller's own field state: that only re-renders for this exact
  // path, so an error on "title.en" would never show on a "title" field.
  const { errors: all } = useFormState<V>({ name });
  const own = get(all as FieldErrors, name) as (FieldError & Record<string, FieldError | undefined>) | undefined;
  useEffect(() => {
    if (label) meta.labels.set(name, label);
  }, [meta.labels, name, label]);
  return render({ field, id: meta.fieldId(name), error: own?.message, errors: own && typeof own === "object" ? own : undefined });
}

export { FormField };
export type { FormFieldProps, FormFieldRender };
