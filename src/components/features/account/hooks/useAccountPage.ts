"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/components/ui";
import type { Workspace } from "@/types";
import { isAccountTab, type AccountTab } from "../constants";

const richnessOf = (w: Workspace) =>
  w.colors.length +
  Object.values(w.logo).filter((s) => s.phase === "attached").length * 2 +
  (w.overviewHtml.length > 60 ? 2 : 0) +
  w.signOffPins.length +
  w.approvals.length;

/**
 * The account page: which tab is open (seeded from `?tab=`, so a pasted link
 * opens on the thing it was about), the organisation's numbers, SSO and the
 * audit log. Reads the URL, so it renders under a Suspense boundary.
 */
export function useAccountPage() {
  const { state, hydrated, setSso, myWorkspaces } = useApp();
  const { showToast } = useToast();
  const router = useRouter();
  const search = useSearchParams();
  const [ssoDomain, setSsoDomain] = useState("");
  const requested = search.get("tab");
  const [tab, setTab] = useState<AccountTab>(isAccountTab(requested) ? requested : "profile");

  useEffect(() => {
    if (hydrated && !state.session) router.replace("/login");
  }, [hydrated, state.session, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSsoDomain(state.sso.domain);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  if (!hydrated || !state.session) return null;

  // Billing and the organisation stats are about this account, so they count
  // the brands it owns — not every brand in the browser, and not the ones it
  // was only invited onto, which someone else pays for.
  const workspaces = myWorkspaces.filter((w) => w.ownerAccountId === state.session?.accountId);
  const maxRichness = Math.max(1, ...workspaces.map(richnessOf));

  function exportAuditLog() {
    const blob = new Blob([JSON.stringify(state.auditLog, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `markyos-audit-log-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    showToast("Audit log exported.", "success");
  }

  return {
    tab,
    onTab: setTab,
    workspaces,
    usage: {
      stats: {
        workspaces: workspaces.length,
        shared: workspaces.filter((w) => w.sharedStatus === "shared").length,
        colors: workspaces.reduce((n, w) => n + w.colors.length, 0),
        logos: workspaces.reduce((n, w) => n + Object.values(w.logo).filter((s) => s.phase === "attached").length, 0),
        signOffs: workspaces.reduce((n, w) => n + w.signOffPins.length, 0),
        approvals: workspaces.reduce((n, w) => n + w.approvals.length, 0),
      },
      richness: workspaces.map((w) => ({ id: w.id, name: w.name, value: richnessOf(w), share: richnessOf(w) / maxRichness })),
    },
    sso: {
      enabled: state.sso.enabled,
      provider: state.sso.provider,
      domain: ssoDomain,
      onToggle: () => setSso({ enabled: !state.sso.enabled }),
      onProvider: (provider: string) => setSso({ provider }),
      onDomain: (domain: string) => {
        setSsoDomain(domain);
        setSso({ domain });
      },
    },
    audit: { entries: state.auditLog.slice(0, 30), hasEntries: state.auditLog.length > 0, onExport: exportAuditLog },
  };
}

export type AccountPageState = NonNullable<ReturnType<typeof useAccountPage>>;
