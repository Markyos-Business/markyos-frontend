"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Button, EmptyHint, Row, Section, useDialog, useToast } from "@/components/ui";
import { InputField } from "@/components/form";
import { formatRelative } from "@/lib/utils";
import type { Workspace } from "@/types";

type VersionHistorySectionProps = {
  ws: Workspace;
  isAr: boolean;
  actorName: string;
};

/** Saved versions of the brand's colours and type, and restoring one. */
export function VersionHistorySection({ ws, isAr, actorName }: VersionHistorySectionProps) {
  const { saveVersionSnapshot, restoreVersion } = useApp();
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const [label, setLabel] = useState("");
  const t = (en: string, ar: string) => (isAr ? ar : en);

  function save() {
    saveVersionSnapshot(ws.id, label.trim() || t("Untitled version", "إصدار بلا عنوان"), actorName);
    setLabel("");
    showToast(t("Version saved.", "حُفظ الإصدار."), "success");
  }

  // Restoring overwrites the live brand. It was a single click next to a list
  // of dates — the easiest way to lose an afternoon's work by aiming one row off.
  async function restore(v: Workspace["versionHistory"][number]) {
    const ok = await confirm({
      title: isAr ? `استعادة "${v.label}"؟` : `Restore "${v.label}"?`,
      body: isAr
        ? `يستبدل هذا ألوان العلامة وخطوطها الحالية بالمحفوظة ${formatRelative(v.createdAt)}. احفظ الحالة الحالية كإصدار أولًا إن أردت طريقًا للعودة.`
        : `This replaces the brand's current colours and type with the ones saved ${formatRelative(v.createdAt)}. Save the current state as a version first if you want a way back.`,
      confirmLabel: t("Restore", "استعادة"),
      tone: "danger",
      isAr,
    });
    if (!ok) return;
    restoreVersion(ws.id, v.id);
    showToast(isAr ? `استُعيد "${v.label}".` : `Restored "${v.label}".`, "success");
  }

  return (
    <Section title={t("Version history", "سجل الإصدارات")} icon="history">
      <div className="flex items-end gap-2.5">
        <InputField
          size="sm"
          value={label}
          dir="auto"
          onChange={(e) => setLabel(e.target.value)}
          aria-label={t("Label for this saved version", "عنوان هذا الإصدار المحفوظ")}
          placeholder={t("Label this version — e.g. Before campaign refresh", "سمِّ هذا الإصدار، مثل: قبل تحديث الحملة")}
          className="flex-1"
        />
        <Button variant="outline" size="sm" onClick={save}>
          {t("Save current as version", "حفظ الحالي كإصدار")}
        </Button>
      </div>
      {ws.versionHistory.length === 0 ? (
        <EmptyHint>{t("No saved versions yet — save one before a risky edit so it's easy to undo.", "لا إصدارات محفوظة بعد. احفظ واحدًا قبل أي تعديل خطِر ليسهل التراجع.")}</EmptyHint>
      ) : (
        <div className="flex flex-col gap-2">
          {ws.versionHistory.map((v) => (
            <Row
              key={v.id}
              label={v.label}
              hint={`${v.createdBy} · ${formatRelative(v.createdAt)} · ${v.colors.length} ${isAr ? "ألوان" : "colors"}`}
              right={
                <Button variant="ghost" size="xs" onClick={() => void restore(v)}>
                  {t("Restore", "استعادة")}
                </Button>
              }
            />
          ))}
        </div>
      )}
    </Section>
  );
}
