"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { useFormContext, type FieldValues, type Path } from "react-hook-form";
import { Button } from "../../button/button";
import { Icon } from "../../icon";
import { StepperTabs } from "../../tabs/stepper-tabs";
import { flattenErrors } from "../error-summary";
import { useFormMeta, type FormStrings } from "../form-context";
import { WizardContext, owns, type WizardStep } from "./wizard-context";

type FormWizardStep = WizardStep & { content: ReactNode };

type FormWizardProps = {
  steps: readonly FormWizardStep[];
  /** Steps in order, each checked before the next opens (default); false lets any step open. */
  linear?: boolean;
  /** The last step's action, verb first: "Create campaign". */
  submitLabel: string;
  /** Keep the answers and the step in this browser between visits, cleared once submitted. */
  storageKey?: string;
  /** The stepper's name. Default "Steps". */
  label?: string;
  labels?: Partial<FormStrings>;
};

type Saved = { values: FieldValues; active: string; done: string[] };

const read = (key: string): Saved | null => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
};
const write = (key: string, saved: Saved | null) => {
  try {
    if (saved) window.localStorage.setItem(key, JSON.stringify(saved));
    else window.localStorage.removeItem(key);
  } catch {
    // No storage (a private window): the wizard works, it just doesn't remember.
  }
};

/**
 * A long form in steps, inside a Form: the stepper on top, one step at a
 * time, Back · Skip · Next below and the submit on the last step.
 *
 * Next checks only the step's own `fields` (with the Form's one schema) and
 * focuses the first problem; a stepper click forward checks every step it
 * passes. Linear wizards keep later steps closed until the earlier ones
 * pass; free ones open any step. Enter in a field moves to the next step
 * rather than submitting the whole form. After a submit that fails, the
 * wizard opens the first step with an error, and the error summary's links
 * open theirs. With `storageKey` the answers and the step survive a reload,
 * until the form is sent. Each step change moves focus to the step and is
 * announced ("Step 2 of 4: Budget and team").
 */
