"use client";

import { useFormContext, type FieldErrors } from "react-hook-form";
import { AlertBanner } from "../alert-banner";
import { useFormMeta } from "./form-context";

/** Every message in a (nested) errors object, with its field path. */
function flatten(errors: FieldErrors, prefix = ""): { path: string; message: string }[] {
  return Object.entries(errors).flatMap(([key, value]) => {
    if (!value || key === "root" || key === "ref") return [];
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value.message === "string" && value.message) return [{ path, message: value.message }];
    return typeof value === "object" ? flatten(value as FieldErrors, path) : [];
  });
}

/**
 * After a submit that didn't pass, every problem in one list at the top: a
 * live alert with a link per field ("Workspace name: Enter a name.") that
 * moves focus to it. It updates as fields are fixed and goes once all are.
 * Form shows it by default; place it yourself with `<Form summary={false}>`.
 */
const ErrorSummary = () => {
  const meta = useFormMeta();
  const { formState, setFocus } = useFormContext();
  const items = flatten(formState.errors);
  const open = meta.summaryOpen && items.length > 0;

  const go = (path: string) => {
    const before = document.activeElement;
    setFocus(path);
    // A control the form library can't focus (a group) still has its id.
    if (document.activeElement === before) document.getElementById(meta.fieldId(path))?.focus();
    (document.activeElement as HTMLElement | null)?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  return (
    <AlertBanner
      tone="danger"
      title={open ? meta.strings.summaryTitle(items.length) : undefined}
      message={
        open ? (
          <ul className="flex list-disc flex-col gap-space-1 ps-space-6">
            {items.map(({ path, message }) => {
              const label = meta.labels.get(path);
              return (
                <li key={path}>
                  <a
                    href={`#${meta.fieldId(path)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      go(path);
                    }}
                    className="underline underline-offset-2 hover:no-underline"
                  >
                    {label ? `${label}: ${message}` : message}
                  </a>
                </li>
              );
            })}
          </ul>
        ) : undefined
      }
    />
  );
};

export { ErrorSummary };
