"use client";
import { useState } from "react";
import { controlClasses, optionGroups, SelectFrame, useSelectField } from "./SelectParts";
import type { SelectProps } from "./types";

export function NativeSelect(props: SelectProps) {
  const [own, setOwn] = useState(props.defaultValue ?? "");
  const value = props.value ?? own; const field = useSelectField(props);
  return <SelectFrame props={props} id={field.id}><select {...field.accessible} name={props.name} disabled={props.disabled} required={props.required} value={value}
    className={controlClasses} onBlur={props.onBlur}
    onMouseDown={e => { if (props.readOnly) e.preventDefault(); }} onKeyDown={e => { if (props.readOnly && e.key !== "Tab") e.preventDefault(); }}
    onChange={e => { if (!props.readOnly) { setOwn(e.target.value); props.onValueChange?.(e.target.value); } }}>
    <option value="" disabled>{props.placeholder ?? field.labels.placeholder}</option>
    {optionGroups(props.options).map(({ group, options }) => group ? <optgroup key={group} label={group}>{options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}</optgroup> : options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>))}
  </select></SelectFrame>;
}
