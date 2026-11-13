"use client";
import { useId, useSyncExternalStore, type ReactNode } from "react";
import { FieldLabel, FieldNote } from "../field/input-field";
import { Avatar } from "../avatar/avatar";
import { Icon } from "../icon";
import { Badge } from "../badge/badge";
import { selectLabels, type SelectCommonProps, type SelectOption } from "./types";

export const controlClasses = "mk-field flex min-h-11 w-full min-w-0 items-center gap-space-3 text-start text-body text-text disabled:cursor-not-allowed disabled:text-text-disabled";
export const panelClasses = "z-popover max-h-[min(24rem,var(--radix-popover-content-available-height,var(--radix-select-content-available-height)))] min-w-[var(--radix-select-trigger-width,12rem)] max-w-[calc(100vw-2rem)] overflow-auto rounded-card bg-surface-1 p-space-2 text-text shadow-edge-pop";
const subscribe = (cb: () => void) => { const m = matchMedia("(pointer: coarse)"); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };
export function useNativeTouch(enabled?: boolean) { return useSyncExternalStore(subscribe, () => !!enabled && matchMedia("(pointer: coarse)").matches, () => false); }
export function useSelectField(props: SelectCommonProps) {
  const generated = useId(); const id = props.id ?? `select-${generated}`;
  const labels = { ...selectLabels, ...props.labels };
  const described = [props["aria-describedby"], (props.error || props.hint || props.success) ? `${id}-note` : undefined].filter(Boolean).join(" ") || undefined;
  return { id, labels, described, accessible: { id, "aria-label": props["aria-label"] ?? props.label ?? labels.placeholder, "aria-labelledby": props["aria-labelledby"], "aria-describedby": described, "aria-invalid": !!props.error, "aria-readonly": !!props.readOnly, "aria-required": !!props.required } };
}
export function SelectFrame({ props, id, children }: { props: SelectCommonProps; id: string; children: ReactNode }) {
  return <div dir={props.dir} className={`flex min-w-0 flex-col gap-space-2 ${props.className ?? ""}`} data-select-state={props.disabled ? "disabled" : props.readOnly ? "readonly" : props.error ? "invalid" : props.success ? "success" : "default"}>
    {props.label && <FieldLabel htmlFor={id} required={props.required}>{props.label}</FieldLabel>}
    {children}
    <FieldNote id={`${id}-note`} error={props.error} hint={props.success ? ({ ...selectLabels, ...props.labels }).success : props.hint} />
  </div>;
}
export function OptionContent({ option }: { option: SelectOption }) {
  return <span className="flex min-w-0 flex-1 items-center gap-space-3">
    {option.avatar && <Avatar {...option.avatar} size={28} />}
    {option.icon && <Icon name={option.icon} size={18} />}
    <span className="min-w-0 flex-1"><span className="block truncate">{option.label}</span>{option.description && <span className="block truncate text-caption text-text-muted">{option.description}</span>}</span>
    {option.status && <Badge dot tone={option.status.tone}>{option.status.label}</Badge>}
  </span>;
}
export function optionGroups(options: readonly SelectOption[]) {
  return Array.from(new Set(options.map(o => o.group ?? ""))).map(group => ({ group, options: options.filter(o => (o.group ?? "") === group) }));
}
