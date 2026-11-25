"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import type { Workspace } from "@/types";
import type { UpgradeReason } from "../types";
import { PROMO_CODE_MAX } from "../utils/promo";
import { UpgradeModal } from "./upgrade-modal";

/** `/brands?code=EARLY50`: a promo code the next upgrade modal starts with (plan §3). */
const CODE_PARAM = "code";

type Request = { wsId: string; reason: UpgradeReason; count?: number; startsAt?: number | null; freeSite?: string | null; onDone?: () => void };
/**
 * `count`: for brand_limit, how many brands are without a plan. `startsAt`: for resume, the server's first charge date.
 * `freeSite`: for free_site, the name of the brand the server says holds the free site.
 */
type Upgrade = {
  open: (request: { ws: Workspace; reason: UpgradeReason; count?: number; startsAt?: number | null; freeSite?: string | null; onDone?: () => void }) => void;
};

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

  const linkCode = useLinkCode();

  const open = useCallback<Upgrade["open"]>(({ ws, reason, count, startsAt, freeSite, onDone }) => setRequest({ wsId: ws.id, reason, count, startsAt, freeSite, onDone }), []);
  const value = useMemo(() => ({ open }), [open]);

  return (
    <UpgradeContext.Provider value={value}>
      {children}
      {request && ws && (
        <UpgradeModal ws={ws} reason={request.reason} count={request.count} startsAt={request.startsAt} freeSite={request.freeSite} initialCode={linkCode} onDone={request.onDone} onClose={() => setRequest(null)} />
      )}
    </UpgradeContext.Provider>
  );
}

export function useUpgrade(): Upgrade {
  const value = useContext(UpgradeContext);
  if (!value) throw new Error("useUpgrade needs <UpgradeProvider> (app/layout.tsx).");
  return value;
}

/**
 * A code from a `/brands?code=` link, taken off the address so a reload or a
 * shared link doesn't carry it on. It only fills the field: the server checks
 * it when the owner presses Apply.
 */
function useLinkCode() {
  const pathname = usePathname();
  const [code, setCode] = useState<string | null>(null);
  useEffect(() => {
    if (!pathname?.startsWith("/brands")) return;
    const url = new URL(window.location.href);
    const found = url.searchParams.get(CODE_PARAM)?.trim();
    if (!found) return;
    url.searchParams.delete(CODE_PARAM);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a link once is a sync with the URL
    setCode(found.slice(0, PROMO_CODE_MAX));
  }, [pathname]);
  return code;
}
