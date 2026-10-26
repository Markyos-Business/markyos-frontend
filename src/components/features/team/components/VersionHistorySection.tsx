"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import {
  Button,
  EmptyHint,
  Row,
  Section,
  useDialog,
  useToast,
} from "@/components/ui";
import { TextInput } from "@/components/form";
import { formatRelative } from "@/lib/utils";
import type { Workspace } from "@/types";

type VersionHistorySectionProps = {
  ws: Workspace;
  isAr: boolean;
  actorName: string;
};

/** Saved versions of the brand's colours and type, and restoring one. */
export function VersionHistorySection({
  ws,
  isAr,
  actorName,
}: VersionHistorySectionProps) {
  const { saveVersionSnapshot, restoreVersion } = useApp();
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const [label, setLabel] = useState("");

  function save() {
    saveVersionSnapshot(ws.id, label.trim() || "Untitled version", actorName);
    setLabel("");
    showToast("Version saved.", "success");
  }

  // Restoring overwrites the live brand. It was a single click next to a list
  // of dates — the easiest way to lose an afternoon's work by aiming one row off.
  async function restore(v: Workspace["versionHistory"][number]) {
    const ok = await confirm({
      title: `Restore "${v.label}"?`,
      body: `This replaces the brand's current colours and type with the ones saved ${formatRelative(
        v.createdAt,
      )}. Save the current state as a version first if you want a way back.`,
      confirmLabel: "Restore",
      tone: "danger",
      isAr,
    });
    if (!ok) return;
    restoreVersion(ws.id, v.id);
    showToast(`Restored "${v.label}".`, "success");
  }

  return (
    <Section title="Version history" icon="history">
      <div className="flex items-end gap-2.5">
        <TextInput
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          aria-label="Label for this saved version"
          placeholder="Label this version — e.g. Before campaign refresh"
          className="flex-1"
        />
        <Button variant="outline" size="sm" onClick={save}>
          Save current as version
        </Button>
      </div>
      {ws.versionHistory.length === 0 ? (
        <EmptyHint>
          No saved versions yet — save one before a risky edit so it&apos;s easy
          to undo.
        </EmptyHint>
      ) : (
        <div className="flex flex-col gap-2">
          {ws.versionHistory.map((v) => (
            <Row
              key={v.id}
              label={v.label}
              hint={`${v.createdBy} · ${formatRelative(v.createdAt)} · ${v.colors.length} colors`}
              right={
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => void restore(v)}
                >
                  Restore
                </Button>
              }
            />
          ))}
        </div>
      )}
    </Section>
  );
}
