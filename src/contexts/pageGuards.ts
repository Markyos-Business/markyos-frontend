"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp, useCurrentAccount } from "./AppContext";

/** The brand a /w/[slug] page is about, and the language its chrome is in. Null until it's known. */
export function useBrandPage(slug: string) {
  const { getWorkspace, uiLang } = useApp();
  const workspace = getWorkspace(slug);
  if (!workspace) return null;
  return { workspace, isAr: uiLang(workspace) === "ar" };
}

/**
 * A studio-wide page's guard: sends someone signed out to log in (and back
 * here after, given `next`), and says which language the chrome is in.
 * `ready` is false until the session is known and present.
 */
export function useStudioPage(next?: string) {
  const { state, hydrated } = useApp();
  const account = useCurrentAccount();
  const router = useRouter();
  useEffect(() => {
    if (hydrated && !state.session) router.replace(next ? `/login?next=${next}` : "/login");
  }, [hydrated, state.session, router, next]);
  return { ready: hydrated && !!state.session, isAr: account?.adminLang === "ar" };
}

/** A route with nothing of its own, which sends you on to `path`. */
export function useRedirect(path: string) {
  const router = useRouter();
  useEffect(() => {
    router.replace(path);
  }, [path, router]);
}
