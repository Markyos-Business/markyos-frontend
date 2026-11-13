"use client";
import { useState } from "react";
import { SearchSelect } from "./SearchSelect";
import { controlClasses, optionGroups, SelectFrame, useNativeTouch, useSelectField } from "./SelectParts";
import type { MultiSelectProps } from "./types";
export function MultiSelect(props: MultiSelectProps) {
  const [own, setOwn] = useState(props.defaultValue ?? []); const value = props.value ?? own;
  const native = useNativeTouch(props.useNative); const field = useSelectField(props);
  const change = (next: string[]) => { setOwn(next); props.onValueChange?.(next); };
  if (native) return <SelectFrame props={props} id={field.id}><select {...field.accessible} multiple value={value} name={props.name} required={props.required} disabled={props.disabled} className={controlClasses} onBlur={props.onBlur}
    onMouseDown={e => { if (props.readOnly) e.preventDefault(); }} onKeyDown={e => { if (props.readOnly && e.key !== "Tab") e.preventDefault(); }}
    onChange={e => { const next = Array.from(e.target.selectedOptions, o => o.value); if (!props.readOnly && (!props.maxSelections || next.length <= props.maxSelections)) change(next); }}>
    {optionGroups(props.options).map(({ group, options }) => <optgroup key={group} label={group || props.label || field.labels.placeholder}>{options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}</optgroup>)}
  </select></SelectFrame>;
  return <SearchSelect {...props} values={value} multiple onValuesChange={change} />;
}
