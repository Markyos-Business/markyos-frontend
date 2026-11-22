"use client";

import { useEffect, useRef, useState } from "react";
import { useApp, useAppActions } from "@/contexts/AppContext";
import { useBrandPage } from "@/contexts/pageGuards";
import { useSyncStatus } from "@/contexts/useSyncStatus";
import { useRequest } from "@/hooks/useRequest";
import { useDialog, useToast } from "@/components/ui";
import type { PathStepKey } from "@/types";
import { getOverview } from "../api/overview.api";
import { overviewCopy } from "../copy";
import { siteUrl, versionOf } from "../logic";

/**
 * The Overview page (redesign, 22 Nov 2026): one read of the server's
 * overview for this brand, already filtered by the reader's role, and the
 * few things it can change (skip a step, hand off). It reads again whenever
 * this browser's edits reach the server, so a skip or a hand-off shows as
 * soon as it is stored, not before.
 */
export function useOverviewPage(slug: string) {
  const page = useBrandPage(slug);
  const { state } = useApp();
  const { setPathSkip, setHandoff } = useAppActions();
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const { status } = useSyncStatus();
  const ws = page?.workspace;
  const request = useRequest(() => (ws ? getOverview(ws.id) : Promise.reject(new Error("no brand"))), ws?.id ?? "");
  const { reload } = request;

  // A save landed: what the server worked out may have changed.
  const previous = useRef(status);
  useEffect(() => {
    if (previous.current !== "saved" && status === "saved") reload();
    previous.current = status;
  }, [status, reload]);

  const [origin, setOrigin] = useState("");
  useEffect(() => {
    // The browser's origin isn't derivable from React state.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once on mount
    setOrigin(window.location.origin);
  }, []);

  if (!page || !ws) return null;
  const { isAr } = page;
  const data = request.data;
  const company = versionOf(data?.workspaceType ?? ws.ownerAccountType) === "home";
  const copy = overviewCopy(isAr, company);

  async function handOff() {
    if (!ws) return;
    const ok = await confirm({ title: copy.handoff.title, body: copy.handoff.body, confirmLabel: copy.handoff.confirm });
    if (!ok) return;
    setHandoff(ws.id, state.session?.name || state.session?.email || "");
    showToast(copy.handoff.done);
  }

  return {
    shell: { workspace: ws, section: "Overview", arSection: "نظرة عامة", width: "full" as const },
    view: {
      slug,
      isAr,
      company,
      copy,
      data,
      loading: request.loading && !data,
      failed: !!request.failure && !data,
      onRetry: reload,
      site: data ? siteUrl(data.site, origin) : "",
      onSkip: (step: PathStepKey, skipped: boolean) => setPathSkip(ws.id, step, skipped),
      onHandOff: () => void handOff(),
    },
  };
}
