"use client";

import type { ReactNode } from "react";
import { Tabs } from "@/components/ui";
import type { StyleGuideCopy } from "../../constants";

type DemoState = "ready" | "loading" | "empty" | "error";

type GuideSectionProps = { id: string; title: string; children: ReactNode };

/** One group of components, with an anchor the contents list links to. */
const GuideSection = ({ id, title, children }: GuideSectionProps) => (
  <section id={id} aria-labelledby={`${id}-title`} className="flex scroll-mt-space-11 flex-col gap-5" data-guide-section={id}>
    <h2 id={`${id}-title`} className="text-h3 font-medium text-text">
      {title}
    </h2>
    {children}
  </section>
);

type DemoProps = { name: string; children: ReactNode; className?: string };

/** A component's name over its variants. */
const Demo = ({ name, children, className = "" }: DemoProps) => (
  <div className="flex flex-col gap-space-5 rounded-card bg-surface-1 p-space-8 shadow-edge">
    <h3 dir="ltr" className="text-caption font-medium text-text-muted">
      {name}
    </h3>
    <div className={className}>{children}</div>
  </div>
);

type StateTabsProps = { c: StyleGuideCopy; value: DemoState; onChange: (state: DemoState) => void; label: string };

/** Ready / Loading / Empty / Error, for the components that load data. */
const StateTabs = ({ c, value, onChange, label }: StateTabsProps) => (
  <Tabs
    variant="pill"
    label={label}
    active={value}
    onChange={onChange}
    tabs={(["ready", "loading", "empty", "error"] as const).map((key) => ({ key, label: c.states[key] }))}
  />
);

export { Demo, GuideSection, StateTabs };
export type { DemoState };
