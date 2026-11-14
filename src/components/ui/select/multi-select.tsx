"use client";
import { useState } from "react";
import { SearchSelect } from "./search-select";
import { controlClasses, optionGroups, SelectFrame, useNativeTouch, useSelectField } from "./select-parts";
import type { MultiSelectProps } from "./types";
export function MultiSelect(props: MultiSelectProps) {
  const [own, setOwn] = useState(props.defaultValue ?? []); const value = props.value ?? own;
  const native = useNativeTouch(props.useNative); const field = useSelectField(props);
  const change = (next: string[]) => { setOwn(next); props.onValueChange?.(next); };
  if (native) return <SelectFrame props={props} id={field.id}><select {...field.accessible} multiple value={value} name={props.name} required={props.required} disabled={props.disabled} className={controlClasses} onBlur={props.onBlur}
    onMouseDown={e => { if ((props.readOnly || props.locked)) e.preventDefault(); }} onKeyDown={e => { if ((props.readOnly || props.locked) && e.key !== "Tab") e.preventDefault(); }}
    onChange={e => { const next = Array.from(e.target.selectedOptions, o => o.value); if (!(props.readOnly || props.locked) && (!props.maxSelections || next.length <= props.maxSelections)) change(next); }}>
    {optionGroups(props.options).map(({ group, options }) => <optgroup key={group} label={group || props.label || field.labels.placeholder}>{options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}</optgroup>)}
  </select></SelectFrame>;
  return <SearchSelect {...props} values={value} multiple onValuesChange={change} />;
}
