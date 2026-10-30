"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useStudioPage } from "@/contexts/pageGuards";
import { useTheme } from "@/contexts/ThemeProvider";
import { useRequest } from "@/hooks/useRequest";
import { getAnalysis, markExported } from "../../services/briefsService";
import type { Citation } from "../../types";

/**
 * The print view of one analysis: loaded, shown light whatever the app's
 * theme (paper is white), logged as an export, then handed to the browser's
 * print dialog, which saves the PDF.
 */
export function usePrintReport(id: string) {
  const { state } = useApp();
  const { resolved } = useTheme();
  // A new tab restores its session from the cookie first; ask only once signed in.
  const { ready } = useStudioPage(`/print/analysis/${id}`);
  const analysis = useRequest(() => (ready ? getAnalysis(id) : new Promise<never>(() => {})), `print:${id}:${ready}`);
  const [citation, setCitation] = useState<Citation | null>(null);
  const printed = useRef(false);
  const data = analysis.data;
  const brandName = (data && state.workspaces.find((w) => w.id === data.workspaceId)?.name) || data?.workspaceSlug || "";

  // Light for paper, held while this view is open: the theme provider applies
  // the saved theme after this mounts, so a change back is undone at once.
  // The person's own theme returns on the way out.
  const theme = useRef(resolved);
  useEffect(() => {
    theme.current = resolved;
  }, [resolved]);
  useEffect(() => {
    const root = document.documentElement;
    const force = () => {
      if (root.getAttribute("data-theme") !== "light") root.setAttribute("data-theme", "light");
    };
    force();
    const watch = new MutationObserver(force);
    watch.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      watch.disconnect();
      root.setAttribute("data-theme", theme.current);
    };
  }, []);

  useEffect(() => {
    if (!data || printed.current) return;
    printed.current = true;
    void markExported(data.id).catch(() => undefined);
    // A frame for the fonts and layout to settle before the dialog freezes it.
    const timer = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(timer);
  }, [data]);

  return {
    analysis,
    brandName,
    sections: (data?.sections ?? []).filter((s) => s.status === "ready" && s.current).map((s) => ({ key: s.key, current: s.current })),
    citation,
    open: setCitation,
    close: () => setCitation(null),
  };
}
