"use client";

import { createContext, useContext } from "react";
import type { UiStrings } from "../ui-strings";

type FormStrings = UiStrings["form"];

/** Where the last submit landed: nothing yet, saved, or refused by the server. */
type FormOutcome = { kind: "idle" } | { kind: "success"; message?: string } | { kind: "error"; message?: string };

/**
 * What Form shares with its parts beyond react-hook-form's own context: its
 * id, whether it's saving, view or locked, the last outcome, and the field
 * labels the error summary names its links with.
 */
type FormMeta = {
  id: string;
  submitting: boolean;
  /** Fields show as their values; an Edit button switches to editing. */
  view: boolean;
  /** Nothing can be changed here, with `lockedReason` saying why. */
  locked: boolean;
  lockedReason?: string;
  outcome: FormOutcome;
  /** The summary shows after a submit that failed validation. */
  summaryOpen: boolean;
  /** "workspace.name" → "Workspace name", filled by FormField. */
  labels: Map<string, string>;
  /** The id FormField gives a field's control, for the summary's links. */
  fieldId: (name: string) => string;
  /**
   * Check only these field paths (and everything under them) against the
   * schema, now: their errors are set or cleared and the rest are left alone.
   * True when they all pass. A wizard step's Next uses this.
   */
  validate: (paths: readonly string[]) => Promise<boolean>;
  startEdit: () => void;
  /** Back to the saved values (and to view mode, for a form that started there). */
  cancelEdit: () => void;
  strings: FormStrings;
};

const FormMetaContext = createContext<FormMeta | null>(null);

/** Form's state for its parts; throws outside a Form, where it means nothing. */
const useFormMeta = (): FormMeta => {
  const meta = useContext(FormMetaContext);
  if (!meta) throw new Error("This part goes inside <Form>.");
  return meta;
};

export { FormMetaContext, useFormMeta };
export type { FormMeta, FormOutcome, FormStrings };
