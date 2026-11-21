"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FormEvent, ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FormProvider,
  useForm,
  type DefaultValues,
  type FieldValues,
  type Mode,
  type Path,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form";
import type { z } from "zod";
import { Button } from "../button/button";
import { Icon } from "../icon";
import { useUiStrings } from "../ui-strings";
import { ErrorSummary } from "./error-summary";
import { FormAlert } from "./form-alert";
import {
  FormMetaContext,
  type FormMeta,
  type FormOutcome,
  type FormStrings,
} from "./form-context";

/** What the server said was wrong: a line for the whole form, and/or messages by field path. */
type ServerErrors<V extends FieldValues = FieldValues> = {
  form?: string;
  fields?: Partial<Record<Path<V>, string>>;
  /** Not saved, and something else already says why (a conflict alert): no banner, no reset. */
  silent?: boolean;
};

/**
 * Puts the server's errors on a form: each field message under its field (as
 * a "server" error, cleared when the field changes) and the form's line in
 * the banner at the top. Returns the first field path, to focus.
 */
function setServerErrors<V extends FieldValues>(
  form: UseFormReturn<V, unknown, FieldValues>,
  errors: ServerErrors<V>,
): Path<V> | undefined {
  const entries = Object.entries(errors.fields ?? {}) as [Path<V>, string][];
  for (const [name, message] of entries)
    form.setError(name, { type: "server", message });
  return entries[0]?.[0];
}

type AnySchema = z.ZodType<FieldValues, FieldValues>;
type Input<S extends AnySchema> = z.input<S>;
type Output<S extends AnySchema> = z.output<S>;
type FormMethods<S extends AnySchema> = UseFormReturn<
  Input<S>,
  unknown,
  Output<S>
>;

type FormProps<S extends AnySchema> = {
  schema: S;
  defaultValues?: DefaultValues<Input<S>>;
  /** Loaded data: replaces the values (and the clean baseline) when it changes. */
  values?: Input<S>;
  /**
   * Gets the parsed values. Return nothing for success, or `{ form, fields }`
   * for what the server refused; a throw shows the generic "Couldn't save".
   */
  onSubmit: (
    values: Output<S>,
    form: FormMethods<S>,
  ) => Promise<ServerErrors<Input<S>> | void> | ServerErrors<Input<S>> | void;
  /** When fields check themselves. Default: on submit, then on every change. */
  mode?: Mode;
  /** The form's accessible name ("Workspace settings"), or `labelledBy` a heading's id. */
  label?: string;
  labelledBy?: string;
  /** Start in view mode: every field shows as its value, with an Edit button. */
  readOnly?: boolean;
  /** Offer Edit in view mode. Default true. */
  editable?: boolean;
  /** Nothing can change; `lockedReason` is shown at the top. */
  locked?: boolean;
  lockedReason?: string;
  /** The banner after a save. Default "Changes saved."; false for none (a toast instead). */
  successMessage?: string | false;
  /** The error summary at the top after a failed submit. Default true. */
  summary?: boolean;
  /**
   * Draw the form's own top parts (locked note, Edit, outcome banner, error
   * summary). Default true; false when a shell places them itself, as
   * DialogForm does inside its modal.
   */
  chrome?: boolean;
  id?: string;
  className?: string;
  labels?: Partial<FormStrings>;
  children: ReactNode | ((form: FormMethods<S>) => ReactNode);
};

/**
 * A form: react-hook-form with a zod schema, typed from the schema.
 *
 * Submitting validates first. If anything's wrong, the error summary appears
 * at the top (announced) and focus moves to the first field with an error.
 * While `onSubmit` runs the form is aria-busy and its fields are disabled
 * (one fieldset), the submit button spins, and focus comes back afterwards.
 * What the server refuses comes back as `{ form, fields }`: the form's line
 * in a banner, each field's under it, the values kept. A save resets the
 * clean baseline, so the form is pristine again, and shows "Changes saved."
 *
 * `readOnly` starts it as a page of values with an Edit button; Cancel goes
 * back, and a save returns to view. `locked` shows the reason and changes
 * nothing. Parts inside (FormActions, StickySaveBar, ErrorSummary, FormField)
 * read all of this from context.
 */
