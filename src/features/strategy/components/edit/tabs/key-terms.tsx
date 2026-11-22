"use client";

import { useState } from "react";
import { useAppActions } from "@/contexts/AppContext";
import { ActionsDropdown, Button, Icon, InputField, Section, useDialog } from "@/components/ui";
import { uid } from "@/lib/utils";
import type { KeyTerm, Workspace } from "@/types";
import { strategyCopy } from "../../../copy";


/**
 * Key terms (22 Nov 2026): the brand's own words, a row per term — say it
 * this way in English, this way in Arabic, and not like this. Each field
 * saves when it loses focus; removing a term is in the row's ⋯ menu and asks
 * first. The brand home shows the list read-only.
 */
export function KeyTermsSection({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const c = strategyCopy(isAr).keyTerms;
  const { setKeyTerms } = useAppActions();
  const { confirm } = useDialog();
  const terms = ws.strategy.keyTerms ?? [];

  const update = (id: string, patch: Partial<KeyTerm>) =>
    setKeyTerms(ws.id, terms.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  async function remove(t: KeyTerm) {
    const name = t.say || t.sayAr || c.unnamed;
    const ok = await confirm({ title: c.removeTitle(name), body: c.removeBody, confirmLabel: c.remove, tone: "danger" });
    if (ok) setKeyTerms(ws.id, terms.filter((x) => x.id !== t.id));
  }

  return (
    <Section title={c.title} icon="language">
      <p className="text-body text-text-muted">{c.hint}</p>
      {terms.length === 0 ? (
        <p className="text-body text-text-faint">{c.empty}</p>
      ) : (
        <div role="table" aria-label={c.title} className="flex flex-col gap-space-2">
          <div role="row" className="grid grid-cols-[1fr_1fr_1fr_auto] gap-ctl-row px-space-2 text-caption text-text-muted">
            <span role="columnheader">{c.say}</span>
            <span role="columnheader">{c.arabic}</span>
            <span role="columnheader">{c.avoid}</span>
            <span role="columnheader" className="w-ctl-sm" />
          </div>
          {terms.map((t) => (
            <div role="row" key={t.id} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-ctl-row">
              <TermInput value={t.say} label={c.say} placeholder={c.sayHint} dir="ltr" onCommit={(v) => update(t.id, { say: v })} />
              <TermInput value={t.sayAr} label={c.arabic} placeholder={c.arabicHint} dir="rtl" onCommit={(v) => update(t.id, { sayAr: v })} />
              <TermInput value={t.avoid} label={c.avoid} placeholder={c.avoidHint} dir="auto" onCommit={(v) => update(t.id, { avoid: v })} />
              <span role="cell">
                <ActionsDropdown
                  iconOnly
                  size="sm"
                  label={c.actions(t.say || t.sayAr || c.unnamed)}
                  items={[{ label: c.remove, icon: "trash", tone: "danger", onSelect: () => void remove(t) }]}
                />
              </span>
            </div>
          ))}
        </div>
      )}
      <div>
        <Button
          variant="ghost"
          size="sm"
          icon={<Icon name="plus" size={16} />}
          onClick={() => setKeyTerms(ws.id, [...terms, { id: uid(), say: "", sayAr: "", avoid: "" }])}
        >
          {c.add}
        </Button>
      </div>
    </Section>
  );
}

function TermInput({ value, label, placeholder, dir, onCommit }: { value: string; label: string; placeholder: string; dir: "ltr" | "rtl" | "auto"; onCommit: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  return (
    <span role="cell" className="min-w-0">
      <InputField
        size="sm"
        aria-label={label}
        value={draft}
        dir={dir}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const next = draft.trim();
          if (next !== value) onCommit(next);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setDraft(value);
        }}
      />
    </span>
  );
}

