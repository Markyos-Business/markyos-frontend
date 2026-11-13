"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { initialsFor } from "@/lib/utils";
import { Avatar } from "../avatar/avatar";
import { TextareaField, type TextareaFieldProps } from "../field/textarea-field";
import { DropdownPanel } from "../listbox/dropdown-panel";
import { MultiSelect } from "../select/multi-select";
import type { SelectCommonProps, SelectOption } from "../select/types";
import { useUiStrings } from "../ui-strings";

type Presence = "online" | "busy" | "away" | "offline";

type Person = { id: string; name: string; email?: string; avatarUrl?: string; presence?: Presence };

const PRESENCE_TONE = { online: "success", busy: "danger", away: "warning", offline: "neutral" } as const;

type PeoplePickerProps = Omit<SelectCommonProps, "label"> & {
  label?: string;
  people: readonly Person[];
  /** Chosen people's ids. */
  value: string[];
  onChange: (ids: string[]) => void;
  /** The most people at once. */
  max?: number;
};

/**
 * Reviewers, owners, a team: search people by name or email and add them as
 * chips, each with their avatar (or initials) and presence. Built on
 * MultiSelect, so the keyboard and the chips behave like every other picker.
 */
const PeoplePicker = ({ people, value, onChange, max, label, ...rest }: PeoplePickerProps) => {
  const { t } = useUiStrings();
  const options = useMemo<SelectOption[]>(
    () =>
      people.map((p) => ({
        value: p.id,
        label: p.name,
        description: p.email,
        avatar: { src: p.avatarUrl, initials: initialsFor(p.name) },
        status: p.presence ? { label: t.presence[p.presence], tone: PRESENCE_TONE[p.presence] } : undefined,
      })),
    [people, t],
  );
  return <MultiSelect {...rest} label={label ?? t.people} options={options} value={value} onValueChange={onChange} maxSelections={max} labels={{ search: t.searchPeople, noResults: t.noPeople, ...rest.labels }} />;
};

type MentionTextareaProps = Omit<TextareaFieldProps, "value" | "onChange"> & {
  value: string;
  onChange: (text: string) => void;
  people: readonly Person[];
  /** The people mentioned in the text, by id, whenever it changes. */
  onMentionsChange?: (ids: string[]) => void;
};

/** The "@nour" being typed just before the caret, if any. */
const typedMention = (text: string, caret: number) => text.slice(0, caret).match(/(^|\s)@([\p{L}\p{N}_.-]*)$/u);

/**
 * A text area where "@" brings up people to mention: the list follows what's
 * typed after the "@", the arrow keys move through it, Enter or Tab puts
 * "@Name" in, Escape closes it. It's a combobox for assistive tech, so the
 * highlighted person is announced.
 */
const MentionTextarea = ({ value, onChange, people, onMentionsChange, hint, ...rest }: MentionTextareaProps) => {
  const { t } = useUiStrings();
  const listId = `${useId()}-people`;
  const area = useRef<HTMLTextAreaElement | null>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const matches = query === null ? [] : people.filter((p) => `${p.name} ${p.email ?? ""}`.toLowerCase().includes(query.toLowerCase())).slice(0, 6);
  const open = query !== null;

  const report = (text: string) => onMentionsChange?.(people.filter((p) => text.includes(`@${p.name}`)).map((p) => p.id));

  const read = (text: string, caret: number) => {
    const m = typedMention(text, caret);
    setQuery(m ? m[2] : null);
    setActive(0);
  };

  const insert = (person: Person) => {
    const el = area.current;
    if (!el) return;
    const caret = el.selectionStart ?? value.length;
    const m = typedMention(value, caret);
    if (!m) return;
    const start = caret - m[2].length - 1;
    const next = `${value.slice(0, start)}@${person.name} ${value.slice(caret)}`;
    onChange(next);
    report(next);
    setQuery(null);
    const at = start + person.name.length + 2;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(at, at);
    });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setQuery(null);
    } else if (matches.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setActive((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length);
    } else if (matches.length && (e.key === "Enter" || e.key === "Tab")) {
      e.preventDefault();
      insert(matches[active]);
    }
  };

  return (
    <>
      <TextareaField
        {...rest}
        ref={area}
        value={value}
        hint={hint ?? t.mentionHint}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && matches[active] ? `${listId}-${matches[active].id}` : undefined}
        onChange={(e) => {
          onChange(e.target.value);
          report(e.target.value);
          read(e.target.value, e.target.selectionStart ?? e.target.value.length);
        }}
        onKeyDown={onKeyDown}
        onClick={(e) => read(e.currentTarget.value, e.currentTarget.selectionStart ?? 0)}
        onBlur={() => setQuery(null)}
      />
      {open && (
        <DropdownPanel anchor={area} onOutside={() => setQuery(null)} width={280}>
          <ul id={listId} role="listbox" aria-label={t.people} className="flex flex-col">
            {matches.length === 0 ? (
              <li className="px-space-4 py-space-3 text-caption text-text-muted">{t.noPeople}</li>
            ) : (
              matches.map((p, i) => (
                <li
                  key={p.id}
                  id={`${listId}-${p.id}`}
                  role="option"
                  aria-selected={i === active}
                  // mousedown, so the textarea keeps focus and its caret.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insert(p);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex min-h-control-sm cursor-pointer items-center gap-space-3 rounded-md px-space-3 ${i === active ? "bg-ink-soft" : ""}`}
                >
                  <Avatar initials={initialsFor(p.name)} src={p.avatarUrl} size={24} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-body text-text">{p.name}</span>
                    {p.email && (
                      <span dir="ltr" className="truncate text-caption text-text-muted">
                        {p.email}
                      </span>
                    )}
                  </span>
                </li>
              ))
            )}
          </ul>
        </DropdownPanel>
      )}
    </>
  );
};

export { MentionTextarea, PeoplePicker };
export type { MentionTextareaProps, PeoplePickerProps, Person, Presence };
