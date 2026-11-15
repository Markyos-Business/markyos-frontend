"use client";

import { useRef, useState } from "react";
import type { FieldValues } from "react-hook-form";
import { formatRelative } from "@/lib/utils";
import { AlertBanner } from "../alert-banner";
import { Button } from "../button/button";
import { useUiStrings } from "../ui-strings";
import type { ServerErrors } from "./form";

/** The record as the server has it now. */
type Latest = { version: string | number; updatedBy: string; updatedAt: number };

type ConflictCheckOptions = {
  /** The version the form was loaded from (an etag, an updated_at). */
  version: string | number;
  /** Ask the server for its current version, just before saving. */
  fetchLatest: () => Promise<Latest>;
  /** Reload: replace the form with the server's version (refetch, then reset the form). */
  onReload: (latest: Latest) => void;
  /** The Form's `id`, so Overwrite can submit it again. */
  formId: string;
};

/**
 * Two people editing the same thing: the second save shouldn't silently
 * undo the first. Wrap the save with `guard`; before it runs, the server is
 * asked for its version, and if it moved on since the form was loaded the
 * save stops and `alert` says so ("This changed while you were editing.
 * Updated by Lina Mansour 5m ago.") with Reload (take theirs) and Overwrite
 * (save yours anyway). Place `alert` at the top of the Form.
 *
 *   const conflict = useConflictCheck({ version, fetchLatest, onReload, formId: "brand" });
 *   <Form id="brand" onSubmit={conflict.guard(save)}>{conflict.alert}…</Form>
 */
function useConflictCheck({ version, fetchLatest, onReload, formId }: ConflictCheckOptions) {
  const { t, lang } = useUiStrings();
  // With the moment it was found, so "5m ago" is worked out once, not during render.
  const [conflict, setConflict] = useState<(Latest & { seen: number }) | null>(null);
  // Set by Overwrite for the one submit it starts.
  const force = useRef(false);

  const guard =
    <V extends FieldValues>(save: (values: V) => Promise<ServerErrors<V> | void> | ServerErrors<V> | void) =>
    async (values: V): Promise<ServerErrors<V> | void> => {
      if (!force.current) {
        const latest = await fetchLatest();
        if (String(latest.version) !== String(version)) {
          setConflict({ ...latest, seen: Date.now() });
          return { silent: true };
        }
      }
      force.current = false;
      setConflict(null);
      return save(values);
    };

  const alert = conflict ? (
    <AlertBanner
      tone="warning"
      title={t.form.conflictTitle}
      message={t.form.conflictBody(conflict.updatedBy, formatRelative(conflict.updatedAt, conflict.seen, lang))}
      action={
        <span className="flex flex-wrap gap-space-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setConflict(null);
              onReload(conflict);
            }}
          >
            {t.form.reload}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger-soft"
            onClick={() => {
              force.current = true;
              (document.getElementById(formId) as HTMLFormElement | null)?.requestSubmit();
            }}
          >
            {t.form.overwrite}
          </Button>
        </span>
      }
    />
  ) : null;

  return { guard, alert, conflict };
}

export { useConflictCheck };
export type { ConflictCheckOptions, Latest as ConflictLatest };
