"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { homePath } from "@/lib/data/access";
import { LoginForm } from "./LoginForm";

/**
 * The login screen, for someone signed out. Someone signed in has no business
 * here: they're sent where they were going, or to their start page. This is
 * also what moves them on after a successful sign-in: the session lands, the
 * form unmounts, and this runs with the account in hand.
 */
export function LoginView() {
  const { state, hydrated } = useApp();
  const account = useCurrentAccount();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const home = homePath(account);
  useEffect(() => {
    if (hydrated && state.session) router.replace(next || home);
  }, [hydrated, state.session, router, next, home]);

  // The form mounts only after hydration. That lets it read the lockout
  // straight from `sessionStorage` in a `useState` initialiser: there is no
  // server pass for that first value to disagree with.
  if (!hydrated || state.session) return null;
  return <LoginForm />;
}
