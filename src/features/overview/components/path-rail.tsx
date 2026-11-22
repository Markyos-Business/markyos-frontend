"use client";

import Link from "next/link";
import { ActionsDropdown, Icon } from "@/components/ui";
import type { PathStepKey } from "@/types";
import type { OverviewCopy } from "../copy";
import { STEP_ICON, stepHref } from "../logic";
import type { OverviewStep, StepState } from "../types";

/** The state as colour *and* shape (filled check, half circle, minus, empty circle) and words. */
const STEP_INK: Record<StepState, string> = {
  done: "text-success",
  in_progress: "text-accent-text",
  skipped: "text-text-faint",
  not_started: "text-text-faint",
};

/**
 * The project path: Discover → Handoff (Overview, 22 Nov 2026). An ordered
 * list of links, one per step, each to the step's own page; the current
 * step carries aria-current="step" and every state is said in words for a
 * screen reader. One row from 1280px (mirrored in Arabic by the flex
 * direction), four columns on a tablet, one column on a phone. Owners and editors skip or un-skip a
 * step from its ⋯ menu.
 */
export function PathRail({
  steps,
  stage,
  slug,
  copy,
  canEdit,
  onSkip,
}: {
  steps: OverviewStep[];
  stage: PathStepKey | null | undefined;
  slug: string;
  copy: OverviewCopy;
  canEdit: boolean;
  onSkip: (step: PathStepKey, skipped: boolean) => void;
}) {
  return (
    <nav aria-label={copy.path.label} className="mk-surface rounded-card bg-surface-1 p-space-5">
      <ol className="flex flex-col gap-space-2 md:grid md:grid-cols-4 xl:flex xl:flex-row xl:gap-space-1">
        {steps.map((step, i) => {
          const current = step.key === stage;
          const label = copy.steps[step.key];
          const state = copy.stepState[step.state];
          return (
            <li key={step.key} className="relative flex min-w-0 flex-1 items-center gap-space-1">
              <Link
                href={stepHref(slug, step.key)}
                aria-current={current ? "step" : undefined}
                // button-audit-ignore: a step of the project path, drawn as a path stop
                className={`mk-shaped flex min-h-ctl-md min-w-0 flex-1 items-center overflow-hidden gap-space-3 rounded-lg px-space-3 py-space-2 xl:flex-col xl:items-start xl:gap-space-1 ${
                  current ? "bg-accent-soft shadow-edge" : ""
                }`}
              >
                <span className="flex items-center gap-space-2">
                  <Icon name={STEP_ICON[step.state]} size={18} className={`shrink-0 ${STEP_INK[step.state]}`} />
                  <span aria-hidden className="text-caption tabular-nums text-text-faint">{i + 1}</span>
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className={`truncate text-body ${current ? "font-medium text-text" : step.state === "skipped" ? "text-text-faint line-through" : "text-text"}`}>
                    {label}
                  </span>
                  <span className="truncate text-caption text-text-muted">
                    {/* The highlight and aria-current mark the current step; a screen reader hears it too. */}
                    {current && <span className="sr-only">{`${copy.path.current}: `}</span>}
                    {state}
                  </span>
                </span>
              </Link>
              {canEdit && step.state !== "done" && (
                <ActionsDropdown
                  iconOnly
                  size="sm"
                  label={copy.path.stepActions(label)}
                  items={[
                    step.state === "skipped"
                      ? { label: copy.path.unskip, icon: "undo", onSelect: () => onSkip(step.key, false) }
                      : { label: copy.path.skip, icon: "minus-circle", onSelect: () => onSkip(step.key, true) },
                  ]}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
