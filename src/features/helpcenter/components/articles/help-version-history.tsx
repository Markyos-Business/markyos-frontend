"use client";

import { useEffect, useState } from "react";
import { ActionsDropdown, AppDate, Button, Icon, Popup, Skeleton, useDialog } from "@/components/ui";
import { listHelpVersions } from "../../api/help.api";
import { useHelpCopy } from "../../hooks/use-help-copy";
import type { HelpVersion } from "../../types";

type Props = { id: string; version: number; canWrite: boolean; onRestore: (number: number) => Promise<boolean> };

/** Every working session with who and when; a version's ⋯ restores it as the draft. */
export function HelpVersionHistory({ id, version, canWrite, onRestore }: Props) {
  const { h, lang } = useHelpCopy();
  const t = h.editor.history;
  const { confirm } = useDialog();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<HelpVersion[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!open) return;
    let live = true;
    listHelpVersions(id).then(
      (value) => live && (setRows(value), setFailed(false)),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [open, id, version, attempt]);

  const restore = async (n: number) => {
    const ok = await confirm({ title: t.confirm.title(n), body: t.confirm.body, confirmLabel: t.confirm.confirm });
    if (ok && (await onRestore(n))) setOpen(false);
  };

  return (
    <>
      <Button variant="secondary" icon={<Icon name="history" size={18} />} onClick={() => { setRows(null); setOpen(true); }}>
        {t.open}
      </Button>
      <Popup open={open} onOpenChange={setOpen} title={t.title} description={t.description} size="md" dir={lang === "ar" ? "rtl" : "ltr"}>
        {failed ? (
          <div role="alert" className="flex items-center justify-between gap-ctl-row text-body text-danger">
            <span>{t.failed}</span>
            <Button variant="secondary" onClick={() => setAttempt((n) => n + 1)}>{t.retry}</Button>
          </div>
        ) : !rows ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : !rows.length ? (
          <p className="text-body text-text-muted">{t.empty}</p>
        ) : (
          <ol className="flex flex-col">
            {rows.map((row) => (
              <li key={row.number} className="flex items-center gap-ctl-row py-space-4 shadow-rule-b last:shadow-none">
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium">{t.version(row.number)}</p>
                  <p className="flex flex-wrap gap-x-space-3 text-caption text-text-muted">
                    <AppDate value={row.updatedAt} format="datetime" locale={lang === "ar" ? "ar-u-nu-latn" : "en-GB"} />
                    {row.createdBy && <bdi dir="auto">{row.createdBy}</bdi>}
                  </p>
                </div>
                {canWrite && (
                  <ActionsDropdown iconOnly size="sm" label={t.actions(row.number)} items={[{ label: t.restore, icon: "history", onSelect: () => void restore(row.number) }]} />
                )}
              </li>
            ))}
          </ol>
        )}
      </Popup>
    </>
  );
}