const FormWizard = ({ steps, linear = true, submitLabel, storageKey, label, labels }: FormWizardProps) => {
  const meta = useFormMeta();
  const s = useMemo(() => ({ ...meta.strings, ...labels }), [meta.strings, labels]);
  // The methods, not the context object: that object is new on every render,
  // and an effect watching it would run (and save, and restore) every time.
  const { clearErrors, reset, getValues, watch, setFocus, formState } = useFormContext();
  // After a step fails its check, its fields re-check as they're edited, so
  // each error clears the moment it's fixed (and a new one shows as typed).
  const [recheck, setRecheck] = useState<readonly string[] | null>(null);
  const [active, setActive] = useState(steps[0]?.id ?? "");
  const [done, setDone] = useState<ReadonlySet<string>>(new Set());
  const [restored, setRestored] = useState(false);
  const panels = useRef<Record<string, HTMLDivElement | null>>({});
  const focusStep = useRef(false);
  const index = Math.max(0, steps.findIndex((st) => st.id === active));
  const step = steps[index];
  const last = index === steps.length - 1;

  const paths = flattenErrors(formState.errors).map((e) => e.path);
  const formStateRef = useRef(formState);
  useEffect(() => {
    formStateRef.current = formState;
  });
  const stepOf = useCallback((path: string) => steps.find((st) => st.fields?.some((f) => owns(f, path))), [steps]);

  /** The first field with an error in a step: by the form library, else the first invalid control shown. */
  const focusFirstError = (stepId: string) =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const panel = panels.current[stepId];
        const owner = steps.find((st) => st.id === stepId);
        const first = flattenErrors(formStateRef.current.errors).find((e) => owner?.fields?.some((f) => owns(f, e.path)));
        const before = document.activeElement;
        if (first) setFocus(first.path as Path<FieldValues>);
        if (document.activeElement === before) panel?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      }),
    );

  const show = useCallback((id: string) => {
    focusStep.current = true;
    setActive(id);
  }, []);

  // A new step takes focus, so a screen reader starts reading it; a frame
  // later, once the tabs have shown its panel.
  useEffect(() => {
    if (!focusStep.current) return;
    focusStep.current = false;
    const frame = requestAnimationFrame(() => panels.current[active]?.focus({ preventScroll: false }));
    return () => cancelAnimationFrame(frame);
  }, [active]);

  useEffect(() => {
    if (!recheck) return;
    const sub = watch((_values, { name }) => {
      const owner = name && recheck.find((f) => owns(f, name));
      if (owner) void meta.validate([owner]);
    });
    return () => sub.unsubscribe();
  }, [recheck, watch, meta]);

  /** Check every step from the current one up to (not including) `id`; stops on the first that fails. */
  const reach = useCallback(
    async (id: string) => {
      const to = steps.findIndex((st) => st.id === id);
      for (let i = index; i < to; i++) {
        const st = steps[i];
        const ok = !st.fields?.length || (await meta.validate(st.fields));
        if (!ok) {
          if (st.id !== active) setActive(st.id);
          setRecheck(st.fields ?? null);
          focusFirstError(st.id);
          return false;
        }
        setDone((d) => new Set(d).add(st.id));
      }
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focusFirstError reads refs only
    [steps, index, meta, active],
  );

  const goTo = useCallback(
    async (id: string) => {
      if (!(await reach(id))) return false;
      setRecheck(null);
      show(id);
      return true;
    },
    [reach, show],
  );

  // Answers and step from an earlier visit, once, after mount (storage isn't
  // there on the server). Once: after that, the saved draft is our own.
  const restoreChecked = useRef(false);
  useEffect(() => {
    if (!storageKey || restoreChecked.current) return;
    restoreChecked.current = true;
    const saved = read(storageKey);
    if (!saved) return;
    reset(saved.values);
    // A one-time sync from browser storage, which the first render can't read.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(saved.active);
    setDone(new Set(saved.done));
    setRestored(true);
  }, [storageKey, reset]);

  // …and kept as they change, until the form is sent.
  // The Form's outcome, not isSubmitSuccessful: the Form resets after a save,
  // which turns that flag back off.
  const sent = meta.outcome.kind === "success";
  const dirty = formState.isDirty;
  useEffect(() => {
    if (!storageKey || !restoreChecked.current) return;
    if (sent) return write(storageKey, null);
    // Only once something has changed: an untouched form isn't a draft.
    if (dirty || done.size) write(storageKey, { values: getValues(), active, done: [...done] });
    const sub = watch((values) => write(storageKey, { values, active, done: [...done] }));
    return () => sub.unsubscribe();
  }, [storageKey, getValues, watch, active, done, sent, dirty]);

  // A failed submit opens the first step with an error.
  const submits = formState.submitCount;
  const firstBad = paths.map(stepOf).find(Boolean)?.id;
  const [seenSubmits, setSeenSubmits] = useState(submits);
  if (submits !== seenSubmits) {
    setSeenSubmits(submits);
    if (firstBad && firstBad !== active) setActive(firstBad);
  }

  // The error summary's links ask for their field's step first.
  useEffect(() => {
    const onFocusField = (e: Event) => {
      const { form: formId, path } = (e as CustomEvent<{ form: string; path: string }>).detail;
      const owner = formId === meta.id ? stepOf(path) : undefined;
      if (owner && owner.id !== active) setActive(owner.id);
    };
    document.addEventListener("mk-form-focus-field", onFocusField);
    return () => document.removeEventListener("mk-form-focus-field", onFocusField);
  }, [meta.id, stepOf, active]);

  // Enter in a field means "next step" until the last one, where it submits.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    if (e.key !== "Enter" || last || e.defaultPrevented || el.tagName !== "INPUT" || el.getAttribute("role") === "combobox") return;
    e.preventDefault();
    void goTo(steps[index + 1].id);
  };

  const tabs = steps.map((st) => ({
    id: st.id,
    label: st.title,
    completed: done.has(st.id) && !paths.some((p) => st.fields?.some((f) => owns(f, p))),
    error: paths.some((p) => st.fields?.some((f) => owns(f, p))),
    content: (
      <div
        ref={(el) => {
          panels.current[st.id] = el;
        }}
        tabIndex={-1}
        aria-label={s.stepOf(steps.indexOf(st) + 1, steps.length, st.title)}
        className="flex flex-col gap-space-8 pt-space-6 outline-none"
      >
        {st.content}
      </div>
    ),
  }));

  return (
    <WizardContext.Provider value={{ steps, active, goTo }}>
      <div className="flex flex-col gap-space-6" onKeyDown={onKeyDown}>
        {restored && <p className="text-caption text-text-muted">{s.draftRestored}</p>}
        <StepperTabs
          steps={tabs}
          label={label ?? s.steps}
          linear={linear}
          keepMounted
          value={active}
          onValueChange={show}
          onBeforeChange={(next) => reach(next)}
        />
        <p aria-live="polite" className="text-caption text-text-muted">
          {s.stepOf(index + 1, steps.length, step?.title ?? "")}
        </p>
        <div className="flex flex-wrap items-center gap-space-3">
          {index > 0 && (
            <Button type="button" variant="outline" icon={<Icon name="angle-left" size={18} />} onClick={() => show(steps[index - 1].id)}>
              {s.back}
            </Button>
          )}
          <div className="ms-auto flex flex-wrap items-center gap-space-3">
            {step?.optional && !last && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (step.fields?.length) clearErrors(step.fields as Path<FieldValues>[]);
                  show(steps[index + 1].id);
                }}
              >
                {s.skip}
              </Button>
            )}
            {last ? (
              <Button type="submit" variant="primary" loading={meta.submitting} loadingText={s.submitting}>
                {submitLabel}
              </Button>
            ) : (
              <Button type="button" variant="primary" iconEnd={<Icon name="angle-right" size={18} />} onClick={() => void goTo(steps[index + 1].id)}>
                {s.next}
              </Button>
            )}
          </div>
        </div>
      </div>
    </WizardContext.Provider>
  );
};

export { FormWizard };
export type { FormWizardProps, FormWizardStep };
