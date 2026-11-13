"use client";
import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { useRef, useState } from "react";
import { Icon } from "../primitives/Icon";
import { Button } from "../buttons/Button";
import { controlClasses, OptionContent, optionGroups, panelClasses, SelectFrame, useSelectField } from "./SelectParts";
import type { ComboboxProps, MultiSelectProps, SelectOption } from "./types";

type SearchSelectProps = Omit<ComboboxProps, "value" | "defaultValue" | "onValueChange"> & {
  values: string[]; onValuesChange: (values: string[]) => void; multiple?: boolean;
  maxSelections?: number; maxVisibleTags?: number; loading?: boolean; loadError?: boolean; onRetry?: () => void;
  remote?: boolean; selectedOptions?: readonly SelectOption[];
};

/** Shared cmdk search/list interaction, with Radix handling portals and dismissal. */
export function SearchSelect(props: SearchSelectProps) {
  const field = useSelectField(props); const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false); const [ownQuery, setQuery] = useState("");
  const [created, setCreated] = useState<SelectOption[]>([]); const [creating, setCreating] = useState(false); const [createError, setCreateError] = useState(false);
  const [direction, setDirection] = useState<"rtl" | "ltr">("ltr");
  const query = props.search ?? ownQuery; const options = [...props.options, ...created.filter(o => !props.options.some(p => p.value === o.value))];
  const chosen = props.values.map(v => options.find(o => o.value === v) ?? props.selectedOptions?.find(o => o.value === v) ?? { value: v, label: v });
  const visible = props.remote ? options : options.filter(o => `${o.label} ${o.description ?? ""} ${o.group ?? ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const max = props.multiple && props.maxSelections !== undefined && props.values.length >= props.maxSelections;
  const canCreate = props.creatable && query.trim() && !options.some(o => o.label.toLocaleLowerCase() === query.trim().toLocaleLowerCase());
  const setSearch = (value: string) => { setQuery(value); props.onSearchChange?.(value); };
  const choose = (option: SelectOption) => {
    if (props.disabled || props.readOnly || option.disabled) return;
    if (props.multiple) {
      if (props.values.includes(option.value)) props.onValuesChange(props.values.filter(v => v !== option.value));
      else if (!max) props.onValuesChange([...props.values, option.value]);
    } else { props.onValuesChange([option.value]); setOpen(false); }
  };
  async function create() {
    setCreating(true); setCreateError(false);
    try { const option = await (props.onCreate?.(query.trim()) ?? { value: query.trim(), label: query.trim() }); setCreated(prev => [...prev, option]); choose(option); setSearch(""); }
    catch { setCreateError(true); }
    finally { setCreating(false); }
  }
  return <SelectFrame props={props} id={field.id}>
    <Popover.Root open={open} onOpenChange={next => { if (!props.disabled && !props.readOnly) { setDirection(getComputedStyle(trigger.current!).direction === "rtl" ? "rtl" : "ltr"); setOpen(next); } }}>
      <div className="flex min-w-0 flex-wrap items-center gap-space-2 rounded-lg bg-surface-2 px-space-3">
        {props.multiple && chosen.slice(0, props.maxVisibleTags ?? 3).map(option => <span key={option.value} className="inline-flex max-w-full items-center gap-space-1 rounded-md bg-accent-soft px-space-2 py-space-1 text-caption text-text">
          <span className="max-w-36 truncate">{option.label}</span><button type="button" aria-label={field.labels.remove(option.label)} disabled={props.disabled || props.readOnly} onClick={() => choose(option)} className="mk-tap flex size-6 items-center justify-center"><Icon name="times" size={16} /></button>
        </span>)}
        {props.multiple && chosen.length > (props.maxVisibleTags ?? 3) && <span className="text-caption">{field.labels.overflow(chosen.length - (props.maxVisibleTags ?? 3))}</span>}
        <Popover.Trigger asChild><button {...field.accessible} ref={trigger} type="button" role="combobox" aria-expanded={open} aria-controls={open ? `${field.id}-options` : undefined} aria-haspopup="listbox" disabled={props.disabled} onBlur={props.onBlur} className={`${controlClasses} min-w-16 flex-1`}>
          {!props.multiple && chosen[0] ? <OptionContent option={chosen[0]} /> : <span className="truncate text-text-muted">{props.multiple && chosen.length ? field.labels.selected(chosen.length) : props.placeholder ?? field.labels.placeholder}</span>}
          <Icon name="angle-down" size={18} className="ms-auto shrink-0" />
        </button></Popover.Trigger>
      </div>
      {props.name && props.values.map(value => <input key={value} type="hidden" name={props.name} value={value} />)}
      <Popover.Portal><Popover.Content align="start" sideOffset={6} collisionPadding={12} dir={props.dir ?? direction} className={`${panelClasses} w-80`}
        onOpenAutoFocus={e => { e.preventDefault(); requestAnimationFrame(() => document.getElementById(`${field.id}-search`)?.focus()); }}>
        <Command shouldFilter={false} loop label={props.label ?? field.labels.search} onKeyDown={e => { if (e.key === "Tab") setOpen(false); }}>
          <Command.Input id={`${field.id}-search`} aria-label={field.labels.search} placeholder={field.labels.search} value={query} onValueChange={setSearch} className="mk-field w-full text-body" />
          <Command.List id={`${field.id}-options`} aria-label={props.label ?? field.labels.placeholder} aria-multiselectable={props.multiple || undefined} className="max-h-64 overflow-auto" aria-busy={props.loading || creating}>
            {props.loading || creating ? <div role="status" className="p-space-4 text-body text-text-muted">{field.labels.loading}</div> : props.loadError || createError ? <div role="alert" className="p-space-4 text-body"><p>{field.labels.loadError}</p><Button size="sm" onClick={createError ? create : props.onRetry}>{field.labels.retry}</Button></div> : <>
              {!visible.length && !canCreate && <Command.Empty className="p-space-4 text-body text-text-muted">{query ? field.labels.noResults : field.labels.noOptions}</Command.Empty>}
              {optionGroups(visible).map(({ group, options: groupOptions }) => <Command.Group key={group} heading={group || undefined} className="[&_[cmdk-group-heading]]:px-space-4 [&_[cmdk-group-heading]]:py-space-2 [&_[cmdk-group-heading]]:text-caption [&_[cmdk-group-heading]]:text-text-muted">
                {groupOptions.map(option => <Command.Item key={option.value} value={option.value} disabled={option.disabled || (!!max && !props.values.includes(option.value))} onSelect={() => choose(option)}
                  data-checked={props.values.includes(option.value)} aria-label={option.label}
                  className="flex min-h-10 cursor-pointer items-center gap-space-3 rounded-lg px-space-4 py-space-2 text-body outline-none transition-colors duration-[120ms] data-[selected=true]:bg-accent-soft data-[disabled=true]:cursor-not-allowed data-[disabled=true]:text-text-disabled motion-reduce:transition-none">
                  <OptionContent option={option} />{props.values.includes(option.value) && <Icon name="check" size={16} />}
                </Command.Item>)}
              </Command.Group>)}
              {canCreate && !max && <Command.Item value={`create:${query}`} onSelect={create} className="mk-tap flex min-h-10 items-center gap-space-3 rounded-lg px-space-4 text-body data-[selected=true]:bg-accent-soft"><Icon name="plus" size={16} />{field.labels.create(query.trim())}</Command.Item>}
            </>}
          </Command.List>
        </Command>
        {max && <p role="status" className="p-space-3 text-caption text-text-muted">{field.labels.maxReached(props.maxSelections!)}</p>}
      </Popover.Content></Popover.Portal>
    </Popover.Root>
    <span role="status" className="sr-only">{field.labels.selected(props.values.length)}</span>
  </SelectFrame>;
}
export type { SearchSelectProps };
// MultiSelectProps is intentionally kept in the public types module.
export type { MultiSelectProps };
