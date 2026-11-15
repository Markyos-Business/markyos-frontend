"use client";

import { createContext, useContext } from "react";

type WizardStep = {
  id: string;
  title: string;
  /** The field paths this step owns: what Next checks, and how errors find their step. "reviewers" covers "reviewers.0.email". */
  fields?: readonly string[];
  /** Offer Skip: Next without checking. */
  optional?: boolean;
};

type WizardContextValue = {
  steps: readonly WizardStep[];
  active: string;
  /** Go to a step. Going forward checks the steps in between; back never does. */
  goTo: (id: string) => Promise<boolean>;
};

const WizardContext = createContext<WizardContextValue | null>(null);

/** The wizard around a ReviewStep (or any step content): its steps and how to move between them. */
const useWizard = (): WizardContextValue => {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("This part goes inside <FormWizard>.");
  return ctx;
};

/** Whether `path` belongs to a step that lists `owner`: the path itself or anything under it. */
const owns = (owner: string, path: string) => path === owner || path.startsWith(`${owner}.`);

export { WizardContext, owns, useWizard };
export type { WizardContextValue, WizardStep };
