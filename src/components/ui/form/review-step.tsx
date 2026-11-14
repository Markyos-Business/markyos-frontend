"use client";

import { useId } from "react";
import type { ReactNode } from "react";
import { Button } from "../button/button";
import { Icon } from "../icon";
import { KeyValueList } from "../key-value-list";
import { useFormMeta } from "./form-context";
import { useWizard } from "./form-wizard/wizard-context";

type ReviewSection = {
  /** The wizard step this summarises; its Edit button opens it. */
  step: string;
  /** Default: the step's title. */
  title?: string;
  items: { label: string; value: ReactNode }[];
};

type ReviewStepProps = {
  sections: readonly ReviewSection[];
  /** A line above the sections: "Check everything before you create the campaign." */
  description?: string;
  editLabel?: (title: string) => string;
};

/**
 * The wizard's last look: each step's answers as a titled list, read-only,
 * with an Edit button that goes back to that step (named "Edit details" for
 * screen readers). Empty answers show a dash rather than nothing.
 */
const ReviewStep = ({ sections, description, editLabel }: ReviewStepProps) => {
  const meta = useFormMeta();
  const wizard = useWizard();
  const id = useId();
  return (
    <div className="flex flex-col gap-space-6">
      {description && <p className="text-body text-text-muted">{description}</p>}
      {sections.map((section, i) => {
        const title = section.title ?? wizard.steps.find((st) => st.id === section.step)?.title ?? section.step;
        return (
          <section key={section.step} aria-labelledby={`${id}-${i}`} className="flex flex-col gap-space-4 rounded-card bg-surface-2 p-space-6 shadow-edge">
            <header className="flex items-center justify-between gap-space-4">
              <h3 id={`${id}-${i}`} className="text-h5 font-medium text-text">
                {title}
              </h3>
              <Button type="button" variant="ghost" size="sm" icon={<Icon name="pen" size={16} />} aria-label={(editLabel ?? meta.strings.editStep)(title)} onClick={() => void wizard.goTo(section.step)}>
                {meta.strings.edit}
              </Button>
            </header>
            <KeyValueList items={section.items.map((item) => ({ label: item.label, value: item.value === "" || item.value === null || item.value === undefined ? "—" : item.value }))} />
          </section>
        );
      })}
    </div>
  );
};

export { ReviewStep };
export type { ReviewSection, ReviewStepProps };
