"use client";

import { useState } from "react";
import { useDialog, useToast } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { API_ENABLED } from "@/lib/api/client";
import { endMySession, listMySessions, signOutOtherSessions } from "../services/accountService";
import type { MySession } from "../types";

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

/** Where you're signed in, and signing other browsers out. */
export function useMySessions() {
  const [version, setVersion] = useState(0);
  // The browser-only build has no server sessions to list.
  const sessions = useRequest(() => (API_ENABLED ? listMySessions() : Promise.resolve([])), `my-sessions:${version}`);
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const reload = () => setVersion((v) => v + 1);

  const deviceName = (s: MySession) =>
    s.browser && s.os ? `${s.browser} on ${s.os}` : s.browser ?? s.os ?? "Unknown browser";

  async function signOut(session: MySession) {
    const ok = await confirm({
      title: `Sign out of ${deviceName(session)}?`,
      body: "That browser has to sign in again within 15 minutes.",
      confirmLabel: "Sign out",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await endMySession(session.id);
      showToast("Signed out of that browser.", "success");
      reload();
    } catch (err) {
      showToast(message(err), "danger");
    }
  }

  async function signOutOthers() {
    const ok = await confirm({
      title: "Sign out of every other browser?",
      body: "They each have to sign in again within 15 minutes. This browser stays signed in.",
      confirmLabel: "Sign out others",
      tone: "danger",
    });
    if (!ok) return;
    try {
      const { signedOut } = await signOutOtherSessions();
      showToast(signedOut === 1 ? "Signed out of 1 other browser." : `Signed out of ${signedOut} other browsers.`, "success");
      reload();
    } catch (err) {
      showToast(message(err), "danger");
    }
  }

  const others = (sessions.data ?? []).filter((s) => !s.current).length;
  return { ...sessions, deviceName, signOut, signOutOthers, others };
}

export type MySessionsState = ReturnType<typeof useMySessions>;
