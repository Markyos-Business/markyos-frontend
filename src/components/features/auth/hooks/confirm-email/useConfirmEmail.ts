"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useAuthLang } from "../shared/useAuthLang";

type ConfirmState = { status: "working" } | { status: "done"; email: string } | { status: "failed"; error: string };

/**
 * The link from a new inbox: confirms the email change once, on arrival. A
 * second try would fail (the link is spent), so it runs once even when React
 * runs effects twice in development.
 */
export function useConfirmEmail() {
  const { c } = useAuthLang();
  // The messages as of now, for effects that run once and must not re-run when the language changes.
  const copy = useRef(c);
  useEffect(() => {
    copy.current = c;
  });
  const { confirmEmailChange, state } = useApp();
  const token = useSearchParams().get("token");
  const [result, setResult] = useState<ConfirmState>({ status: "working" });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setResult({ status: "failed", error: copy.current.errors.linkMissing });
      return;
    }
    void confirmEmailChange(token).then((out) =>
      setResult(out.email ? { status: "done", email: out.email } : { status: "failed", error: out.error ?? copy.current.errors.linkFailed })
    );
  }, [token, confirmEmailChange]);

  return { result, signedIn: Boolean(state.session) };
}
