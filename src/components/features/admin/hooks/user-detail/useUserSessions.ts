"use client";

import { useDialog, useToast } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { endUserSession, listUserSessions } from "../../services/adminService";
import type { AdminSession } from "../../types";
import { useAdminLang } from "../shared/useAdminLang";

/** Where an account is signed in, and signing one browser out. */
export function useUserSessions(userId: string, version: number, onChanged: () => void) {
  const sessions = useRequest(() => listUserSessions(userId), `sessions:${userId}:${version}`);
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const { c, isAr } = useAdminLang();

  const deviceName = (s: AdminSession) =>
    s.browser && s.os ? c.sessions.on(s.browser, s.os) : s.browser ?? s.os ?? c.sessions.unknown;

  async function signOut(session: AdminSession) {
    const ok = await confirm({
      title: c.confirm.endSessionTitle(deviceName(session)),
      body: c.confirm.endSessionBody,
      confirmLabel: c.confirm.signOut,
      tone: "danger",
      isAr,
    });
    if (!ok) return;
    try {
      await endUserSession(userId, session.id);
      showToast(c.toasts.sessionEnded, "success");
      onChanged();
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err), "danger");
    }
  }

  return { ...sessions, deviceName, signOut };
}
