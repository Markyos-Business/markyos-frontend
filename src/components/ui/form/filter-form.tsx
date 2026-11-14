"use client";

import { Suspense, useEffect, useId, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFormContext, type DefaultValues } from "react-hook-form";
import type { z } from "zod";
import { Badge } from "../badge/badge";
import { Button } from "../button/button";
import { Icon } from "../icon";
import { useUiStrings } from "../ui-strings";
import { Form, type FormSchema } from "./form";

type Value = string | number | boolean | string[];
type Filters = Record<string, Value>;

const same = (a: Value | undefined, b: Value | undefined) => (Array.isArray(a) || Array.isArray(b) ? JSON.stringify(a ?? []) === JSON.stringify(b ?? []) : a === b);

/** Only what differs from the defaults goes in the URL: arrays comma-joined, booleans 1/0. */
function toParams(values: Filters, defaults: Filters, base: URLSearchParams) {
  const params = new URLSearchParams(base);
  for (const key of Object.keys(defaults)) {
    const v = values[key];
    params.delete(key);
    if (same(v, defaults[key]) || v === "" || (Array.isArray(v) && !v.length)) continue;
    params.set(key, Array.isArray(v) ? v.join(",") : typeof v === "boolean" ? (v ? "1" : "0") : String(v));
  }
  return params;
}

/** The URL's values, typed like the defaults; anything missing is its default. */
function fromParams(params: URLSearchParams, defaults: Filters): Filters {
  const out: Filters = {};
  for (const [key, d] of Object.entries(defaults)) {
    const raw = params.get(key);
    out[key] = raw === null ? d : Array.isArray(d) ? raw.split(",").filter(Boolean) : typeof d === "boolean" ? raw === "1" : typeof d === "number" ? Number(raw) || d : raw;
  }
  return out;
}

/** How many filters are set to something other than their default. */
const countActive = (values: Filters, defaults: Filters) => Object.keys(defaults).filter((k) => !same(values[k], defaults[k])).length;

type FilterFormProps<S extends FormSchema> = {
  schema: S;
  /** Every filter at rest: "" for none, [] for none chosen. Also what Reset returns to. */
  defaults: z.input<S> & Filters;
  /** The filters in force: on load (from the URL), on Apply, on Reset, and on Back/Forward. */
  onApply: (values: z.output<S>) => void;
  /** The form's name: "Filter assets". */
  label: string;
  /** Keep the filters in the URL's query, so a filtered list can be shared and Back works. Default true. */
  syncUrl?: boolean;
  children: ReactNode;
  labels?: { apply?: string; reset?: string };
};

/** Apply and Reset, with the count of filters on. Inside the Form. */
const Actions = ({ defaults, applied, onReset, labels }: { defaults: Filters; applied: Filters; onReset: () => void; labels?: FilterFormProps<FormSchema>["labels"] }) => {
  const { t } = useUiStrings();
  const active = countActive(applied, defaults);
  const { formState } = useFormContext();
  const dirty = formState.isDirty;
  return (
    <div className="flex flex-wrap items-center gap-space-3">
      <Button type="submit" variant="primary" size="sm" icon={<Icon name="filter" size={16} />} disabled={!dirty && active === 0}>
        {labels?.apply ?? t.form.apply}
      </Button>
      <Button type="button" variant="ghost" size="sm" disabled={active === 0 && !dirty} onClick={onReset}>
        {labels?.reset ?? t.form.reset}
      </Button>
      <span aria-live="polite">{active > 0 && <Badge tone="accent">{t.form.activeFilters(active)}</Badge>}</span>
    </div>
  );
};

/** Keeps the form in step with the URL: Back, Forward or a shared link changes the filters. */
const UrlSync = ({ applied, defaults }: { applied: Filters; defaults: Filters }) => {
  const { reset } = useFormContext();
  const key = JSON.stringify(applied);
  const seen = useRef(key);
  useEffect(() => {
    if (seen.current === key) return;
    seen.current = key;
    reset({ ...defaults, ...applied });
  }, [key, applied, defaults, reset]);
  return null;
};

function Inner<S extends FormSchema>({ schema, defaults, onApply, label, syncUrl = true, children, labels }: FilterFormProps<S>) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString();
  const applied = useMemo(() => (syncUrl ? fromParams(new URLSearchParams(query), defaults) : defaults), [syncUrl, query, defaults]);
  const id = `filters-${useId().replace(/[^\w-]/g, "")}`;

  // The filters in force reach the list on load and whenever the URL changes.
  const appliedKey = JSON.stringify(applied);
  useEffect(() => {
    onApply(JSON.parse(appliedKey) as z.output<S>);
    // onApply is the caller's; the applied filters are what this follows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedKey]);

  const go = (values: Filters) => {
    if (!syncUrl) return onApply(values as z.output<S>);
    const next = toParams(values, defaults, new URLSearchParams(query)).toString();
    // A history entry per change, so Back returns to the filters before.
    router.push(next ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  return (
    <Form
      id={id}
      label={label}
      schema={schema}
      defaultValues={{ ...defaults, ...applied } as DefaultValues<z.input<S>>}
      onSubmit={(values) => go(values as Filters)}
      successMessage={false}
      chrome={false}
    >
      {syncUrl && <UrlSync applied={applied} defaults={defaults} />}
      <div role="group" aria-label={label} className="flex flex-col gap-space-4 sm:flex-row sm:flex-wrap sm:items-end">
        {children}
        <Actions defaults={defaults} applied={applied} labels={labels} onReset={() => go(defaults)} />
      </div>
    </Form>
  );
}

/**
 * Filters above a table: the fields in a row (stacked on a phone), Apply
 * and Reset, and how many are on ("3 filters on", announced). Applied
 * filters live in the URL's query (only those that differ from their
 * defaults), so a filtered list can be bookmarked or shared, and Back and
 * Forward step through earlier filters. `onApply` hands the filters in force
 * to the list on load and on every change. Arrays go in as "a,b",
 * booleans as 1/0.
 */
function FilterForm<S extends FormSchema>(props: FilterFormProps<S>) {
  // useSearchParams needs a Suspense boundary to be prerendered.
  return (
    <Suspense fallback={null}>
      <Inner {...props} />
    </Suspense>
  );
}

export { FilterForm, fromParams as filtersFromParams, toParams as filtersToParams };
export type { FilterFormProps };
export type { Filters as FilterValues };
