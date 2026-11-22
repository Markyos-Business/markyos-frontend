"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { accountTypeOf } from "@/constants/accountTypes";
import { accountCapabilities } from "@/lib/data/accountExperience";
import { useToast } from "@/components/ui";
import type { Workspace, WorkspaceStage } from "@/types";
import { STAGES } from "../constants";
import { useInterfaceLang } from "@/contexts/useInterfaceLang";

/**
 * Every brand the studio is working on, by where it has got to.
 *
 * This is the answer to "can Markyos be our CRM": no, and this is what it does
 * instead. Leads, deals, proposals and invoicing stay in whatever the studio
 * already pays for — Markyos owns the brand's lifecycle, not the agency's
 * business.
 *
 * Stages are moved by hand. Inferring them from edit activity would be
 * confidently wrong at the exact moment someone relies on the board to decide
 * what to work on.
 */
export function useBoardPage() {
  const { state, hydrated, myWorkspaces, setWorkspaceStage } = useApp();
  const router = useRouter();
  const { showToast } = useToast();
  const { isAr } = useInterfaceLang();
  const [dragging, setDragging] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<WorkspaceStage | null>(null);

  const account = useCurrentAccount();
  // Hidden from a company's navigation, and closed to it by address too.
  const allowed = !account || accountCapabilities(accountTypeOf(account)).board;

  useEffect(() => {
    if (hydrated && !state.session) router.replace("/login");
    else if (hydrated && !allowed) router.replace("/brands");
  }, [hydrated, state.session, allowed, router]);

  const columns = useMemo(() => {
    const byStage = new Map<WorkspaceStage, Workspace[]>();
    for (const s of STAGES) byStage.set(s.key, []);
    for (const ws of myWorkspaces) byStage.get(ws.stage)?.push(ws);
    for (const list of byStage.values()) list.sort((a, b) => b.updatedAt - a.updatedAt);
    return byStage;
  }, [myWorkspaces]);

  if (!hydrated || !state.session || !allowed) return null;

  function move(ws: Workspace, stage: WorkspaceStage) {
    if (ws.stage === stage) return;
    setWorkspaceStage(ws.id, stage);
    const next = STAGES.find((s) => s.key === stage)!;
    showToast(`${ws.name} → ${isAr ? next.arLabel : next.label}`, "success");
  }

  function step(ws: Workspace, dir: 1 | -1) {
    const i = STAGES.findIndex((s) => s.key === ws.stage);
    const next = STAGES[i + dir];
    if (next) move(ws, next.key);
  }

  function drop(stage: WorkspaceStage) {
    setOverStage(null);
    const ws = myWorkspaces.find((w) => w.id === dragging);
    if (ws) move(ws, stage);
    setDragging(null);
  }

  return {
    empty: myWorkspaces.length === 0,
    columns: STAGES.map((stage) => ({ stage, items: columns.get(stage.key) ?? [], isOver: overStage === stage.key })),
    onDragStart: setDragging,
    onDragEnd: () => setDragging(null),
    onDragOver: setOverStage,
    onDragLeave: (stage: WorkspaceStage) => setOverStage((s) => (s === stage ? null : s)),
    onDrop: drop,
    onStep: step,
  };
}

export type BoardState = NonNullable<ReturnType<typeof useBoardPage>>;
