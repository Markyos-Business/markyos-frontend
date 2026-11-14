"use client";
import { forwardRef, useState } from "react";
import type { ReactNode } from "react";
import { TabsRoot, type TabsRootProps } from "./tabs";
import type { TabLabels } from "./tabs-context";
import { TabsList } from "./tabs-list";
import { TabsTrigger } from "./tabs-trigger";
import { TabsContent } from "./tabs-content";
export interface StepperStep { id: string; label: string; content?: ReactNode; completed?: boolean; error?: boolean; }
export interface StepperTabsProps extends Omit<TabsRootProps, "items" | "children"> { steps: readonly StepperStep[]; label?: string; triggerLabels?: TabLabels; linear?: boolean; completedLabel?: string; errorLabel?: string; upcomingReason?: string; }
export const StepperTabs = forwardRef<HTMLDivElement, StepperTabsProps>(function StepperTabs({ steps, label = "Campaign steps", linear, completedLabel = "Completed", errorLabel = "Has errors", upcomingReason = "Complete earlier steps", value, defaultValue, onValueChange, triggerLabels, ...props }, ref) {
  const [local, setLocal] = useState(defaultValue ?? steps[0]?.id ?? "");
  const active = value ?? local;
  const currentIndex = steps.findIndex(step => step.id === active);
  const blocked = (index: number) => !!linear && index > currentIndex && !steps.slice(0, index).every(step => step.completed);
  return <TabsRoot {...props} ref={ref} value={active} onValueChange={next => { setLocal(next); onValueChange?.(next); }} onBeforeChange={async (next, previous) => !blocked(steps.findIndex(step => step.id === next)) && (props.onBeforeChange ? props.onBeforeChange(next, previous) : true)}>
    <TabsList label={label}>{steps.map((step, index) => <TabsTrigger {...triggerLabels} key={step.id} value={step.id} aria-current={active === step.id ? "step" : undefined} status={step.error ? "error" : step.completed ? "success" : undefined} errorLabel={errorLabel} successLabel={completedLabel} icon={step.completed ? "check" : undefined} disabledReason={blocked(index) ? upcomingReason : undefined} position={index + 1} total={steps.length}><span aria-hidden="true" className="inline-flex size-5 items-center justify-center rounded-full bg-ink-soft text-caption">{index + 1}</span>{step.label}</TabsTrigger>)}</TabsList>
    {steps.map(step => <TabsContent key={step.id} value={step.id}>{step.content}</TabsContent>)}
  </TabsRoot>;
});
