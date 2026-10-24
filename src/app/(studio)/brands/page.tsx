"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { ACCOUNT_TYPES, accountTypeOf, limitsOf } from "@/constants/accountTypes";
import { roleOn } from "@/lib/data/access";
import { AccountMenu } from "@/components/features/account";
import { Button, Icon, PageHeader } from "@/components/ui";
import { SearchField } from "@/components/form";
import { WorkspaceCard } from "@/components/features/brands";

type SortKey = "updated" | "name";

export default function BrandsPage() {
  const { state, hydrated, myWorkspaces } = useApp();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");

  useEffect(() => {
    if (hydrated && !state.session) router.replace("/login");
  }, [hydrated, state.session, router]);

  // `myWorkspaces`, not every workspace in the browser. Two people can hold
  // accounts here and neither should see the other's brands.
  const workspaces = useMemo(() => {
    const filtered = myWorkspaces.filter((w) =>
      w.name.toLowerCase().includes(query.trim().toLowerCase())
    );
    return [...filtered].sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : b.updatedAt - a.updatedAt
    );
  }, [myWorkspaces, query, sort]);

  const sharedCount = myWorkspaces.filter((w) => w.sharedStatus === "shared").length;

  // The account type names what a brand is here ("client brands" for a
  // studio, "your brand" for a company) and how many this account may own.
  const account = useCurrentAccount();
  const type = ACCOUNT_TYPES[accountTypeOf(account)];
  const brandLimit = limitsOf(account).brands;
  const owned = myWorkspaces.filter((w) => w.ownerAccountId === state.session?.accountId).length;
  const atLimit = brandLimit !== null && owned >= brandLimit;
  const limitNote = `${type.label} accounts own up to ${brandLimit} ${brandLimit === 1 ? type.home.noun : type.home.nounPlural}. Contact Markyos to change your plan.`;

  if (!hydrated || !state.session) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* The spec's top bar: 84px and transparent. It wraps on a phone, so the
          search field and the avatar never push past the edge. */}
      <header className="min-h-topbar shrink-0 flex flex-wrap items-center justify-between gap-space-5 px-space-6 sm:px-space-10 py-space-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/markyos-wordmark.svg" alt="Markyos" className="h-3.5 [filter:var(--chrome-mark-invert)]" />
        <div className="flex items-center gap-space-6">
          <div className="w-36 sm:w-56">
            <SearchField label="Search brands" placeholder="Search brands…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {/* On a phone these two fold into the account menu, so the search
              keeps room to type in. Not `mk-tap`: its display is forced and
              would beat `hidden`. */}
          <Link href="/forms" className="hidden min-h-6.5 items-center text-body font-medium text-text-muted hover:text-text sm:inline-flex">
            Forms
          </Link>
          <Link href="/studio/board" className="hidden min-h-6.5 items-center text-body font-medium text-text-muted hover:text-text sm:inline-flex">
            Board
          </Link>
          <Link href="/templates" className="hidden min-h-6.5 items-center text-body font-medium text-text-muted hover:text-text sm:inline-flex">
            Templates
          </Link>
          {/* The text link is gone: the avatar next to it now does the job, and
              two controls side by side going to the same place is just a
              question about which one is the real one. */}
          <AccountMenu
            phoneLinks={[
              { href: "/forms", label: "Forms", arLabel: "النماذج", icon: "clipboard-list" },
              { href: "/studio/board", label: "Board", arLabel: "اللوحة", icon: "th-large" },
              { href: "/templates", label: "Templates", arLabel: "القوالب", icon: "layer-group" },
            ]}
          />
        </div>
      </header>

      <div className="flex-1 px-space-6 sm:px-space-10 pb-space-10 flex flex-col gap-5 max-w-[1240px] w-full mx-auto">
        <PageHeader
          title={account?.isAdmin ? "Your brands" : type.home.title}
          description={`${myWorkspaces.length} workspace${myWorkspaces.length === 1 ? "" : "s"} · ${sharedCount} shared with clients${
            brandLimit !== null ? ` · ${owned} of ${brandLimit} used` : ""
          }`}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSort((s) => (s === "updated" ? "name" : "updated"))}
                icon={<Icon name="arrows-v" size={16} />}
              >
                {sort === "updated" ? "Last edited" : "Name A–Z"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Icon name="plus" size={18} />}
                disabled={atLimit}
                title={atLimit ? limitNote : undefined}
                onClick={() => router.push("/brands/new")}
              >
                New workspace
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {workspaces.map((ws) => (
            // A grid of its own, so the card still fills the cell.
            <div key={ws.id} className="grid">
              <WorkspaceCard workspace={ws} role={roleOn(ws, state.session)} />
            </div>
          ))}
          {atLimit ? (
            // Said where the "new" tile would be, so the limit is found
            // before anyone goes looking for a way round it.
            <div className="rounded-card min-h-54 flex flex-col items-center justify-center gap-space-3 border border-dashed border-line-strong px-space-10 text-center text-text-muted">
              <Icon name="lock" size={22} />
              <span className="text-body">{limitNote}</span>
            </div>
          ) : (
            <Link
              href="/brands/new"
              className="mk-card rounded-card min-h-54 flex flex-col items-center justify-center gap-space-3 border border-dashed border-line-strong text-text-muted"
            >
              <Icon name="plus" size={22} />
              <span className="text-body font-medium">New workspace</span>
            </Link>
          )}
        </div>

        {/*
         * This line used to read "Deleting a workspace revokes its client link
         * immediately" — a warning about an action that does not exist. There
         * is no delete anywhere in the product, and a footnote describing a
         * button nobody can find sends people looking for it.
         *
         * What replaces it is the one fact on this screen with a consequence
         * outside the studio, and the legend for a badge that is otherwise left
         * to be inferred.
         */}
        <div className="mt-auto text-caption text-text-faint">
          A brand marked <span className="text-success">Shared</span> has a live client link —
          anyone holding it can open the guideline. Switch it off in that brand&apos;s Settings.
        </div>
      </div>
    </div>
  );
}
