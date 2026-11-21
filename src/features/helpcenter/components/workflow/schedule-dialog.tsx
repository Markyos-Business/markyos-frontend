"use client";

import { useState } from "react";
import { DateTimePicker, FormDialog } from "@/components/ui";
import { useHelpCopy } from "../../hooks/use-help-copy";
import { tomorrowNine, zoneName } from "./zone";

/** Picks when a language goes live, in the Help timezone. Resolves the "YYYY-MM-DDTHH:mm" chosen. */
export function ScheduleDialog({ zone, onClose, onSchedule }: { zone: string; onClose: () => void; onSchedule: (at: string) => Promise<string | void> }) {
  const { h, lang } = useHelpCopy();
  const t = h.workflow.scheduleDialog;
  const [at, setAt] = useState<string | null>(tomorrowNine(zone));
  return (
    <FormDialog open title={t.title} submitLabel={t.submit} onClose={onClose} onSubmit={() => (at ? onSchedule(at) : t.future)}>
      <DateTimePicker label={t.at(zoneName(zone, lang))} value={at} onChange={setAt} required />
    </FormDialog>
  );
}
