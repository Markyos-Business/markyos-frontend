"use client";
import * as Radix from "@radix-ui/react-select";
import { useRef, useState } from "react";
import { Icon } from "../icon";
import { controlClasses, OptionContent, optionGroups, panelClasses, SelectFrame, useNativeTouch, useSelectField } from "./select-parts";
import { NativeSelect } from "./native-select";
import type { SelectProps } from "./types";

export function Select(props: SelectProps) {
  const [own, setOwn] = useState(props.defaultValue ?? ""); const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr"); const trigger = useRef<HTMLButtonElement>(null);
  const native = useNativeTouch(props.useNative); const field = useSelectField(props); const value = props.value ?? own;
  if (native) return <NativeSelect {...props} value={value} onValueChange={next => { setOwn(next); props.onValueChange?.(next); }} />;
  return <SelectFrame props={props} id={field.id}><Radix.Root value={value} name={props.name} required={props.required} disabled={props.disabled} dir={props.dir ?? direction}
    open={open} onOpenChange={next => { if (!props.readOnly) { setDirection(getComputedStyle(trigger.current!).direction === "rtl" ? "rtl" : "ltr"); setOpen(next); } }}
    onValueChange={next => { if (!props.readOnly) { setOwn(next); props.onValueChange?.(next); } }}>
    <Radix.Trigger {...field.accessible} ref={trigger} className={controlClasses} onBlur={props.onBlur}>
      <Radix.Value placeholder={props.placeholder ?? field.labels.placeholder} /><Radix.Icon className="ms-auto"><Icon name="angle-down" size={18} /></Radix.Icon>
    </Radix.Trigger>
    <Radix.Portal><Radix.Content position="popper" sideOffset={6} className={panelClasses} dir={props.dir ?? direction}>
      <Radix.Viewport>{props.options.length === 0 ? <p className="p-space-4 text-body text-text-muted">{field.labels.noOptions}</p> : optionGroups(props.options).map(({ group, options }) => <Radix.Group key={group}>
        {group && <Radix.Label className="px-space-4 py-space-2 text-caption text-text-muted">{group}</Radix.Label>}
        {options.map(option => <Radix.Item key={option.value} value={option.value} textValue={option.label} disabled={option.disabled}
          className="flex min-h-10 cursor-pointer items-center gap-space-3 rounded-lg px-space-4 py-space-2 text-body outline-none transition-colors duration-[120ms] data-highlighted:bg-accent-soft data-highlighted:text-text data-disabled:cursor-not-allowed data-disabled:text-text-disabled motion-reduce:transition-none">
          <OptionContent option={option} /><Radix.ItemText className="sr-only">{option.label}</Radix.ItemText><Radix.ItemIndicator><Icon name="check" size={16} /></Radix.ItemIndicator>
        </Radix.Item>)}
      </Radix.Group>)}</Radix.Viewport>
    </Radix.Content></Radix.Portal>
  </Radix.Root></SelectFrame>;
}
