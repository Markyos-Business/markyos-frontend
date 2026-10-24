"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/contexts/AppContext";
import { roleOn } from "@/lib/data/access";
import { AccountMenu } from "@/components/features/account";
import { Icon, PillButton, listItemMotion } from "@/components/ui";
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

  if (!hydrated || !state.session) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Fixed height and a non-wrapping row put the search field, the
          Templates link and the avatar past the right edge of a phone — the
          page scrolled sideways and the avatar was off-screen. Wrapping and an
          auto height cost nothing at desktop width, where it still lays out as
          one row. */}
      <div
        className="min-h-[68px] shrink-0 flex flex-wrap items-center justify-between gap-3 px-5 sm:px-10 py-3"
        style={{ boxShadow: "inset 0 -1px 0 var(--hairline)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/markyos-wordmark.svg"
          alt="Markyos"
          style={{ height: 13, filter: "var(--chrome-mark-invert)", opacity: 0.9 }}
        />
        <div className="flex items-center gap-3.5">
          <label
            className="flex items-center gap-2.5 h-9 px-4 rounded-full w-[150px] sm:w-[220px]"
            style={{ background: "var(--surface-1)" }}
          >
            <Icon name="search" size={16} style={{ color: "var(--text-muted)" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search brands"
              className="bg-transparent outline-none text-[13px] flex-1"
              style={{ color: "var(--text)" }}
            />
          </label>
          <Link href="/studio/board" className="mk-tap text-[13px]" style={{ color: "var(--text-muted)" }}>
            Board
          </Link>
          <Link
            href="/templates"
            className="mk-tap text-[13px]"
            style={{ color: "var(--text-muted)" }}
          >
            Templates
          </Link>
          {/* The text link is gone: the avatar next to it now does the job, and
              two controls side by side going to the same place is just a
              question about which one is the real one. */}
          <AccountMenu />
        </div>
      </div>

      <div className="flex-1 px-5 sm:px-10 py-8 flex flex-col gap-6 max-w-[1240px] w-full mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1
              className="text-[32px] font-semibold tracking-tight mb-1.5"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Your brands
            </h1>
            <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
              {myWorkspaces.length} workspace{myWorkspaces.length === 1 ? "" : "s"} ·{" "}
              {sharedCount} shared with clients
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSort((s) => (s === "updated" ? "name" : "updated"))}
              className="h-9 px-3.5 rounded-full flex items-center gap-2 text-[12px] font-medium cursor-pointer"
              style={{ background: "var(--surface-1)", color: "var(--text-muted)" }}
            >
              {sort === "updated" ? "Last edited" : "Name A–Z"}
              <Icon name="angle-down" size={14} />
            </button>
            <PillButton
              variant="primary"
              size="sm"
              icon={<Icon name="plus" size={15} />}
              onClick={() => router.push("/brands/new")}
            >
              New workspace
            </PillButton>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
          {workspaces.map((ws, i) => {
            const motion = listItemMotion(i);
            return (
              // A grid of its own, so the card still fills the cell.
              <div key={ws.id} className={`grid ${motion.className}`} style={motion.style}>
                <WorkspaceCard workspace={ws} role={roleOn(ws, state.session)} />
              </div>
            );
          })}
          <Link
            href="/brands/new"
            // `hover:bg-[#141414]` painted a near-black tile on the light theme.
            className="mk-card rounded-2xl min-h-[216px] flex flex-col items-center justify-center gap-2.5"
            style={{ boxShadow: "inset 0 0 0 1px var(--hairline-strong)", color: "var(--text-muted)" }}
          >
            <Icon name="plus" size={24} />
            <span className="text-[13px] font-medium">New workspace</span>
          </Link>
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
        <div className="mt-auto text-[12px]" style={{ color: "var(--text-faint)" }}>
          A brand marked <span style={{ color: "var(--success)" }}>Shared</span> has a live client link —
          anyone holding it can open the guideline. Switch it off in that brand&apos;s Settings.
        </div>
      </div>
    </div>
  );
}
