"use client";

import { Button, Icon, IconButton } from "@/components/ui";
import { InputField, SelectField } from "@/components/form";
import type { TeamMember } from "@/types";
import { ROLE_META } from "../constants";
import type { Participant, ParticipantRole } from "../types";

type ParticipantsEditorProps = {
  participants: Participant[];
  onChange: (participants: Participant[]) => void;
  /** The brand's team; its client contacts can be added in one click. */
  team: TeamMember[];
  isAr: boolean;
};

const roleOptions = (isAr: boolean) =>
  (Object.keys(ROLE_META) as ParticipantRole[]).map((role) => ({ value: role, label: ROLE_META[role][isAr ? "ar" : "en"] }));

/**
 * Who was on the call. Speakers found in a transcript are mapped in the
 * preview panel; this list is everyone else, typed in or picked from the
 * brand's team.
 */
export function ParticipantsEditor({ participants, onChange, team, isAr }: ParticipantsEditorProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const manual = participants.map((p, index) => ({ p, index })).filter(({ p }) => !p.label);
  const names = new Set(participants.map((p) => p.name.trim().toLowerCase()));
  const suggestions = team.filter((m) => m.name.trim() && !names.has(m.name.trim().toLowerCase()));

  const set = (index: number, patch: Partial<Participant>) => onChange(participants.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  const remove = (index: number) => onChange(participants.filter((_, i) => i !== index));
  const add = (person: Participant) => onChange([...participants, person]);

  return (
    <div className="flex flex-col gap-space-5">
      {manual.map(({ p, index }) => (
        <div key={index} className="grid grid-cols-[minmax(0,1fr)_140px_auto] items-end gap-space-4">
          <InputField label={t("Name", "الاسم")} value={p.name} dir="auto" onChange={(e) => set(index, { name: e.target.value })} />
          <SelectField label={t("Role", "الدور")} value={p.role} onChange={(e) => set(index, { role: e.target.value as ParticipantRole })} options={roleOptions(isAr)} />
          <IconButton icon="times" label={t(`Remove ${p.name || "person"}`, `إزالة ${p.name || "الشخص"}`)} onClick={() => remove(index)} />
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-space-3">
        <Button variant="outline" size="sm" icon={<Icon name="plus" size={16} />} onClick={() => add({ name: "", role: "client" })}>
          {t("Add person", "إضافة شخص")}
        </Button>
        {suggestions.slice(0, 6).map((m) => (
          <Button
            key={m.id}
            variant="ghost"
            size="sm"
            icon={<Icon name="user" size={16} />}
            onClick={() => add({ name: m.name, role: m.role === "client" ? "client" : "studio" })}
          >
            <span className="bidi-plain">{m.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * Everyone on the call, once: a speaker mapped from the transcript wins over a
 * hand-added person with the same name, and empty rows are dropped.
 */
export function mergeParticipants(participants: Participant[]): Participant[] {
  const mapped = new Set(participants.filter((p) => p.label).map((p) => p.name.trim().toLowerCase()));
  return participants
    .map((p) => ({ ...p, name: p.name.trim() }))
    .filter((p) => p.name && (p.label || !mapped.has(p.name.toLowerCase())));
}

/** A speaker's likely role: a team member's own name says which side they're on. */
export function guessRole(label: string, team: TeamMember[]): ParticipantRole {
  const first = label.trim().split(/\s+/)[0]?.toLowerCase();
  const member = team.find((m) => m.name.trim().split(/\s+/)[0]?.toLowerCase() === first);
  if (!member) return "client";
  return member.role === "client" ? "client" : "studio";
}
