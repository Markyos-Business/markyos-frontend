"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/contexts/AppContext";
import { AccountMenu } from "@/components/features/account";
import { Icon, Avatar, useToast } from "@/components/ui";
import { Workspace, WorkspaceStage } from "@/types";
import { formatRelative } from "@/lib/utils";

/**
 * Every brand the studio is working on, by where it has got to.
 *
 * This is the answer to "can Markyos be our CRM": no, and this is what it does
 * instead. Leads, deals, proposals and invoicing stay in whatever the studio
 * already pays for — Markyos owns the brand's lifecycle, not the agency's
 * business, and a per-seat agency tool would contradict the client-pays
 * ownership model the whole product is built around.
 *
 * Stages are moved by hand. Inferring them from edit activity would be
 * confidently wrong at the exact moment someone relies on the board to decide
 * what to work on.
 */

const STAGES: { key: WorkspaceStage; label: string; arLabel: string; hint: string }[] = [
  { key: "discovery", label: "Discovery", arLabel: "الاستكشاف", hint: "Brief out, listening" },
  { key: "strategy", label: "Strategy", arLabel: "الاستراتيجية", hint: "Positioning being written" },
  { key: "design", label: "Design", arLabel: "التصميم", hint: "Identity being made" },
  { key: "review", label: "Review", arLabel: "المراجعة", hint: "With the client" },
  { key: "delivered", label: "Delivered", arLabel: "تم التسليم", hint: "Handed over" },
  { key: "live", label: "Live", arLabel: "منشور", hint: "In use, being governed" },
];

