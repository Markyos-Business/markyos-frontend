"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Drawer } from "@/components/ui";
import { useHelpCopy } from "../../hooks/use-help-copy";
import { HelpPanel } from "./help-panel";

type HelpPanelApi = {
  /** Opens the panel: on an article (its slug in either language), or on its front page. */
  openHelp: (slug?: string) => void;
};

const HelpPanelContext = createContext<HelpPanelApi | null>(null);

/**
 * The in-app Help panel: one per signed-in area, opened from the sidebar's
 * Help item or a screen's ? button (`HelpButton`). It reads the Help Center
 * as the signed-in person, so signed-in-only articles are there too.
 */
export function HelpPanelProvider({ children }: { children: ReactNode }) {
  const { h } = useHelpCopy();
  const [open, setOpen] = useState(false);
  // A new key each time it opens, so the panel starts fresh on what was asked for.
  const [request, setRequest] = useState<{ slug?: string; key: number }>({ key: 0 });

  const openHelp = useCallback((slug?: string) => {
    setRequest((r) => ({ slug, key: r.key + 1 }));
    setOpen(true);
  }, []);
  const api = useMemo(() => ({ openHelp }), [openHelp]);

  return (
    <HelpPanelContext.Provider value={api}>
      {children}
      <Drawer open={open} title={h.panel.title} onClose={() => setOpen(false)} closeLabel={h.panel.close}>
        {open && <HelpPanel key={request.key} initialSlug={request.slug} />}
      </Drawer>
    </HelpPanelContext.Provider>
  );
}

/** `openHelp`, or null outside a HelpPanelProvider (the button then hides). */
export function useHelpPanel(): HelpPanelApi | null {
  return useContext(HelpPanelContext);
}
