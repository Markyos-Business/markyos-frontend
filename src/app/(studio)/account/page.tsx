"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/contexts/AppContext";
import { useToast, Button, Icon, PageHeader, StatTile, Tabs, TextField } from "@/components/ui";
import { Section, Row, Switch, EmptyHint } from "@/components/ui/composites/SectionUI";
import { ProfilePanel, BillingPanel } from "@/components/features/account";
import { formatRelative } from "@/lib/utils";

type Tab = "profile" | "billing" | "organisation";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "profile", label: "Profile", icon: "user" },
  { key: "billing", label: "Subscription", icon: "credit-card" },
  { key: "organisation", label: "Organisation", icon: "shield-alt" },
];

const isTab = (v: string | null): v is Tab =>
  v === "profile" || v === "billing" || v === "organisation";

/*
 * The Suspense boundary is required, not decorative.
 *
 * `useSearchParams` reads something that only exists per request, so calling it
 * in a client component that the build tries to prerender fails the build
 * outright — "useSearchParams() should be wrapped in a suspense boundary".
 * The boundary is what lets everything above it prerender while this part waits
 * for the URL. The fallback is null because the page below renders nothing
 * until the store hydrates anyway, so a skeleton here would flash and vanish.
 */
export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountPageBody />
    </Suspense>
  );
}

function AccountPageBody() {
  const { state, hydrated, setSso, myWorkspaces } = useApp();
  const { showToast } = useToast();
  const router = useRouter();
  const search = useSearchParams();
  const [ssoDomain, setSsoDomain] = useState("");
  // Seeded from the URL so the account menu can link straight at a tab, and a
  // link someone pastes to a colleague opens on the thing it was about.
  const requested = search.get("tab");
  const [tab, setTab] = useState<Tab>(isTab(requested) ? requested : "profile");

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
  const totalColors = workspaces.reduce((n, w) => n + w.colors.length, 0);
  const totalLogos = workspaces.reduce((n, w) => n + Object.values(w.logo).filter((s) => s.phase === "attached").length, 0);
  const totalSignOffs = workspaces.reduce((n, w) => n + w.signOffPins.length, 0);
  const totalApprovals = workspaces.reduce((n, w) => n + w.approvals.length, 0);
  const sharedCount = workspaces.filter((w) => w.sharedStatus === "shared").length;

  const richness = (w: (typeof workspaces)[number]) =>
    w.colors.length +
    Object.values(w.logo).filter((s) => s.phase === "attached").length * 2 +
    (w.overviewHtml.length > 60 ? 2 : 0) +
    w.signOffPins.length +
    w.approvals.length;
  const maxRichness = Math.max(1, ...workspaces.map(richness));

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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-topbar shrink-0 flex items-center px-space-6 sm:px-space-10">
        {/* The arrow points back the way you came, so it turns in Arabic. */}
        <Link href="/brands" className="mk-tap gap-space-3 text-body font-medium text-text-muted hover:text-text">
          <Icon name="arrow-left" size={18} className="rtl:-scale-x-100" />
          Brands
        </Link>
      </header>

      <div className="flex-1 px-space-6 sm:px-space-10 pb-space-10 flex flex-col gap-5 max-w-[760px] w-full mx-auto">
        <PageHeader
          title="Account"
          description="Your details and sign-in, what this account is paying for, and the organisation-wide controls."
        />

        <Tabs label="Account" tabs={TABS} active={tab} onChange={setTab} />

        <div key={tab} className="flex flex-col gap-5">
        {tab === "profile" && <ProfilePanel />}

        {tab === "billing" && <BillingPanel workspaces={workspaces} />}

        {tab === "organisation" && (
        <>
        {/* Usage analytics */}
        <Section title="Usage analytics" icon="chart-line">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-4">
            <StatTile value={workspaces.length} label="Workspaces" />
            <StatTile value={sharedCount} label="Shared with clients" />
            <StatTile value={totalColors} label="Colors defined" />
            <StatTile value={totalLogos} label="Logo files" />
            <StatTile value={totalSignOffs} label="Sign-off notes" />
            <StatTile value={totalApprovals} label="Change proposals" />
          </div>
          <div className="flex flex-col gap-space-3">
            <span className="text-caption text-text-muted">Content richness by brand</span>
            {workspaces.map((w) => (
              <div key={w.id} className="flex items-center gap-space-4">
                <span className="text-caption font-medium w-35 truncate shrink-0">{w.name}</span>
                {/* The spec's progress bar: a 6px track on the neutral tint. */}
                <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-ink-soft">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(richness(w) / maxRichness) * 100}%` }} />
                </div>
                <span className="text-caption font-medium tabular-nums w-6 text-end text-text-muted">{richness(w)}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* SSO */}
        <Section title="Single sign-on" icon="id-badge">
          <Row
            label="Require SSO for this account"
            hint="Blocks email/password login once a real identity provider is connected. Enterprise procurement checkbox — needs WorkOS or Auth0 wired up for real."
            right={
              <Switch
                label="Require SSO for this account"
                checked={state.sso.enabled}
                onToggle={() => setSso({ enabled: !state.sso.enabled })}
              />
            }
          />
          {state.sso.enabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-6">
              <div className="flex flex-col gap-space-2">
                <span className="text-caption text-text-muted">Provider</span>
                <div className="flex gap-space-3">
                  {["Okta", "Azure AD", "Google"].map((p) => (
                    <Button key={p} size="sm" variant={state.sso.provider === p ? "ghost" : "outline"} aria-pressed={state.sso.provider === p} onClick={() => setSso({ provider: p })}>
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
              <TextField
                label="Company domain"
                value={ssoDomain}
                onChange={(e) => {
                  setSsoDomain(e.target.value);
                  setSso({ domain: e.target.value });
                }}
                placeholder="yourcompany.com"
              />
            </div>
          )}
        </Section>

        {/* Audit log */}
        <Section
          title="Audit log"
          icon="shield-alt"
          right={
            state.auditLog.length > 0 && (
              <button type="button" onClick={exportAuditLog} className="mk-tap text-overline uppercase text-accent-text">
                Export JSON
              </button>
            )
          }
        >
          {state.auditLog.length === 0 ? (
            <EmptyHint>
              Nothing recorded yet. This fills in as you purchase plans, verify domains, resolve
              approvals, restore versions, and change roles — a defensible record for regulated or
              public-sector brand work.
            </EmptyHint>
          ) : (
            <div className="flex flex-col">
              {state.auditLog.slice(0, 30).map((e, i) => (
                <div
                  key={e.id}
                  className={`flex items-center gap-space-4 py-space-4 text-caption ${i > 0 ? "shadow-rule-t" : ""}`}
                >
                  <span className="w-22 shrink-0 font-medium tabular-nums text-text-muted">{formatRelative(e.ts)}</span>
                  <span className="w-28 shrink-0 truncate font-medium">{e.actor}</span>
                  <span className="flex-1 min-w-0 truncate text-text-secondary">{e.action}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
        </>
        )}
        </div>
      </div>
    </div>
  );
}
