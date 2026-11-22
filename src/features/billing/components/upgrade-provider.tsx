"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useApp } from "@/contexts/AppContext";
import type { Workspace } from "@/types";
import type { UpgradeReason } from "../types";
import { UpgradeModal } from "./upgrade-modal";

type Request = { wsId: string; reason: UpgradeReason; onDone?: () => void };
type Upgrade = { open: (request: { ws: Workspace; reason: UpgradeReason; onDone?: () => void }) => void };

const UpgradeContext = createContext<Upgrade | null>(null);

/**
 * Holds the one upgrade modal for the whole app. The brand is read live from
 * the app state, so the modal sees the billing the server returns as soon as
 * it lands (the plan never comes from the caller).
 */
export function UpgradeProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null);
  const { state } = useApp();
  const ws = request ? state.workspaces.find((w) => w.id === request.wsId) : undefined;

  const open = useCallback<Upgrade["open"]>(({ ws, reason, onDone }) => setRequest({ wsId: ws.id, reason, onDone }), []);
  const value = useMemo(() => ({ open }), [open]);

  return (
    <UpgradeContext.Provider value={value}>
      {children}
      {request && ws && (
        <UpgradeModal ws={ws} reason={request.reason} onDone={request.onDone} onClose={() => setRequest(null)} />
      )}
    </UpgradeContext.Provider>
  );
}

export function useUpgrade(): Upgrade {
  const value = useContext(UpgradeContext);
  if (!value) throw new Error("useUpgrade needs <UpgradeProvider> (app/layout.tsx).");
  return value;
}