export default function StudioBoardPage() {
  const { state, hydrated, myWorkspaces, setWorkspaceStage } = useApp();
  const router = useRouter();
  const { showToast } = useToast();
  const [dragging, setDragging] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<WorkspaceStage | null>(null);

  useEffect(() => {
    if (hydrated && !state.session) router.replace("/login");
  }, [hydrated, state.session, router]);

  const columns = useMemo(() => {
    const byStage = new Map<WorkspaceStage, Workspace[]>();
    for (const s of STAGES) byStage.set(s.key, []);
    for (const ws of myWorkspaces) byStage.get(ws.stage)?.push(ws);
    for (const list of byStage.values()) list.sort((a, b) => b.updatedAt - a.updatedAt);
    return byStage;
  }, [myWorkspaces]);

  if (!hydrated || !state.session) return null;

  function move(ws: Workspace, stage: WorkspaceStage) {
    if (ws.stage === stage) return;
    setWorkspaceStage(ws.id, stage);
    showToast(`${ws.name} → ${STAGES.find((s) => s.key === stage)!.label}`, "success");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div
        className="min-h-[68px] shrink-0 flex flex-wrap items-center justify-between gap-3 px-5 sm:px-10 py-3"
        style={{ boxShadow: "inset 0 -1px 0 var(--hairline)" }}
      >
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/markyos-wordmark.svg"
            alt="Markyos"
            style={{ height: 13, filter: "var(--chrome-mark-invert)", opacity: 0.9 }}
          />
          <Link
            href="/brands"
            className="mk-tap text-[13px] font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            Brands
          </Link>
          <span className="text-[13px] font-medium">Board</span>
        </div>
        <AccountMenu />
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-5 px-5 sm:px-10 py-7">
        <div className="max-w-[720px]">
          <h1 className="text-[28px] font-semibold tracking-tight mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
            Studio board
          </h1>
          <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
            Every brand you own, by where it has got to. Drag a card, or use the arrows — this is a
            lifecycle board, not a CRM, so nothing here tracks a deal.
          </p>
        </div>

        {myWorkspaces.length === 0 ? (
          <p className="text-[13.5px]" style={{ color: "var(--text-faint)" }}>
            No brands yet. <Link href="/brands/new" style={{ color: "var(--accent-text)" }}>Start one</Link>.
          </p>
        ) : (
          // Horizontal scroll is correct for a board: six columns cannot be made
          // legible at 390px by stacking them, and a stacked board is just a
          // list that has lost the one thing it was for.
          <div className="flex-1 min-h-0 overflow-x-auto">
            <div className="flex gap-3.5 items-start min-w-max pb-4">
              {STAGES.map((stage) => {
                const items = columns.get(stage.key) ?? [];
                const isOver = overStage === stage.key;
                return (
                  <section
                    key={stage.key}
                    aria-label={`${stage.label} — ${items.length} brand${items.length === 1 ? "" : "s"}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setOverStage(stage.key);
                    }}
                    onDragLeave={() => setOverStage((s) => (s === stage.key ? null : s))}
                    onDrop={(e) => {
                      e.preventDefault();
                      setOverStage(null);
                      const ws = myWorkspaces.find((w) => w.id === dragging);
                      if (ws) move(ws, stage.key);
                      setDragging(null);
                    }}
                    className="w-[268px] shrink-0 rounded-2xl p-3 flex flex-col gap-2.5"
                    style={{
                      background: isOver ? "var(--accent-soft)" : "var(--surface-1)",
                      // `--hairline-strong`, not `--hairline`. The interior
                      // divider was being used as a card edge, which put a
                      // 1.35:1 line around a column sitting 1.12:1 from the
                      // page — neither route found the boundary.
                      boxShadow: isOver ? "inset 0 0 0 1px var(--accent-ring)" : "inset 0 0 0 1px var(--hairline-strong)",
                    }}
                  >
                    <header className="px-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12.5px] font-semibold">{stage.label}</span>
                        <span
                          className="text-[11px] font-semibold px-1.5 py-[2px] rounded"
                          style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}
                        >
                          {items.length}
                        </span>
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>
                        {stage.hint}
                      </div>
                    </header>

                    {items.length === 0 ? (
                      <p className="text-[11.5px] px-1 py-3" style={{ color: "var(--text-faint)" }}>
                        Nothing here.
                      </p>
                    ) : (
                      items.map((ws) => (
                        <BoardCard
                          key={ws.id}
                          ws={ws}
                          stageIndex={STAGES.findIndex((s) => s.key === ws.stage)}
                          onDragStart={() => setDragging(ws.id)}
                          onDragEnd={() => setDragging(null)}
                          onMove={(dir) => {
                            const i = STAGES.findIndex((s) => s.key === ws.stage);
                            const next = STAGES[i + dir];
                            if (next) move(ws, next.key);
                          }}
                        />
                      ))
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BoardCard({
  ws,
  stageIndex,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  ws: Workspace;
  stageIndex: number;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMove: (dir: 1 | -1) => void;
}) {
  const pendingDrafts = ws.drafts.filter((d) => d.status === "pending").length;
  const openBriefs = ws.briefs.filter((b) => !b.revokedAt && b.status !== "submitted" && b.status !== "draft").length;

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="rounded-xl p-3 flex flex-col gap-2 cursor-grab active:cursor-grabbing"
      style={{ background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--hairline-strong)" }}
    >
      {/* The avatar is inside the link, not beside it.

          Two reasons, and they are the same reason. The name alone was a 19px
          target — under the 24px floor, and the primary thing anyone does with
          a card. And the mark and the name are one identity, so by the law of
          common region they should be one object to point at rather than a
          picture next to a link that goes somewhere. */}
      <Link
        href={`/w/${ws.slug}/overview`}
        className="flex items-center gap-2.5 min-w-0 rounded-lg -m-1 p-1"
        style={{ color: "var(--text)", minHeight: 34 }}
      >
        <Avatar initials={ws.initials} size={26} />
        <span dir="auto" className="bidi-auto text-[12.5px] font-semibold truncate">
          {ws.name}
        </span>
      </Link>

      {(pendingDrafts > 0 || openBriefs > 0) && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {pendingDrafts > 0 && (
            <Link
              href={`/w/${ws.slug}/drafts`}
              className="mk-tap text-[10.5px] font-semibold px-2 rounded"
              style={{ background: "var(--accent-soft)", color: "var(--accent-on-soft)" }}
            >
              {pendingDrafts} waiting
            </Link>
          )}
          {openBriefs > 0 && (
            <Link
              href={`/w/${ws.slug}/brief`}
              className="mk-tap text-[10.5px] font-semibold px-2 rounded"
              style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}
            >
              brief out
            </Link>
          )}
        </div>
      )}

      <div className="flex items-center gap-1">
        <span className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>
          {formatRelative(ws.updatedAt)}
        </span>
        {/* Buttons as well as dragging: drag-and-drop is unusable with a
            keyboard and awkward on a touch screen, and a board you can only
            operate with a mouse is a board half the team cannot use. */}
        <span className="ms-auto flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={stageIndex <= 0}
            aria-label={`Move ${ws.name} back a stage`}
            className="mk-icon-btn cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="angle-left" size={13} style={{ color: "var(--text-muted)" }} />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={stageIndex >= 5}
            aria-label={`Move ${ws.name} on a stage`}
            className="mk-icon-btn cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="angle-right" size={13} style={{ color: "var(--text-muted)" }} />
          </button>
        </span>
      </div>
    </article>
  );
}
