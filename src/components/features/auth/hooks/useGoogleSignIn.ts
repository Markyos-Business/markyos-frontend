"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { API_ENABLED } from "@/lib/api/client";
import type { AccountType } from "@/types";
import { GOOGLE_CLIENT_ID } from "../constants";
import type { GooglePendingSignup } from "../types";
import { loadGoogleIdentity, type CodeClient } from "../utils/googleIdentity";

/** Google sign-in works only with a server to check the code, and a client id. */
export const GOOGLE_ENABLED = API_ENABLED && GOOGLE_CLIENT_ID !== "";

type Options = {
  /** The signup form's choice; with it a new person is created at once. */
  accountType?: AccountType | null;
  remember?: boolean;
};

/**
 * Continue with Google.
 *
 * The code client is set up as soon as the button is on screen, because the
 * popup has to open inside the click itself — anything awaited first, like
 * loading Google's script, and browsers block it as an unasked-for window.
 * A signed-in result needs nothing more here: the login and signup views
 * move on as soon as the session lands.
 */
export function useGoogleSignIn({ accountType = null, remember = true }: Options = {}) {
  const { signInWithGoogle } = useApp();
  const client = useRef<CodeClient | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<GooglePendingSignup | null>(null);
  const [chosen, setChosen] = useState<AccountType | null>(null);

  // The callback is built once; it reads the latest form choices from here.
  const latest = useRef({ accountType, remember });
  useEffect(() => {
    latest.current = { accountType, remember };
  }, [accountType, remember]);

  useEffect(() => {
    if (!GOOGLE_ENABLED) return;
    let cancelled = false;
    loadGoogleIdentity()
      .then(() => {
        if (cancelled || !window.google) return;
        client.current = window.google.accounts.oauth2.initCodeClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "openid email profile",
          ux_mode: "popup",
          callback: async (response) => {
            if (!response.code) {
              setBusy(false);
              if (response.error && response.error !== "access_denied") setError("Google sign-in didn't go through. Try again.");
              return;
            }
            const { accountType: type, remember: keep } = latest.current;
            const out = await signInWithGoogle({ code: response.code, accountType: type ?? undefined, remember: keep });
            setBusy(false);
            if (out.error) setError(out.error);
            else if (out.pending) setPending(out.pending);
          },
          // Closing the popup isn't an error worth a message.
          error_callback: () => setBusy(false),
        });
      })
      .catch(() => {
        if (!cancelled) setError("Google sign-in couldn't load. Check your connection and try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [signInWithGoogle]);

  function start() {
    setError(null);
    if (!client.current) {
      setError("Google sign-in is still loading. Try again in a moment.");
      return;
    }
    setBusy(true);
    client.current.requestCode();
  }

  /** A new person picked their account type: create the account. */
  async function finish() {
    if (!pending || !chosen || busy) return;
    setBusy(true);
    setError(null);
    const out = await signInWithGoogle({ signupToken: pending.signupToken, accountType: chosen, remember });
    setBusy(false);
    if (out.error) setError(out.error);
  }

  return {
    enabled: GOOGLE_ENABLED,
    busy,
    error,
    pending,
    chosen,
    choose: setChosen,
    start,
    finish,
    cancel: () => {
      setPending(null);
      setChosen(null);
    },
  };
}

export type GoogleSignInState = ReturnType<typeof useGoogleSignIn>;
