"use client";

import { useEffect, useState } from "react";
import { API_ENABLED } from "@/lib/api/client";
import { fetchShareLink } from "@/lib/api/public";
import { useApp } from "@/contexts/AppContext";
import type { ShareLink, Workspace } from "@/types";

type Found = { ws: Workspace; link: ShareLink } | undefined;

/**
 * The brand a share link opens.
 *
 * With a backend it comes from the server, so the link works for whoever it
 * was sent to. Without one it is looked up in this browser's own brands, as
 * before — which only ever worked for the studio that made it.
 */
export function useShareLink(token: string): { loaded: boolean; found: Found } {
  const { hydrated, resolveShareLink } = useApp();
  const [server, setServer] = useState<{ token: string; found: Found } | null>(null);

  useEffect(() => {
    if (!API_ENABLED) return;
    let cancelled = false;
    fetchShareLink(token).then(
      (found) => !cancelled && setServer({ token, found: found ?? undefined }),
      () => !cancelled && setServer({ token, found: undefined })
    );
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!API_ENABLED) return { loaded: hydrated, found: hydrated ? resolveShareLink(token) : undefined };
  const current = server?.token === token ? server : null;
  return { loaded: !!current, found: current?.found };
}
