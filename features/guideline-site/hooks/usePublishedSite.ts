"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPublicSite, unlockPublicSite, type PublicSite } from "@/core/api/public";

/**
 * The published guideline at `/v/<slug>`, from the server.
 *
 * `site` is null until the first answer arrives. `unlock` checks a password
 * on the server and, when it matches, reads the site again with the unlock
 * it was given.
 */
export function usePublishedSite(slug: string, enabled: boolean) {
  const [state, setState] = useState<{ slug: string; site: PublicSite } | null>(null);
  const [reads, setReads] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetchPublicSite(slug).then(
      (site) => !cancelled && setState({ slug, site }),
      () => !cancelled && setState({ slug, site: { status: "missing" } })
    );
    return () => {
      cancelled = true;
    };
  }, [slug, enabled, reads]);

  const unlock = useCallback(
    async (password: string) => {
      const ok = await unlockPublicSite(slug, password);
      if (ok) setReads((n) => n + 1);
      return ok;
    },
    [slug]
  );

  return { site: state?.slug === slug ? state.site : null, unlock };
}