function Form<S extends AnySchema>({
  schema,
  defaultValues,
  values,
  onSubmit,
  mode = "onSubmit",
  label,
  labelledBy,
  readOnly = false,
  editable = true,
  locked = false,
  lockedReason,
  successMessage,
  summary = true,
  chrome = true,
  id: givenId,
  className = "",
  labels,
  children,
}: FormProps<S>) {
  const { t } = useUiStrings();
  const strings = useMemo(() => ({ ...t.form, ...labels }), [t, labels]);
  const reactId = useId();
  const id = givenId ?? `form-${reactId.replace(/:/g, "")}`;
  const form = useForm<Input<S>, unknown, Output<S>>({
    resolver: zodResolver(schema) as unknown as Resolver<
      Input<S>,
      unknown,
      Output<S>
    >,
    defaultValues,
    values,
    mode,
    reValidateMode: "onChange",
    shouldFocusError: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState(readOnly);
  const [outcome, setOutcome] = useState<FormOutcome>({ kind: "idle" });
  const [summaryOpen, setSummaryOpen] = useState(false);
  // Filled by FormField as fields mount; one Map for the form's life.
  const [fieldLabels] = useState(() => new Map<string, string>());
  // A field to focus once the fieldset is enabled again (after a server error).
  const focusNext = useRef<string | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (submitting) return;
    if (focusNext.current) {
      form.setFocus(focusNext.current as Path<Input<S>>);
      focusNext.current = null;
    } else if (
      returnFocus.current &&
      document.activeElement === document.body
    ) {
      returnFocus.current.focus();
    }
    returnFocus.current = null;
  }, [submitting, form]);

  // Built in the submit event, not in render: its handlers touch refs.
  const submit = (e: FormEvent<HTMLFormElement>) =>
    form.handleSubmit(
      async (parsed) => {
        setSummaryOpen(false);
        setOutcome({ kind: "idle" });
        returnFocus.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        setSubmitting(true);
        try {
          const refused = await onSubmit(parsed, form);
          if (refused && (refused.form || refused.fields || refused.silent)) {
            const first = setServerErrors(
              form as UseFormReturn<Input<S>, unknown, FieldValues>,
              refused,
            );
            setOutcome({ kind: "error", message: refused.form ?? undefined });
            if (first) {
              setSummaryOpen(true);
              focusNext.current = first;
            }
            return;
          }
          // The saved values are the new clean state.
          form.reset(form.getValues());
          setOutcome(
            successMessage === false
              ? { kind: "idle" }
              : { kind: "success", message: successMessage ?? strings.saved },
          );
          if (readOnly) setView(true);
        } catch {
          setOutcome({ kind: "error", message: strings.serverError });
        } finally {
          setSubmitting(false);
        }
      },
      () => {
        setOutcome({ kind: "idle" });
        setSummaryOpen(true);
      },
    )(e);

  const fieldId = useCallback(
    (name: string) => `${id}-${name.replace(/[^\w-]/g, "-")}`,
    [id],
  );

  // Straight from the schema rather than react-hook-form's trigger, which
  // drops the errors of any field that re-renders while it validates.
  const validate = useCallback(
    async (paths: readonly string[]) => {
      const owns = (owner: string, path: string) => path === owner || path.startsWith(`${owner}.`);
      const result = await schema.safeParseAsync(form.getValues());
      const issues = result.success ? [] : result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })).filter((i) => paths.some((p) => owns(p, i.path)));
      form.clearErrors(paths as Path<Input<S>>[]);
      const seen = new Set<string>();
      for (const issue of issues) {
        if (seen.has(issue.path)) continue;
        seen.add(issue.path);
        form.setError(issue.path as Path<Input<S>>, { type: "schema", message: issue.message });
      }
      return issues.length === 0;
    },
    [schema, form],
  );
  const meta: FormMeta = {
    id,
    submitting,
    view,
    locked,
    lockedReason,
    outcome,
    summaryOpen,
    labels: fieldLabels,
    fieldId,
    validate,
    startEdit: () => {
      setOutcome({ kind: "idle" });
      setView(false);
    },
    cancelEdit: () => {
      form.reset();
      setSummaryOpen(false);
      setOutcome({ kind: "idle" });
      if (readOnly) setView(true);
    },
    strings,
  };

  return (
    <FormProvider {...form}>
      <FormMetaContext.Provider value={meta}>
        <form
          id={id}
          noValidate
          aria-label={labelledBy ? undefined : label}
          aria-labelledby={labelledBy}
          aria-busy={submitting || undefined}
          onSubmit={(e) => {
            // A form inside a dialog inside a form submits only itself.
            e.stopPropagation();
            void submit(e);
          }}
          className={`flex min-w-0 flex-col gap-form-section ${className}`}
        >
          {chrome && locked && (
            <FormAlert tone="info" message={lockedReason ?? strings.locked} />
          )}
          {chrome && view && editable && !locked && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Icon name="pen" size={16} />}
                onClick={meta.startEdit}
              >
                {strings.edit}
              </Button>
            </div>
          )}
          {chrome && !locked && <FormAlert />}
          {chrome && summary && <ErrorSummary />}
          <fieldset
            disabled={submitting || view || locked}
            data-form-view={view || locked || undefined}
            className="m-0 flex min-w-0 flex-col gap-form-section border-0 p-0"
          >
            {typeof children === "function" ? children(form) : children}
          </fieldset>
        </form>
      </FormMetaContext.Provider>
    </FormProvider>
  );
}

export { Form, setServerErrors };
export type { AnySchema as FormSchema, FormMethods, FormProps, ServerErrors };
