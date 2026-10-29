"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";

type ConfirmState = { status: "working" } | { status: "done"; email: string } | { status: "failed"; error: string };

/**
 * The link from a new inbox: confirms the email change once, on arrival. A
 * second try would fail (the link is spent), so it runs once even when React
 * runs effects twice in development.
 */
export function useConfirmEmail() {
  const { confirmEmailChange, state } = useApp();
  const token = useSearchParams().get("token");
  const [result, setResult] = useState<ConfirmState>({ status: "working" });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResult({ status: "failed", error: "That link is missing its code. Open it from the email again." });
      return;
    }
    void confirmEmailChange(token).then((out) =>
      setResult(out.email ? { status: "done", email: out.email } : { status: "failed", error: out.error ?? "That link didn't work." })
    );
  }, [token, confirmEmailChange]);

  return { result, signedIn: Boolean(state.session) };
}
