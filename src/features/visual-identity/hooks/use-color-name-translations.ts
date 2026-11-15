"use client";

import { useEffect, useRef } from "react";
import { useAppActions, useSession } from "@/contexts/AppContext";
import { canEdit, roleOn } from "@/lib/data/access";
import { nameLang, needsNameTranslation } from "@/lib/data/colorNames";
import { translateText } from "@/features/strategy";
import type { Workspace } from "@/types";

/**
 * Translates colour names that have no current translation into the other
 * language, while someone who can edit the brand has it open.
 *
 * One at a time, each name at most twice per visit: the translator is a free
 * service that rate-limits, and a failure (offline, refused) simply leaves the
 * name as written until the next visit. Twice, not once, because a stored
 * translation can be overwritten when the server's copy of the brand arrives
 * moments later; the second pass puts it back. Readers of the published guide never
 * trigger this; they see what was stored.
 */
export function useColorNameTranslations(ws: Workspace | null | undefined) {
  const { setColorNameTranslation } = useAppActions();
  const session = useSession();
  const tries = useRef(new Map<string, number>());
  const editable = !!ws && canEdit(roleOn(ws, session));
  const pending = editable && ws ? ws.colors.filter(needsNameTranslation) : [];
  const key = pending.map((c) => `${c.id}:${c.name}`).join("|");
  const latest = useRef(pending);
  useEffect(() => {
    latest.current = pending;
  });
  const wsId = ws?.id;

  useEffect(() => {
    if (!wsId || !key) return;
    let cancelled = false;
    void (async () => {
      for (const c of latest.current) {
        const attempt = `${c.id}:${c.name}`;
        if (cancelled) return;
        const count = tries.current.get(attempt) ?? 0;
        if (count >= 2) continue;
        tries.current.set(attempt, count + 1);
        const from = nameLang(c.name);
        try {
          const text = (await translateText(c.name, from === "ar" ? "ar-en" : "en-ar")).trim();
          if (!cancelled && text) {
            setColorNameTranslation(wsId, c.id, { lang: from === "ar" ? "en" : "ar", text, source: c.name });
          }
        } catch {
          // Left as written; tried again on the next visit.
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wsId, key, setColorNameTranslation]);
}
